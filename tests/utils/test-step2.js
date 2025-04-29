#!/usr/bin/env node
/**
 * Step 2: Load Jasmine and create configuration
 */
import Jasmine from 'jasmine';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import fs from 'fs/promises';

console.log('### STEP 2: Jasmine initialization ###');

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function initJasmine() {
  try {
    console.log('Creating Jasmine instance');
    const jasmine = new Jasmine();
    
    console.log('Jasmine instance created successfully');
    
    // Check that Jasmine is properly instantiated
    if (!jasmine || !jasmine.loadConfig) {
      throw new Error('Jasmine instance is not properly initialized');
    }
    
    console.log('Creating test config');
    const config = {
      spec_dir: 'tests',
      spec_files: [
        'integration/**/*.test.ts'
      ],
      helpers: [],
      stopSpecOnExpectationFailure: false,
      random: false
    };
    
    console.log('Created config:', JSON.stringify(config, null, 2));
    
    // First check if jasmine.json exists
    const jasmineJsonPath = path.join(__dirname, 'jasmine.json');
    const jasmineJsonExists = await fs.access(jasmineJsonPath)
      .then(() => true)
      .catch(() => false);
    
    if (jasmineJsonExists) {
      console.log(`Loading config from ${jasmineJsonPath}`);
      jasmine.loadConfigFile('jasmine.json');
      console.log('Config file loaded successfully');
    } else {
      console.log('No jasmine.json found, loading programmatic config');
      jasmine.loadConfig(config);
      console.log('Config loaded programmatically');
    }

    console.log('STEP 2 PASSED: Jasmine initialized successfully');
  } catch (error) {
    console.error('STEP 2 FAILED:', error);
    process.exit(1);
  }
}

initJasmine();