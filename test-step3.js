#!/usr/bin/env node
/**
 * Step 3: Add reporters to Jasmine
 */
import Jasmine from 'jasmine';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

console.log('### STEP 3: Adding reporters to Jasmine ###');

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function addReporters() {
  try {
    console.log('Creating Jasmine instance');
    const jasmine = new Jasmine();
    
    console.log('Loading config');
    jasmine.loadConfig({
      spec_dir: 'tests',
      spec_files: [
        'integration/**/*.test.ts'
      ],
      helpers: [],
      stopSpecOnExpectationFailure: false,
      random: false
    });
    
    console.log('Creating and adding reporter');
    // Create a simple custom reporter
    const reporter = {
      jasmineStarted: function(suiteInfo) {
        console.log(`Reporter: Jasmine starting with ${suiteInfo.totalSpecsDefined} specs defined`);
      },
      suiteStarted: function(result) {
        console.log(`Reporter: Suite started: ${result.description}`);
      },
      specStarted: function(result) {
        console.log(`Reporter: Test started: ${result.description}`);
      },
      specDone: function(result) {
        console.log(`Reporter: Test finished: ${result.description} - ${result.status}`);
      },
      suiteDone: function(result) {
        console.log(`Reporter: Suite finished: ${result.description}`);
      },
      jasmineDone: function(result) {
        console.log(`Reporter: Jasmine finished with status: ${result.overallStatus}`);
      }
    };
    
    // Add the reporter to Jasmine
    jasmine.addReporter(reporter);
    console.log('Reporter added successfully');
    
    console.log('STEP 3 PASSED: Reporters added to Jasmine');
  } catch (error) {
    console.error('STEP 3 FAILED:', error);
    process.exit(1);
  }
}

addReporters();