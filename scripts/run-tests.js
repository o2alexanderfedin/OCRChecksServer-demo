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

// Get directory info
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Parse command line arguments
const testType = process.argv[2]?.toLowerCase() || 'all';
const watch = process.argv.includes('--watch');
const dryRun = process.argv.includes('--dry-run');

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
    timeoutInterval: 30000,
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
    timeoutInterval: 60000,
    requiresServer: true
  }
};

// Validate test type
if (!testConfigs[testType]) {
  console.error(`Invalid test type: ${testType}`);
  console.error('Valid test types: unit, functional, integration, semi, all');
  process.exit(1);
}

const config = testConfigs[testType];

// Start server if needed
let serverProcess = null;
if (config.requiresServer) {
  console.log('Starting server for integration tests...');
  serverProcess = spawn('node', [join(projectRoot, 'scripts', 'start-server.js')], {
    stdio: 'inherit',
    detached: false
  });
  
  serverProcess.on('error', (err) => {
    console.error('Failed to start server:', err);
  });
  
  // Give the server a moment to start
  await new Promise(resolve => setTimeout(resolve, 2000));
}

// Create and configure Jasmine
const jasmine = new Jasmine();
global.jasmine = jasmine;

// Set default timeout interval
jasmine.jasmine.DEFAULT_TIMEOUT_INTERVAL = config.timeoutInterval;

console.log(`Running ${testType} tests...`);
jasmine.loadConfig({
  spec_dir: 'tests',
  spec_files: config.spec_files,
  helpers: ['helpers/**/*.js'],
  stopSpecOnExpectationFailure: false,
  random: false,
  timeoutInterval: config.timeoutInterval
});

// Add reporter for detailed output
jasmine.addReporter({
  jasmineStarted: function(suiteInfo) {
    console.log(`Running ${suiteInfo.totalSpecsDefined} tests`);
  },
  suiteStarted: function(result) {
    console.log(`Suite started: ${result.description}`);
  },
  specStarted: function(result) {
    console.log(`Test started: ${result.description}`);
  },
  specDone: function(result) {
    console.log(`Test finished: ${result.description} - ${result.status}`);
    if (result.status === 'failed') {
      console.log(`Failures: ${JSON.stringify(result.failedExpectations, null, 2)}`);
    }
    if (result.status === 'pending') {
      console.log(`Pending reason: ${result.pendingReason}`);
    }
  },
  suiteDone: function(result) {
    console.log(`Suite finished: ${result.description}`);
  },
  jasmineDone: function(result) {
    console.log(`Tests finished with status: ${result.overallStatus}`);
    
    // Shutdown server if it was started
    if (serverProcess) {
      console.log('Shutting down server...');
      if (serverProcess.pid) {
        try {
          process.kill(serverProcess.pid);
        } catch (e) {
          console.log('Error shutting down server:', e.message);
        }
      }
    }
  }
});

// Error handler for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection:');
  console.error('- Reason:', reason);
  console.error('- Promise:', promise);
});

// Execute tests with timeout protection
const timeoutMs = config.timeoutInterval * 2;

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
    reject(new Error(`Tests timed out after ${timeoutMs / 1000} seconds`));
  }, timeoutMs);
});

// Use Promise.race to handle either completion or timeout
try {
  await Promise.race([testsPromise, timeoutPromise]);
  console.log('Tests completed successfully');
} catch (error) {
  console.error(`\n⚠️ Error during test execution: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
} finally {
  // Make sure to shut down the server
  if (serverProcess && serverProcess.pid) {
    try {
      process.kill(serverProcess.pid);
    } catch (e) {
      console.log('Error shutting down server:', e.message);
    }
  }
}