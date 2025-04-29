import Jasmine from 'jasmine';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs/promises';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Run integration tests using Jasmine
 */
try {
  console.log('Creating Jasmine instance...');
  const jasmine = new Jasmine();
  
  // Set global jasmine reference
  global.jasmine = jasmine;
  
  console.log('Checking for test files...');
  const testsDir = path.join(__dirname, 'tests', 'integration');
  
  // Check if tests directory exists and output file list
  fs.readdir(testsDir)
    .then(files => {
      console.log(`Found ${files.length} files in integration directory:`, files);
    })
    .catch(error => {
      console.error('Error accessing tests directory:', error);
    });
  
  console.log('Loading config...');
  jasmine.loadConfig({
    spec_dir: 'tests',
    spec_files: [
      'integration/fixed-ocr.test.ts'  // Use our fixed test file
    ],
    helpers: [],
    // Don't stop tests on the first failure
    stopSpecOnExpectationFailure: false,
    // Run tests in a consistent order
    random: false,
    // Longer timeout for integration tests (30 seconds)
    timeoutInterval: 30000
  });

console.log('Starting OCR API Integration Tests...');
console.log(`API URL: ${process.env.OCR_API_URL || 'http://localhost:8787'}`);
console.log('Make sure the server is running before starting tests.\n');

// Add logging for test lifecycle events
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
  }
});

// Set a global error handler to log unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection:');
  console.error('- Reason:', reason);
  console.error('- Promise:', promise);
});

console.log('Executing tests with timeout protection...');

// Execute the tests with a safety timeout
const testsPromise = jasmine.execute();

// Add a global timeout to prevent hanging
const timeoutMs = 60000; // 1 minute timeout
console.log(`Tests will timeout after ${timeoutMs / 1000} seconds if not completed`);

const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => {
    console.error('Integration tests are taking too long - aborting');
    reject(new Error(`Tests timed out after ${timeoutMs / 1000} seconds`));
  }, timeoutMs);
});

// Use Promise.race to handle either completion or timeout
Promise.race([testsPromise, timeoutPromise])
  .then(() => {
    console.log('Tests completed successfully');
  })
  .catch(error => {
    console.error(`\n⚠️ Error during test execution: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  });
} catch (error) {
  console.error('Failed to initialize tests:', error);
  process.exit(1);
}