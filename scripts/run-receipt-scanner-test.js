#!/usr/bin/env node
/**
 * Script to run the receipt scanner integration test
 */

import Jasmine from 'jasmine';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

// Get directory info
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Create and configure Jasmine
const jasmine = new Jasmine();
global.jasmine = jasmine;

// Set timeout interval
const timeoutInterval = 60000; // 60 seconds
jasmine.jasmine.DEFAULT_TIMEOUT_INTERVAL = timeoutInterval;

console.log('Running ReceiptScanner integration test...');

// Make sure MISTRAL_API_KEY is available from wrangler.toml if not in environment
if (!process.env.MISTRAL_API_KEY) {
  try {
    const wranglerPath = join(projectRoot, 'wrangler.toml');
    const wranglerContent = await fs.readFile(wranglerPath, 'utf8');
    const match = wranglerContent.match(/MISTRAL_API_KEY\s*=\s*"([^"]*)"/);
    if (match && match[1]) {
      process.env.MISTRAL_API_KEY = match[1];
      console.log('Using Mistral API key from wrangler.toml');
    }
  } catch (err) {
    console.error('Failed to read wrangler.toml:', err);
  }
}

// Configure jasmine
jasmine.loadConfig({
  spec_dir: 'tests',
  spec_files: ['integration/scanner/receipt-scanner.test.ts'],
  helpers: [],
  stopSpecOnExpectationFailure: false,
  random: false,
  timeoutInterval: timeoutInterval
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
  }
});

// Error handler for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection:');
  console.error('- Reason:', reason);
  console.error('- Promise:', promise);
});

// Execute tests
try {
  await jasmine.execute();
  console.log('Tests completed successfully');
} catch (error) {
  console.error(`\n⚠️ Error during test execution: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
}