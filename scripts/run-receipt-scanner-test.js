#!/usr/bin/env node
/**
 * Runs the ReceiptScanner integration test
 * 
 * Usage:
 *   node scripts/run-receipt-scanner-test.js
 */

import Jasmine from 'jasmine';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Set API key for testing
process.env.MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || 'vYS1jOH55qvFc5Qqzgn2JHXN3cjMCJQp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Running ReceiptScanner integration test...');
const jasmine = new Jasmine();
jasmine.loadConfig({
  spec_dir: 'tests',
  spec_files: [
    'integration/unified-processor-fixed.test.ts'
  ],
  helpers: [],
  stopSpecOnExpectationFailure: false,
  random: false
});

// Set a longer timeout for integration tests
jasmine.jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;

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
  jasmineDone: function(result) {
    console.log(`Tests finished with status: ${result.overallStatus}`);
  }
});

// Add proper error handling
try {
  jasmine.execute().catch(error => {
    console.error('Error executing tests:', error);
    process.exit(1);
  });
} catch (error) {
  console.error('Error executing tests:', error);
  process.exit(1);
}