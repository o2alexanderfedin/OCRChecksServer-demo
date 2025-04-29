#!/usr/bin/env node
/**
 * Step 4: Load simple test spec without TypeScript
 */
import Jasmine from 'jasmine';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import fs from 'fs/promises';

console.log('### STEP 4: Loading a simple JavaScript test spec ###');

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create a simple test spec in JavaScript
const simpleTestDir = path.join(__dirname, 'tests', 'simple');
const simpleTestFile = path.join(simpleTestDir, 'simple.test.js');

async function runSimpleTest() {
  try {
    // Create simple test directory if it doesn't exist
    await fs.mkdir(simpleTestDir, { recursive: true });
    
    // Create a simple test spec
    const testContent = `
describe('Simple Test Suite', () => {
  it('should pass a simple test', () => {
    expect(true).toBe(true);
  });
});
`;
    
    console.log(`Writing simple test to ${simpleTestFile}`);
    await fs.writeFile(simpleTestFile, testContent);
    
    console.log('Creating Jasmine instance');
    const jasmine = new Jasmine();
    
    console.log('Loading config for simple test');
    jasmine.loadConfig({
      spec_dir: 'tests',
      spec_files: [
        'simple/**/*.test.js'
      ],
      helpers: [],
      stopSpecOnExpectationFailure: false,
      random: false
    });
    
    // Create a simple custom reporter
    const reporter = {
      jasmineStarted: function(suiteInfo) {
        console.log(`Reporter: Jasmine starting with ${suiteInfo.totalSpecsDefined} specs defined`);
      },
      jasmineDone: function(result) {
        console.log(`Reporter: Jasmine finished with status: ${result.overallStatus}`);
      }
    };
    
    // Add the reporter to Jasmine
    jasmine.addReporter(reporter);
    
    console.log('Executing simple test...');
    await jasmine.execute();
    console.log('Simple test execution complete');
    
    console.log('STEP 4 PASSED: Simple JavaScript test executed successfully');
  } catch (error) {
    console.error('STEP 4 FAILED:', error);
    process.exit(1);
  }
}

runSimpleTest();