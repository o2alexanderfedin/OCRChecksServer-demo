#!/usr/bin/env node
import Jasmine from 'jasmine';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Running JSON extraction semi-integration tests...');
const jasmine = new Jasmine();
jasmine.loadConfig({
  spec_dir: 'tests',
  spec_files: [
    'semi-integration/json/**/*.si.test.ts'
  ],
  helpers: [],
  stopSpecOnExpectationFailure: false,
  random: false,
  timeoutInterval: 60000 // Longer timeout for API calls
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
  },
  jasmineDone: function(result) {
    console.log(`Tests finished with status: ${result.overallStatus}`);
  }
});

// Set up global error handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection:');
  console.error('- Reason:', reason);
  console.error('- Promise:', promise);
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