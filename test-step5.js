#!/usr/bin/env node
/**
 * Step 5: Try to load TypeScript test with ts-node
 */
import Jasmine from 'jasmine';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import fs from 'fs/promises';

console.log('### STEP 5: Loading a TypeScript test ###');

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create a simple test spec in TypeScript
const simpleTestDir = path.join(__dirname, 'tests', 'ts-test');
const simpleTestFile = path.join(simpleTestDir, 'simple.test.ts');

async function runTsTest() {
  try {
    // Create simple test directory if it doesn't exist
    await fs.mkdir(simpleTestDir, { recursive: true });
    
    // Create a simple test spec in TypeScript
    const testContent = `
import 'jasmine';

describe('Simple TypeScript Test Suite', () => {
  it('should pass a simple test', () => {
    expect(true).toBe(true);
  });
  
  it('should handle TypeScript types', () => {
    const example: string = 'example';
    expect(typeof example).toBe('string');
  });
});
`;
    
    console.log(`Writing TypeScript test to ${simpleTestFile}`);
    await fs.writeFile(simpleTestFile, testContent);
    
    console.log('Creating Jasmine instance');
    const jasmine = new Jasmine();
    
    console.log('Loading config for TypeScript test');
    jasmine.loadConfig({
      spec_dir: 'tests',
      spec_files: [
        'ts-test/**/*.test.ts'
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
    
    console.log('Executing TypeScript test...');
    try {
      // Note: This requires ts-node/register to be set up correctly
      await jasmine.execute();
      console.log('TypeScript test execution complete');
    } catch (error) {
      console.error('Error during TypeScript test execution:', error);
      console.log('This may be expected if ts-node is not properly configured');
    }
    
    console.log('STEP 5 COMPLETE: TypeScript test execution attempt finished');
  } catch (error) {
    console.error('STEP 5 FAILED:', error);
    process.exit(1);
  }
}

runTsTest();