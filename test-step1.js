#!/usr/bin/env node
/**
 * Step 1: Semi-integration test for OCR
 * This script runs a semi-integration test that tests the Mistral OCR provider
 * with real dependencies but without using a web server.
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Get directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('=== STEP 1: Testing OCR with real dependencies ===');
console.log('Running semi-integration test with Mistral OCR provider...');

try {
  // Run the semi-integration test
  execSync('npm run test:semi-integration', { 
    stdio: 'inherit',
    cwd: __dirname
  });
  
  // Check if results file exists
  const resultsPath = join(__dirname, 'integration-test-results.json');
  if (fs.existsSync(resultsPath)) {
    console.log('\nResults file created successfully at:', resultsPath);
    
    // Read and display a summary of the results
    const results = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
    console.log('\nResults summary:');
    if (results && results.length > 0 && results[0] && results[0].length > 0) {
      const firstResult = results[0][0];
      console.log(`- Text length: ${firstResult.text.length} characters`);
      console.log(`- Confidence: ${firstResult.confidence}`);
      if (firstResult.boundingBox) {
        console.log(`- Image dimensions: ${firstResult.boundingBox.width}x${firstResult.boundingBox.height}`);
      }
    } else {
      console.log('No OCR results found in the results file.');
    }
  } else {
    console.log('Warning: Results file was not created.');
  }
  
  console.log('\nStep 1 completed successfully!');
} catch (error) {
  console.error('\nStep 1 failed with error:', error.message);
  process.exit(1);
}
