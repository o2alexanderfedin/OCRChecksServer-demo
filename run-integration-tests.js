import Jasmine from 'jasmine';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Run integration tests using Jasmine
 */
const jasmine = new Jasmine();
jasmine.loadConfig({
  spec_dir: 'tests',
  spec_files: [
    'integration/**/*.test.ts'
  ],
  helpers: [
    'helpers/**/*.ts'
  ],
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

// Execute the tests
jasmine.execute();