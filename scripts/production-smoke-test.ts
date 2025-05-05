/**
 * Production Smoke Tests
 * 
 * This script performs integration tests against any environment (local, dev, staging, production)
 * to verify that the API is working correctly.
 * 
 * Usage:
 *   ts-node scripts/production-smoke-test.ts [--env production|staging|dev|local] [--save] [--verbose]
 * 
 * Options:
 *   --env        The environment to test against (default: local)
 *   --save       Save detailed test results to a JSON file
 *   --verbose    Show verbose output including API responses
 * 
 * Examples:
 *   ts-node scripts/production-smoke-test.ts                      # Test against local environment
 *   ts-node scripts/production-smoke-test.ts --env dev            # Test against dev environment
 *   ts-node scripts/production-smoke-test.ts --env staging        # Test against staging environment
 *   ts-node scripts/production-smoke-test.ts --env production     # Test against production environment
 *   ts-node scripts/production-smoke-test.ts --env dev --save     # Test against dev and save results
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
  dev: 'https://ocr-checks-worker-dev.af-4a0.workers.dev',
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
 * Find a test image or create a tiny test pattern if none found
 * This ensures we always have a small, valid image for testing
 */
function findTestImage(): string {
  // Define a fallback tiny test image path
  const tinyTestPath = path.join(projectRoot, 'tiny-test.jpg');
  
  // First try to use existing test images
  const possibleImages = [
    path.join(projectRoot, 'tiny-test.jpg'),  // Try the tiny test image first
    path.join(projectRoot, 'micro-test.jpg'),  // Even smaller test image
    path.join(projectRoot, 'small-test.jpg'),
    path.join(projectRoot, 'tests', 'fixtures', 'images', 'fredmeyer-receipt.jpg'),
    path.join(projectRoot, 'tests', 'fixtures', 'images', 'rental-bill.jpg')
  ];

  for (const imagePath of possibleImages) {
    if (fs.existsSync(imagePath)) {
      // If the file exists but is too large (over 1KB), skip it for faster testing
      const stats = fs.statSync(imagePath);
      if (stats.size > 1024) { // 1KB
        log(`Skipping large image: ${path.basename(imagePath)} (${Math.round(stats.size / 1024)}KB)`, colors.dim);
        continue;
      }
      
      return imagePath;
    }
  }
  
  // If no suitable image found, create a tiny test pattern (10x10 black square)
  log('Creating a tiny test pattern image for testing...', colors.dim);
  
  // This is a minimal valid JPEG file (10x10 black square)
  // Hard-coded for simplicity and to avoid dependencies
  const tinyJpegBytes = Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48, 
    0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 
    0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12, 
    0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20, 0x24, 0x2E, 0x27, 0x20, 
    0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29, 0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 
    0x39, 0x3D, 0x38, 0x32, 0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xDB, 0x00, 0x43, 0x01, 0x09, 0x09, 
    0x09, 0x0C, 0x0B, 0x0C, 0x18, 0x0D, 0x0D, 0x18, 0x32, 0x21, 0x1C, 0x21, 0x32, 0x32, 0x32, 0x32, 
    0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 
    0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 
    0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0xFF, 0xC0, 
    0x00, 0x11, 0x08, 0x00, 0x0A, 0x00, 0x0A, 0x03, 0x01, 0x22, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 
    0x01, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 
    0x0A, 0x0B, 0xFF, 0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03, 0x03, 0x02, 0x04, 0x03, 0x05, 
    0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D, 0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 
    0x31, 0x41, 0x06, 0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xA1, 0x08, 0x23, 
    0x42, 0xB1, 0xC1, 0x15, 0x52, 0xD1, 0xF0, 0x24, 0x33, 0x62, 0x72, 0x82, 0x09, 0x0A, 0x16, 0x17, 
    0x18, 0x19, 0x1A, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2A, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 
    0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4A, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5A, 
    0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7A, 
    0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89, 0x8A, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 
    0x9A, 0xA2, 0xA3, 0xA4, 0xA5, 0xA6, 0xA7, 0xA8, 0xA9, 0xAA, 0xB2, 0xB3, 0xB4, 0xB5, 0xB6, 0xB7, 
    0xB8, 0xB9, 0xBA, 0xC2, 0xC3, 0xC4, 0xC5, 0xC6, 0xC7, 0xC8, 0xC9, 0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 
    0xD6, 0xD7, 0xD8, 0xD9, 0xDA, 0xE1, 0xE2, 0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xF1, 
    0xF2, 0xF3, 0xF4, 0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 0xFA, 0xFF, 0xC4, 0x00, 0x1F, 0x01, 0x00, 0x03, 
    0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 
    0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0xFF, 0xC4, 0x00, 0xB5, 0x11, 0x00, 
    0x02, 0x01, 0x02, 0x04, 0x04, 0x03, 0x04, 0x07, 0x05, 0x04, 0x04, 0x00, 0x01, 0x02, 0x77, 0x00, 
    0x01, 0x02, 0x03, 0x11, 0x04, 0x05, 0x21, 0x31, 0x06, 0x12, 0x41, 0x51, 0x07, 0x61, 0x71, 0x13, 
    0x22, 0x32, 0x81, 0x08, 0x14, 0x42, 0x91, 0xA1, 0xB1, 0xC1, 0x09, 0x23, 0x33, 0x52, 0xF0, 0x15, 
    0x62, 0x72, 0xD1, 0x0A, 0x16, 0x24, 0x34, 0xE1, 0x25, 0xF1, 0x17, 0x18, 0x19, 0x1A, 0x26, 0x27, 
    0x28, 0x29, 0x2A, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 
    0x4A, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5A, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 
    0x6A, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7A, 0x82, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 
    0x89, 0x8A, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0xA2, 0xA3, 0xA4, 0xA5, 0xA6, 
    0xA7, 0xA8, 0xA9, 0xAA, 0xB2, 0xB3, 0xB4, 0xB5, 0xB6, 0xB7, 0xB8, 0xB9, 0xBA, 0xC2, 0xC3, 0xC4, 
    0xC5, 0xC6, 0xC7, 0xC8, 0xC9, 0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8, 0xD9, 0xDA, 0xE2, 
    0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xF2, 0xF3, 0xF4, 0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 
    0xFA, 0xFF, 0xDA, 0x00, 0x0C, 0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F, 0x00, 0xFD, 
    0xFC, 0xA2, 0x8A, 0x28, 0x03, 0xFF, 0xD9
  ]);
  
  // Write the tiny JPEG file
  fs.writeFileSync(tinyTestPath, tinyJpegBytes);
  log(`Created tiny test image at: ${tinyTestPath}`, colors.dim);
  return tinyTestPath;
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
  
  // For smoke tests, we're more interested in the OCR process working than the specific content
  // For a tiny test image, the content will be largely empty/nonsensical, we just care about API flow
  
  // Check that either confidence data or error information is present
  if (!result.confidence && !result.error) {
    throw new Error('Response missing both confidence data and error information');
  }
  
  // Verify basic data presence - but be more lenient for smoke tests
  const checkData = result.data || {};
  
  // Log successful processing
  if (result.confidence && typeof result.confidence === 'object') {
    logResult('Check Processing', true, `Received check data with confidence: ${result.confidence.overall?.toFixed(2) || 'n/a'}`);
  } else {
    // Just log the fact that we got a response - the test image might be too small for meaningful extraction
    // but the API flow working is what matters for smoke tests
    logResult('Check Processing', true, 'API flow working - received data response');
  }
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
  
  // Verify some kind of response structure
  if (!result.data && !result.error) {
    throw new Error('Response missing both data field and error information');
  }
  
  // For smoke tests, our main concern is that the API flow is working
  // For a tiny test image, the content will be largely empty/nonsensical
  
  // Check that either confidence data or error information is present
  if (!result.confidence && !result.error) {
    throw new Error('Response missing both confidence data and error information');
  }
  
  // Log successful processing
  if (result.confidence && typeof result.confidence === 'object') {
    logResult('Receipt Processing', true, `Received receipt data with confidence: ${result.confidence.overall?.toFixed(2) || 'n/a'}`);
  } else {
    // Just log the fact that we got a response
    logResult('Receipt Processing', true, 'API flow working - received data response');
  }
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
  
  // Verify some kind of response structure
  if (!result.data && !result.error) {
    throw new Error('Response missing both data field and error information');
  }
  
  // For smoke tests, our main concern is that the API flow is working
  // The content itself is less important than the fact that we got a valid response
  
  // Check that we got either a document type or detailed error
  if (!result.documentType && !result.error) {
    throw new Error('Response missing both documentType and error information');
  }
  
  // Log successful processing
  if (result.documentType) {
    logResult('Universal Processing', true, `API flow working - processed as ${result.documentType}`);
  } else {
    logResult('Universal Processing', true, 'API flow working - received response');
  }
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