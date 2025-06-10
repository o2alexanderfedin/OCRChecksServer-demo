#!/usr/bin/env node
import Jasmine from 'jasmine';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { addDevVarsToEnv } from './load-dev-vars.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .dev.vars
console.log('Loading environment variables from .dev.vars file...');
await addDevVarsToEnv();

console.log('Running functional tests...');
const jasmine = new Jasmine();
jasmine.loadConfig({
  spec_dir: 'tests',
  spec_files: [
    'functional/**/*.f.test.ts'
  ],
  helpers: [],
  stopSpecOnExpectationFailure: false,
  random: false
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