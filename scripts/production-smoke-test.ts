/**
 * Production Smoke Tests
 * 
 * This script performs integration tests against any environment (local, staging, production)
 * to verify that the API is working correctly.
 * 
 * Usage:
 *   ts-node scripts/production-smoke-test.ts [--env production|staging|local] [--save] [--verbose]
 * 
 * Options:
 *   --env        The environment to test against (default: local)
 *   --save       Save detailed test results to a JSON file
 *   --verbose    Show verbose output including API responses
 * 
 * Examples:
 *   ts-node scripts/production-smoke-test.ts
 *   ts-node scripts/production-smoke-test.ts --env production --save
 *   OCR_API_URL=https://custom.api.url ts-node scripts/production-smoke-test.ts --verbose
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Environment setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Parse command-line arguments
const args = process.argv.slice(2);
const options = {
  env: args.includes('--env') ? args[args.indexOf('--env') + 1] : 'local',
  save: args.includes('--save'),
  verbose: args.includes('--verbose')
};

// Environment-specific configuration
const environments = {
  production: 'https://api.nolock.social',
  staging: 'https://staging-api.nolock.social',
  local: 'http://localhost:8787'
};

// Use API_URL from environment variable or based on --env option
const API_URL = process.env.OCR_API_URL || environments[options.env as keyof typeof environments] || environments.local;

// ANSI colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m'
};

// Test result collecting
const results: Record<string, any> = {
  timestamp: new Date().toISOString(),
  baseUrl: API_URL,
  target: options.env,
  version: null,
  tests: {}
};

/**
 * Helper function to log messages with color
 */
function log(message: string, color = colors.reset): void {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Helper function to log test results
 */
function logResult(test: string, passed: boolean, message?: string): void {
  const icon = passed ? '✓' : '✗';
  const color = passed ? colors.green : colors.red;
  log(`${color}${icon} ${test}${colors.reset}${message ? ': ' + message : ''}`);
  
  // Store result
  results.tests[test.toLowerCase().replace(/\s+/g, '_')] = {
    passed,
    message: message || ''
  };
}

/**
 * Helper function to run a test and catch errors
 */
async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  log(`\n${colors.bright}${colors.blue}Running Test: ${name}${colors.reset}`);
  try {
    await testFn();
  } catch (error: any) {
    logResult(name, false, error.message || 'Unknown error');
    if (options.verbose) {
      console.error(error);
    }
  }
}

/**
 * Health Check Test
 */
async function testHealth(): Promise<void> {
  const response = await fetch(`${API_URL}/health`);
  
  if (!response.ok) {
    throw new Error(`Health check failed with status: ${response.status}`);
  }
  
  const healthData = await response.json();
  results.version = healthData.version;
  
  if (options.verbose) {
    log('Health Response:', colors.dim);
    console.dir(healthData, { depth: null, colors: true });
  }
  
  logResult('Health Check', true, `Server version: ${healthData.version}`);
}

/**
 * Find a test image
 */
function findTestImage(): string {
  const possibleImages = [
    path.join(projectRoot, 'small-test.jpg'),
    path.join(projectRoot, 'tiny-test.jpg'),
    path.join(projectRoot, 'tests', 'fixtures', 'images', 'telegram-cloud-photo-size-1-4915775046379745521-y.jpg'),
    path.join(projectRoot, 'tests', 'fixtures', 'images', 'IMG_2388.jpg')
  ];

  for (const imagePath of possibleImages) {
    if (fs.existsSync(imagePath)) {
      return imagePath;
    }
  }
  
  throw new Error('No test image found. Please provide a valid image path.');
}

/**
 * Check Processing Test
 */
async function testCheckProcessing(): Promise<void> {
  const imagePath = findTestImage();
  const imageBuffer = fs.readFileSync(imagePath);
  const imageName = path.basename(imagePath);
  
  log(`Using test image: ${imageName} (${imageBuffer.length} bytes)`, colors.dim);
  
  const response = await fetch(`${API_URL}/check?filename=${imageName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'image/jpeg'
    },
    body: imageBuffer
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Check processing failed with status: ${response.status}, Error: ${errorText}`);
  }
  
  const result = await response.json();
  
  if (options.verbose) {
    log('Check Processing Response:', colors.dim);
    console.dir(result, { depth: 2, colors: true });
  }
  
  // Verify response structure
  if (!result.data) {
    throw new Error('Response missing data field');
  }
  
  if (!result.confidence || typeof result.confidence !== 'object') {
    throw new Error('Response missing confidence data');
  }
  
  // Validate basic check data
  const checkData = result.data;
  const validationMessages = [];
  
  if (!checkData.checkNumber) validationMessages.push('Missing check number');
  if (!checkData.date) validationMessages.push('Missing date');
  if (!checkData.payee) validationMessages.push('Missing payee');
  if (typeof checkData.amount !== 'number') validationMessages.push('Invalid amount');
  
  if (validationMessages.length > 0) {
    throw new Error(`Data validation failed: ${validationMessages.join(', ')}`);
  }
  
  logResult('Check Processing', true, `Received valid check data with confidence: ${result.confidence.overall.toFixed(2)}`);
}

/**
 * Receipt Processing Test
 */
async function testReceiptProcessing(): Promise<void> {
  const imagePath = findTestImage();
  const imageBuffer = fs.readFileSync(imagePath);
  const imageName = path.basename(imagePath);
  
  log(`Using test image: ${imageName} (${imageBuffer.length} bytes)`, colors.dim);
  
  const response = await fetch(`${API_URL}/receipt?filename=${imageName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'image/jpeg'
    },
    body: imageBuffer
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Receipt processing failed with status: ${response.status}, Error: ${errorText}`);
  }
  
  const result = await response.json();
  
  if (options.verbose) {
    log('Receipt Processing Response:', colors.dim);
    console.dir(result, { depth: 2, colors: true });
  }
  
  // Verify response structure
  if (!result.data) {
    throw new Error('Response missing data field');
  }
  
  if (!result.confidence || typeof result.confidence !== 'object') {
    throw new Error('Response missing confidence data');
  }
  
  // Basic validation of receipt data
  const receiptData = result.data;
  
  // Receipt data might not contain all fields if the image doesn't actually
  // contain receipt information, but it should at least have some structured data
  if (Object.keys(receiptData).length < 2) {
    throw new Error('Receipt data has too few fields');
  }
  
  logResult('Receipt Processing', true, `Received receipt data with confidence: ${result.confidence.overall.toFixed(2)}`);
}

/**
 * Universal Process Endpoint Test
 */
async function testUniversalProcessing(): Promise<void> {
  const imagePath = findTestImage();
  const imageBuffer = fs.readFileSync(imagePath);
  const imageName = path.basename(imagePath);
  
  log(`Using test image: ${imageName} (${imageBuffer.length} bytes)`, colors.dim);
  
  const response = await fetch(`${API_URL}/process?type=check&filename=${imageName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'image/jpeg'
    },
    body: imageBuffer
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Universal processing failed with status: ${response.status}, Error: ${errorText}`);
  }
  
  const result = await response.json();
  
  if (options.verbose) {
    log('Universal Processing Response:', colors.dim);
    console.dir(result, { depth: 2, colors: true });
  }
  
  // Verify response structure
  if (!result.data) {
    throw new Error('Response missing data field');
  }
  
  if (!result.confidence) {
    throw new Error('Response missing confidence data');
  }
  
  if (result.documentType !== 'check') {
    throw new Error(`Expected documentType 'check', got '${result.documentType}'`);
  }
  
  logResult('Universal Processing', true, `Processed as ${result.documentType}`);
}

/**
 * Error Handling Test
 */
async function testErrorHandling(): Promise<void> {
  // Test with invalid image content
  const invalidImageData = Buffer.from('not a valid image');
  
  const response = await fetch(`${API_URL}/check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'image/jpeg'
    },
    body: invalidImageData
  });
  
  if (response.status === 200) {
    throw new Error('Expected error response for invalid image, got 200 OK');
  }
  
  const errorResult = await response.json();
  
  if (options.verbose) {
    log('Error Response:', colors.dim);
    console.dir(errorResult, { depth: null, colors: true });
  }
  
  if (!errorResult.error) {
    throw new Error('Error response missing error field');
  }
  
  logResult('Error Handling', true, `Received proper error response: ${response.status}`);
}

/**
 * Main function to run all tests
 */
async function runAllTests(): Promise<void> {
  log(`${colors.bright}${colors.magenta}========================================${colors.reset}`);
  log(`${colors.bright}${colors.magenta}Production Smoke Tests${colors.reset}`);
  log(`${colors.bright}${colors.magenta}========================================${colors.reset}`);
  log(`Target: ${colors.cyan}${API_URL}${colors.reset} (${options.env} environment)`);
  log(`Running at: ${new Date().toISOString()}`);
  log(`${colors.bright}${colors.magenta}========================================${colors.reset}`);
  
  await runTest('Health Check', testHealth);
  await runTest('Check Processing', testCheckProcessing);
  await runTest('Receipt Processing', testReceiptProcessing);
  await runTest('Universal Processing', testUniversalProcessing);
  await runTest('Error Handling', testErrorHandling);
  
  // Print summary
  log(`\n${colors.bright}${colors.magenta}Test Summary:${colors.reset}`);
  
  let passedCount = 0;
  let failedCount = 0;
  
  for (const [testName, result] of Object.entries(results.tests)) {
    if (result.passed) {
      passedCount++;
    } else {
      failedCount++;
    }
    
    const formattedName = testName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
      
    log(`${formattedName}: ${result.passed ? colors.green + 'PASSED' : colors.red + 'FAILED'} ${colors.reset}${result.message ? '- ' + result.message : ''}`);
  }
  
  log(`\n${colors.bright}${passedCount === Object.keys(results.tests).length ? colors.green : colors.yellow}${passedCount}/${Object.keys(results.tests).length} tests passed${colors.reset}`);
  
  // Save results to file if requested
  if (options.save) {
    const resultsFile = path.join(projectRoot, `smoke-test-results-${options.env}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    log(`\nDetailed test results saved to: ${colors.cyan}${resultsFile}${colors.reset}`);
  }
  
  // Return non-zero exit code if any tests failed
  if (failedCount > 0) {
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});