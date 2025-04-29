#!/usr/bin/env node
/**
 * Semi-integration test runner for Mistral OCR
 * Tests the Mistral OCR provider with real dependencies but no web server
 */
import Jasmine from 'jasmine';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs/promises';
import path from 'path';

console.log('--- MISTRAL OCR SEMI-INTEGRATION TEST RUNNER ---');

// Create Jasmine instance
console.log('Creating Jasmine instance');
const jasmine = new Jasmine();

// Load config
console.log('Loading config');
jasmine.loadConfig({
  spec_dir: 'tests',
  spec_files: [
    'simple/simple.test.js'  // Use our semi-integration test
  ],
  helpers: [],
  stopSpecOnExpectationFailure: false,
  random: false,
  timeoutInterval: 60000  // Longer timeout for real API calls
});

// Add custom reporter
console.log('Adding reporter');
jasmine.addReporter({
  jasmineStarted: function(suiteInfo) {
    console.log(`Jasmine starting with ${suiteInfo.totalSpecsDefined} specs defined`);
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
    console.log(`Jasmine finished with status: ${result.overallStatus}`);
    
    // Output results location
    console.log('\nTest Results:');
    console.log('Results saved to integration-test-results.json');
  }
});

// Set up global error handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection:');
  console.error('- Reason:', reason);
  console.error('- Promise:', promise);
});

// Execute tests - without Promise.race or other complications
console.log('Executing tests directly...');
jasmine.execute().then(
  () => console.log('Tests completed successfully'),
  error => {
    console.error('Error during test execution:', error);
    process.exit(1);
  }
);