#!/usr/bin/env node
/**
 * Universal test runner for OCR Checks Server
 * 
 * Usage:
 *   node scripts/run-tests.js [unit|functional|integration|semi] [--watch]
 * 
 * Examples:
 *   node scripts/run-tests.js unit           # Run unit tests only
 *   node scripts/run-tests.js functional     # Run functional tests only
 *   node scripts/run-tests.js integration    # Run integration tests 
 *   node scripts/run-tests.js semi           # Run semi-integration tests
 *   node scripts/run-tests.js                # Run all tests
 */

import Jasmine from 'jasmine';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import { spawn } from 'child_process';
import { globSync } from 'glob';
import { promisify } from 'util';
import { addDevVarsToEnv } from './load-dev-vars.ts';
import { exit } from 'process';

// Get directory info
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Load environment variables from .dev.vars before any other operations
await addDevVarsToEnv();

// Parse command line arguments
const testType = process.argv[2]?.toLowerCase() || 'all';
const testFilter = process.argv[3]; // Get the third argument if provided (e.g., "simple")
const watch = process.argv.includes('--watch');
const dryRun = process.argv.includes('--dry-run');

// DEBUG: Log full command line args
console.log('DEBUG - Full process.argv:', JSON.stringify(process.argv));
console.log('DEBUG - testType:', testType);
console.log('DEBUG - testFilter:', testFilter);

// Set NODE_ENV based on test type for proper API key validation
if (testType === 'integration') {
  process.env.NODE_ENV = 'integration';
  console.log('Setting NODE_ENV to "integration" for integration tests');
} else {
  process.env.NODE_ENV = process.env.NODE_ENV || 'test';
  console.log(`NODE_ENV set to "${process.env.NODE_ENV}"`);
}

console.log(`Test type: ${testType}, Filter: ${testFilter || 'none'}`); // Debug info

// Map test types to their configurations
const testConfigs = {
  unit: {
    spec_files: ['unit/**/*.test.ts'],
    timeoutInterval: 10000
  },
  functional: {
    spec_files: ['functional/**/*.f.test.ts'],
    timeoutInterval: 10000
  },
  integration: {
    spec_files: ['integration/**/*.test.ts'],
    timeoutInterval: 180000, // Increase timeout to 3 minutes for integration tests
    requiresServer: true
  },
  performance: {
    spec_files: ['performance/**/*.test.ts'],
    timeoutInterval: 300000, // 5 minutes for performance tests
    requiresServer: true
  },
  semi: {
    spec_files: ['semi/**/*.test.js'],
    timeoutInterval: 60000
  },
  all: {
    spec_files: [
      'unit/**/*.test.ts',
      'functional/**/*.f.test.ts',
      'semi/**/*.test.js',
      'integration/**/*.test.ts'
    ],
    timeoutInterval: 180000, // Increase timeout to 3 minutes to match integration tests
    requiresServer: true
  }
};

// Validate test type
if (!testConfigs[testType]) {
  console.error(`Invalid test type: ${testType}`);
  console.error('Valid test types: unit, functional, integration, performance, semi, all');
  process.exit(1);
}

// Run GitFlow branch check unless it's bypassed
if (!process.argv.includes('--bypass-gitflow-check')) {
  try {
    console.log('Running GitFlow branch check...');
    // Run the pre-test-check.sh script and make it non-interactive for automated environments
    const preTestCheck = spawn('bash', [join(projectRoot, 'scripts', 'pre-test-check.sh')], {
      stdio: 'inherit',
      env: { ...process.env, NONINTERACTIVE: process.env.CI ? 'true' : 'false' }
    });
    
    // Wait for the pre-test check to complete
    await new Promise((resolve, reject) => {
      preTestCheck.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`GitFlow branch check failed with code ${code}`));
        }
      });
      preTestCheck.on('error', reject);
    });
    
    console.log('GitFlow branch check passed.');
  } catch (error) {
    console.error('GitFlow branch check error:', error.message);
    console.error('To bypass this check, use --bypass-gitflow-check flag');
    process.exit(1);
  }
}

const config = testConfigs[testType];

// Start server if needed
let serverProcess = null;
let serverPid = null;
let serverStartupFailed = false;

if (config.requiresServer) {
  console.log('Starting server for integration tests...');
  
  try {
    // Load environment variables from .dev.vars
    console.log('Loading environment variables from .dev.vars file...');
    await addDevVarsToEnv();
    
    // Check for required API key with enhanced validation
    // The API key should now be loaded from .dev.vars already
    if (!process.env.MISTRAL_API_KEY) {
      console.error('ERROR: No MISTRAL_API_KEY found in .dev.vars file or environment');
      console.error('Please add a valid Mistral API key to your .dev.vars file:');
      console.error('MISTRAL_API_KEY=your_api_key_here');
      console.error('Integration tests cannot run without a valid API key.');
      process.exit(1);
    } else {
      console.log('INFO: Using MISTRAL_API_KEY from .dev.vars');
      console.log(`API Key length: ${process.env.MISTRAL_API_KEY.length} characters`);
      console.log(`API Key first 4 chars: ${process.env.MISTRAL_API_KEY.substring(0, 4)}****`);
    }
    
    // Validate API key format
    const apiKeyPattern = /^[A-Za-z0-9]{32,}$/;
    if (!apiKeyPattern.test(process.env.MISTRAL_API_KEY)) {
      console.warn('WARNING: API key format may be invalid. Mistral API keys are typically 32+ alphanumeric characters.');
    }
    
    // Use a more robust approach to capture output
    // Ensure API key is explicitly set in the child process environment
    const serverEnv = { ...process.env };
    
    // Explicitly log what we're passing to the server
    console.log(`API Key length: ${serverEnv.MISTRAL_API_KEY?.length || 0} characters`);
    console.log(`API Key first 4 chars: ${serverEnv.MISTRAL_API_KEY?.substring(0, 4) || 'undefined'}****`);
    
    // Start the server with the complete environment
    serverProcess = spawn('node', [join(projectRoot, 'scripts', 'start-server.ts')], {
      stdio: ['inherit', 'pipe', 'inherit'],
      detached: false,
      env: serverEnv
    });
  
    // Capture and parse stdout to get the server URL
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(output);
      
      // Check for the server URL message from start-server.ts
      const match = output.match(/Found server URL: (http:\/\/localhost:\d+)/);
      if (match && match[1]) {
        process.env.OCR_API_URL = match[1];
        console.log(`Setting OCR_API_URL environment variable to: ${match[1]}`);
      }
      
      // Parse PID information
      const pidMatch = output.match(/Server PID (\d+) saved to/);
      if (pidMatch && pidMatch[1]) {
        serverPid = parseInt(pidMatch[1], 10);
        console.log(`Detected server process PID: ${serverPid}`);
      }
    });
    
    serverProcess.on('error', (err) => {
      console.error('Failed to start server:', err);
      serverStartupFailed = true;
    });
    
    // Set up handler for child process exit
    serverProcess.on('exit', (code, signal) => {
      console.log(`Server process exited with code ${code} and signal ${signal}`);
      if (code !== 0 && code !== null) {
        serverStartupFailed = true;
        console.error(`Server startup failed with exit code ${code}`);
      }
    });
    
    // Give the server more time to start and be fully ready
    console.log('Waiting for server to be fully ready...');
    
    // Wait longer for server startup
    const serverStartupTimeout = 5000; // 5 seconds - realistic timeout
    console.log(`Giving server ${serverStartupTimeout/1000} seconds to start up...`);
    await new Promise(resolve => setTimeout(resolve, serverStartupTimeout));
    
    // Perform a health check to verify server is responding before running tests
    console.log('Performing health check on server...');
    let serverReady = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        // Get the URL from the process.env (set above) or use default localhost URL
        const serverUrl = process.env.OCR_API_URL || 'http://localhost:8787';
        
        // We use the built-in fetch API (Node.js v18+)
        const response = await fetch(`${serverUrl}/health`);
        if (response.ok) {
          console.log('Server health check passed!');
          console.log(`Server started successfully on port 8787. PID: ${serverPid}`);
          console.log(`To stop the server, run: kill ${serverPid}`);
          serverReady = true;
          break;
        } else {
          console.warn(`Health check failed with status: ${response.status}`);
          if (attempt < 3) {
            console.log(`Retrying in 3 seconds (attempt ${attempt}/3)...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        }
      } catch (error) {
        console.warn(`Health check attempt ${attempt}/3 failed:`, error.message);
        if (attempt < 3) {
          console.log(`Retrying in 3 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
    }
    
    if (!serverReady) {
      console.error('Server health check failed after 3 attempts. Tests may fail.');
    }
    
    // Read the PID file to ensure we have the correct server PID
    try {
      const pidFilePath = join(projectRoot, '.server-pid');
      const pidContent = await fs.readFile(pidFilePath, 'utf8').catch(() => null);
      
      if (pidContent) {
        const filePid = parseInt(pidContent.trim(), 10);
        if (filePid && !isNaN(filePid)) {
          if (!serverPid) {
            serverPid = filePid;
            console.log(`Using server PID from file: ${serverPid}`);
          } else if (serverPid !== filePid) {
            console.log(`Warning: PID mismatch - detected ${serverPid} but file contains ${filePid}`);
            serverPid = filePid; // Trust the file over the detected PID
          }
        }
      } else {
        console.warn('No PID file found or it is empty. Server may not be running properly.');
      }
    } catch (error) {
      console.error(`Error reading server PID file: ${error.message}`);
    }
    
    if (serverStartupFailed) {
      throw new Error('Server startup failed. Check error messages above.');
    }
  } catch (error) {
    console.error(`Server startup error: ${error.message}`);
    console.error('Tests may fail due to server startup issues.');
    // Don't exit here - we'll allow tests to fail naturally
  }
}

// Create and configure Jasmine
const jasmine = new Jasmine();
global.jasmine = jasmine;

// Set default timeout interval
jasmine.jasmine.DEFAULT_TIMEOUT_INTERVAL = config.timeoutInterval;

console.log(`Running ${testType} tests...`);
// If a filter is provided, filter the spec files
let filteredSpecFiles = config.spec_files;
if (testFilter) {
  console.log(`Filter spec files by: ${testFilter}`);
  // Set specific file pattern if a test file is specified
  if ((testFilter ?? '').length > 0) {
    filteredSpecFiles = config.spec_files.map(pattern => {
      // If it's a pattern ending with a wildcard, limit it to files containing the filter
      if (pattern.includes('**')) {
        return pattern
          .replace('**/*', `**/`)
          .replace('**/', `**/*${testFilter}*`);
      }
      // Otherwise, just return files matching the filter
      return pattern.includes(testFilter) ? pattern : null;
    }).filter(Boolean); // Remove null entries 
  }

  console.log(`Filtered spec files (${testFilter}): ${JSON.stringify(filteredSpecFiles)}`);

  // Check that files actually exist
  console.log('Checking for matching test files:');
  filteredSpecFiles.forEach(pattern => {
    const fullPattern = join(projectRoot, 'tests', pattern);
    const matches = globSync(fullPattern);
    console.log(`Pattern ${fullPattern} matched: ${matches.length} files`);
    if (matches.length) {
      console.log(`Found: ${matches.join(', ')}`);
    }
  });
}

jasmine.loadConfig({
  spec_dir: 'tests',
  spec_files: filteredSpecFiles,
  helpers: ['helpers/**/*.js'],
  stopSpecOnExpectationFailure: false,
  random: false,
  timeoutInterval: config.timeoutInterval
});

// Delay configuration for rate limiting
const TEST_DELAY_CONFIG = {
  // Delay between test files to avoid overwhelming APIs with rate limits
  delayBetweenFiles: testType === 'integration' ? 2000 : 0,  // 2 seconds between integration tests
  delayAfterSuite: testType === 'integration' ? 500 : 0,     // 0.5 seconds between suites
};

// Log delay configuration
if (TEST_DELAY_CONFIG.delayBetweenFiles > 0 || TEST_DELAY_CONFIG.delayAfterSuite > 0) {
  console.log('Test delay configuration (for rate limiting):');
  console.log(`- Delay between test files: ${TEST_DELAY_CONFIG.delayBetweenFiles}ms`);
  console.log(`- Delay after test suites: ${TEST_DELAY_CONFIG.delayAfterSuite}ms`);
}

// Function to add delays between tests
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Add reporter for detailed output with rate limiting delays
jasmine.addReporter({
  jasmineStarted: function(suiteInfo) {
    console.log(`Running ${suiteInfo.totalSpecsDefined} tests`);
  },
  suiteStarted: async function(result) {
    console.log(`Suite started: ${result.description}`);
    
    // Add a delay before starting a suite (except for the first one)
    if (TEST_DELAY_CONFIG.delayBetweenFiles > 0) {
      console.log(`Rate limiting: Adding delay of ${TEST_DELAY_CONFIG.delayBetweenFiles}ms before starting next test file`);
      await delay(TEST_DELAY_CONFIG.delayBetweenFiles);
    }
  },
  specStarted: function(result) {
    console.log(`Test started: ${result.description}`);
  },
  specDone: function(result) {
    console.log(`Test finished: ${result.description} - ${result.status}`);
    if (result.status === 'failed') {
      console.log(`Failures: ${JSON.stringify(result.failedExpectations, null, 2)}`);
      console.log(`Stack: ${result.failedExpectations[0]?.stack || 'No stack available'}`);
    }
    if (result.status === 'pending') {
      console.log(`Pending reason: ${result.pendingReason}`);
    }
  },
  suiteDone: async function(result) {
    console.log(`Suite finished: ${result.description}`);
    if (result.failedExpectations && result.failedExpectations.length > 0) {
      console.log(`Suite failures: ${JSON.stringify(result.failedExpectations, null, 2)}`);
    }
    
    // Add a delay after completing a suite
    if (TEST_DELAY_CONFIG.delayAfterSuite > 0) {
      console.log(`Rate limiting: Adding delay of ${TEST_DELAY_CONFIG.delayAfterSuite}ms after suite`);
      await delay(TEST_DELAY_CONFIG.delayAfterSuite);
    }
  },
  jasmineDone: function(result) {
    console.log(`Tests finished with status: ${result.overallStatus}`);
    
    // Show GitFlow reminder if tests failed
    if (result.overallStatus === 'failed') {
      console.log('\n=====================================================');
      console.log('\x1b[33m⚠️  REMINDER: Follow GitFlow Process For Fixes!\x1b[0m');
      console.log('\x1b[36m1. Create a feature branch BEFORE fixing issues:\x1b[0m');
      console.log('   git flow feature start fix-[descriptive-name]');
      console.log('\x1b[36m2. Make fixes on the feature branch\x1b[0m');
      console.log('\x1b[36m3. Run tests again to verify fixes\x1b[0m');
      console.log('\x1b[36m4. Finish the feature when done:\x1b[0m');
      console.log('   git flow feature finish fix-[descriptive-name]');
      console.log('\nSee .claude/rules/gitflow-testing-workflow.md for details');
      console.log('=====================================================\n');
    }
    
    console.log(`Details: ${JSON.stringify(result, null, 2)}`);
    
    // Shutdown server if it was started
    // We'll handle this in the finally block for better reliability
  }
});

// Error handler for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection:');
  console.error('- Reason:', reason);
  console.error('- Promise:', promise);
});

// Handle termination signals to ensure clean shutdown
async function cleanupAndExit(signal) {
  console.log(`\nReceived ${signal} signal, shutting down gracefully...`);
  
  // Try to clean up server processes
  if (serverProcess && serverProcess.pid) {
    console.log(`Terminating server process with PID: ${serverProcess.pid}`);
    try {
      serverProcess.kill('SIGTERM');
      // Give it a moment to terminate
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (e) {
      console.log(`Error shutting down server: ${e.message}`);
    }
  }
  
  // Try to clean up based on PID file
  try {
    const pidFilePath = join(projectRoot, '.server-pid');
    const pidContent = await fs.readFile(pidFilePath, 'utf8').catch(() => null);
    
    if (pidContent) {
      const filePid = parseInt(pidContent.trim(), 10);
      if (filePid && !isNaN(filePid)) {
        console.log(`Terminating server from PID file: ${filePid}`);
        try {
          process.kill(filePid, 'SIGTERM');
        } catch (e) {
          if (e.code !== 'ESRCH') {
            console.log(`Error terminating server process ${filePid}: ${e.message}`);
          }
        }
      }
      
      // Remove the PID file
      await fs.unlink(pidFilePath).catch(() => {});
    }
  } catch (error) {
    // Ignore errors during cleanup
  }
  
  process.exit(signal === 'SIGINT' ? 130 : 143); // Standard exit codes for these signals
}

// Register signal handlers
process.on('SIGINT', () => cleanupAndExit('SIGINT'));  // Ctrl+C
process.on('SIGTERM', () => cleanupAndExit('SIGTERM')); // Kill command

// Execute tests with timeout protection
const timeoutMs = 30000; // Force 30-second timeout for ALL tests

// If dry run, just log tests that would be executed
if (dryRun) {
  console.log(`Dry run - would execute ${testType} tests with spec files:`, config.spec_files);
  console.log('Exiting without running tests');
  process.exit(0);
}

const testsPromise = jasmine.execute();


// Add timeout protection
const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => {
    console.error(`Tests timed out after ${timeoutMs / 1000} seconds`);
    // List files found by glob pattern to help debug
    console.error('Trying to find matching test files:');
    
    try {
      filteredSpecFiles.forEach(pattern => {
        const matches = globSync(pattern, { cwd: join(projectRoot, 'tests') });
        console.error(`Pattern ${pattern} matched: ${JSON.stringify(matches)}`);
      });
    } catch (e) {
      console.error('Error listing files:', e);
    }
    
    reject(new Error(`Tests timed out after ${timeoutMs / 1000} seconds`));
  }, timeoutMs);
});

// Use Promise.race to handle either completion or timeout
try {
  console.log('Starting test execution...');
  
  // Add unhandled rejection handler specifically for the test execution
  const testRejectionHandler = (reason) => {
    console.error('Unhandled rejection during test execution:', reason);
  };
  process.on('unhandledRejection', testRejectionHandler);
  
  // Create a wrapper for testsPromise that catches any errors
  const safeTestsPromise = testsPromise.catch(err => {
    console.error('Caught error from Jasmine execution:', err);
    throw err; // Re-throw to be caught by the outer try/catch
  });
  
  // Run the tests with timeout protection
  const result = await Promise.race([safeTestsPromise, timeoutPromise]);
  
  // Remove the temporary rejection handler
  process.removeListener('unhandledRejection', testRejectionHandler);
  
  console.log('Tests completed with result:', result);
  console.log('Tests completed successfully');
} catch (error) {
  console.error(`\n⚠️ Error during test execution: ${error?.message || 'unknown error'}`);
  if (error?.stack) {
    console.error(error.stack);
  }
  console.error(`Error type: ${error?.constructor?.name || 'Unknown'}`);
  
  // Print more diagnostic information
  console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
  
  // Print out the server process info
  if (serverProcess) {
    console.error(`Server process PID: ${serverProcess.pid}`);
    console.error(`Server process connected: ${serverProcess.connected}`);
    console.error(`Server process killed: ${serverProcess.killed}`);
    console.error(`Server process exit code: ${serverProcess.exitCode}`);
  }
  
  process.exit(1);
} finally {
  // Create a robust shutdown function to clean up all server processes
  async function shutdownServer() {
    console.log('Ensuring server shutdown...');
    
    // 1. Try to kill the direct child process
    if (serverProcess && !serverProcess.killed) {
      console.log(`Terminating server process with PID: ${serverProcess.pid}`);
      try {
        serverProcess.kill('SIGTERM');
        // Wait a moment for graceful shutdown
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.log(`Error shutting down server process: ${e.message}`);
      }
    }
    
    // 2. Try to kill the actual server process which might be different from the child process
    if (serverPid) {
      console.log(`Terminating detected server PID: ${serverPid}`);
      try {
        process.kill(serverPid, 'SIGTERM');
      } catch (e) {
        if (e.code === 'ESRCH') {
          console.log(`Server process ${serverPid} already terminated.`);
        } else {
          console.log(`Error terminating server process ${serverPid}: ${e.message}`);
        }
      }
    }
    
    // 3. Check the PID file and kill that process if it exists
    try {
      const pidFilePath = join(projectRoot, '.server-pid');
      const pidContent = await fs.readFile(pidFilePath, 'utf8').catch(() => null);
      
      if (pidContent) {
        const filePid = parseInt(pidContent.trim(), 10);
        if (filePid && !isNaN(filePid)) {
          console.log(`Terminating server from PID file: ${filePid}`);
          try {
            process.kill(filePid, 'SIGTERM');
          } catch (e) {
            if (e.code === 'ESRCH') {
              console.log(`Server process ${filePid} already terminated.`);
            } else {
              console.log(`Error terminating server process ${filePid}: ${e.message}`);
            }
          }
        }
        
        // Remove the PID file to prevent future confusion
        await fs.unlink(pidFilePath).catch(err => {
          console.log(`Error removing PID file: ${err.message}`);
        });
      }
    } catch (error) {
      console.log(`Error during server process cleanup: ${error.message}`);
    }
    
    console.log('Server shutdown complete.');
  }
  
  // Run the shutdown process
  await shutdownServer();
}