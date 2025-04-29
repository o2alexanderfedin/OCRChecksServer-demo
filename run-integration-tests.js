#!/usr/bin/env node
/**
 * Integration test runner for OCR Checks Server
 * 
 * This script automates running the integration test suite with server management
 * and proper cleanup.
 */

import { spawn, exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { setTimeout } from 'timers/promises';

// Get directory info
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const resultsPath = join(__dirname, 'integration-test-results.json');

// Configuration
const API_URL = process.env.OCR_API_URL || 'http://localhost:8787';
const SERVER_STARTUP_DELAY = 5000; // 5 seconds
const SERVER_SHUTDOWN_TIMEOUT = 5000; // 5 seconds
const DRY_RUN = process.argv.includes('--dry-run');

// Store server process information for cleanup
let serverPid = null;

/**
 * Clean up any running development server processes
 */
async function cleanupServerProcesses() {
  return new Promise((resolve) => {
    console.log('Cleaning up server processes...');
    
    // Try to clean up using the individual PID if available
    if (serverPid) {
      try {
        process.kill(serverPid);
        console.log(`Killed server process with PID ${serverPid}`);
      } catch (error) {
        console.log(`Error killing server process: ${error.message}`);
      }
    }
    
    // Also try to find and kill any lingering wrangler processes
    // This is a safety measure to ensure we don't leave orphaned processes
    exec('pkill -f "wrangler dev" || true', (error) => {
      if (error) {
        console.log('Note: No wrangler processes found to clean up');
      } else {
        console.log('Cleaned up wrangler processes');
      }
      resolve();
    });
  });
}

/**
 * Set up cleanup handlers for graceful shutdown
 */
function setupCleanupHandlers() {
  // Handle normal exit
  process.on('exit', () => {
    try {
      if (serverPid) {
        process.kill(serverPid);
      }
    } catch (e) {
      // Ignore errors during exit
    }
  });
  
  // Handle CTRL+C
  process.on('SIGINT', async () => {
    console.log('\nInterrupted - cleaning up...');
    await cleanupServerProcesses();
    process.exit(1);
  });
  
  // Handle kill signal
  process.on('SIGTERM', async () => {
    console.log('\nTerminated - cleaning up...');
    await cleanupServerProcesses();
    process.exit(1);
  });
  
  // Handle uncaught exceptions
  process.on('uncaughtException', async (error) => {
    console.error(`\nUncaught exception: ${error.message}`);
    await cleanupServerProcesses();
    process.exit(1);
  });
}

/**
 * Main function to run integration tests
 */
async function runIntegrationTests() {
  console.log('\n🚀 Starting OCR Checks Server integration tests\n');
  
  // Set up cleanup handlers
  setupCleanupHandlers();
  
  // Record test start time for performance metrics
  const startTime = Date.now();
  
  // Start the development server
  console.log('📋 Step 1: Starting development server...');
  
  const serverProcess = spawn('node', [join(__dirname, 'scripts', 'start-server.js')], {
    stdio: 'inherit'
  });
  
  // Store the server process PID for cleanup
  serverPid = serverProcess.pid;
  
  let serverError = false;
  serverProcess.on('error', (err) => {
    console.error(`❌ Failed to start server: ${err.message}`);
    serverError = true;
    process.exit(1);
  });
  
  // Give the server time to start
  console.log(`Waiting ${SERVER_STARTUP_DELAY/1000} seconds for server to start...`);
  await setTimeout(SERVER_STARTUP_DELAY);
  if (serverError) return;
  
  console.log(`\n📋 Step 2: Server started. Running integration tests against ${API_URL}...\n`);
  
  // If this is a dry run, use the --dry-run flag
  const args = [
    '--loader', 'ts-node/esm',
    join(__dirname, 'scripts', 'run-tests.js'),
    'integration'
  ];
  
  if (DRY_RUN) {
    args.push('--dry-run');
    console.log('DRY RUN: Tests will not actually be executed');
  }
  
  // Run the integration tests
  const testProcess = spawn('node', args, {
    stdio: 'inherit',
    env: { ...process.env, OCR_API_URL: API_URL }
  });
  
  // Return a promise that resolves when the test process completes
  return new Promise((resolve, reject) => {
    testProcess.on('close', async (code) => {
      const testDuration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      if (code === 0) {
        console.log(`\n✅ Integration tests completed successfully in ${testDuration}s`);
        
        // Display results if available
        if (fs.existsSync(resultsPath)) {
          console.log(`📊 Test results saved to: ${resultsPath}`);
        }
        
        await cleanupServerProcesses();
        resolve();
      } else {
        console.error(`\n❌ Integration tests failed with code ${code} after ${testDuration}s`);
        await cleanupServerProcesses();
        reject(new Error(`Tests failed with code ${code}`));
      }
    });
    
    testProcess.on('error', async (err) => {
      console.error(`❌ Test execution error: ${err.message}`);
      await cleanupServerProcesses();
      reject(err);
    });
  });
}

// Run tests and handle errors
runIntegrationTests()
  .then(() => {
    console.log('\n🏁 Integration test suite completed successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error(`\n💥 Integration test suite failed: ${error.message}\n`);
    process.exit(1);
  });