#!/usr/bin/env npx tsx
/**
 * Version Smoke Test
 * 
 * This script verifies that the deployed application's version (from /health endpoint)
 * matches the version specified in package.json (source version).
 * 
 * This is a critical deployment verification test to ensure that the correct
 * version of the code has been deployed to all environments.
 * 
 * Usage:
 *   npx tsx scripts/version-smoke-test.ts [--env production|staging|dev|local] [--verbose]
 * 
 * Options:
 *   --env        The environment to test against (default: local)
 *   --verbose    Show verbose output including full responses
 * 
 * Examples:
 *   npx tsx scripts/version-smoke-test.ts                    # Test local environment
 *   npx tsx scripts/version-smoke-test.ts --env production   # Test production environment
 *   npx tsx scripts/version-smoke-test.ts --env dev --verbose # Test dev with verbose output
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
  verbose: args.includes('--verbose')
};

// Environment-specific configuration
const environments = {
  production: 'https://api.nolock.social',
  staging: 'https://staging-api.nolock.social', 
  dev: 'https://dev-api.nolock.social',
  local: 'http://localhost:8787'
};

// Use API_URL from environment variable or based on --env option
const API_URL = process.env.OCR_API_URL || environments[options.env as keyof typeof environments] || environments.local;

// ANSI colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m'
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
}

/**
 * Read the source version from package.json
 */
function getSourceVersion(): string {
  try {
    const packageJsonPath = path.join(projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return packageJson.version;
  } catch (error) {
    throw new Error(`Failed to read package.json: ${error}`);
  }
}

/**
 * Get the deployed version from the health endpoint
 */
async function getDeployedVersion(): Promise<string> {
  try {
    const response = await fetch(`${API_URL}/health`);
    
    if (!response.ok) {
      throw new Error(`Health endpoint returned status: ${response.status}`);
    }
    
    const healthData = await response.json();
    
    if (options.verbose) {
      log('Health endpoint response:', colors.cyan);
      console.dir(healthData, { depth: null, colors: true });
    }
    
    if (!healthData.version) {
      throw new Error('Health endpoint response missing version field');
    }
    
    return healthData.version;
  } catch (error) {
    throw new Error(`Failed to get deployed version: ${error}`);
  }
}

/**
 * Validate version format (semver: x.y.z)
 */
function isValidVersionFormat(version: string): boolean {
  return /^\d+\.\d+\.\d+$/.test(version);
}

/**
 * Main version comparison test
 */
async function runVersionTest(): Promise<void> {
  log(`${colors.bright}${colors.magenta}========================================${colors.reset}`);
  log(`${colors.bright}${colors.magenta}Version Smoke Test${colors.reset}`);
  log(`${colors.bright}${colors.magenta}========================================${colors.reset}`);
  log(`Environment: ${colors.cyan}${options.env}${colors.reset}`);
  log(`Target URL: ${colors.cyan}${API_URL}${colors.reset}`);
  log(`Timestamp: ${new Date().toISOString()}`);
  log(`${colors.bright}${colors.magenta}========================================${colors.reset}`);
  
  let testsPassed = 0;
  let totalTests = 0;
  
  try {
    // Test 1: Get source version
    totalTests++;
    log(`\n${colors.bright}${colors.blue}Test 1: Reading source version${colors.reset}`);
    
    const sourceVersion = getSourceVersion();
    
    if (!isValidVersionFormat(sourceVersion)) {
      logResult('Source Version Format', false, `Invalid format: ${sourceVersion}`);
      throw new Error(`Source version has invalid format: ${sourceVersion}`);
    }
    
    logResult('Source Version', true, `Found version ${sourceVersion} in package.json`);
    testsPassed++;
    
    // Test 2: Get deployed version
    totalTests++;
    log(`\n${colors.bright}${colors.blue}Test 2: Fetching deployed version${colors.reset}`);
    
    const deployedVersion = await getDeployedVersion();
    
    if (!isValidVersionFormat(deployedVersion)) {
      logResult('Deployed Version Format', false, `Invalid format: ${deployedVersion}`);
      throw new Error(`Deployed version has invalid format: ${deployedVersion}`);
    }
    
    logResult('Deployed Version', true, `Health endpoint reports version ${deployedVersion}`);
    testsPassed++;
    
    // Test 3: Version comparison
    totalTests++;
    log(`\n${colors.bright}${colors.blue}Test 3: Version comparison${colors.reset}`);
    
    const versionsMatch = sourceVersion === deployedVersion;
    
    if (versionsMatch) {
      logResult('Version Match', true, `Both source and deployed report version ${sourceVersion}`);
      testsPassed++;
    } else {
      logResult('Version Match', false, `Source: ${sourceVersion}, Deployed: ${deployedVersion}`);
    }
    
    // Summary
    log(`\n${colors.bright}${colors.magenta}Test Summary:${colors.reset}`);
    log(`Source Version: ${colors.cyan}${sourceVersion}${colors.reset}`);
    log(`Deployed Version: ${colors.cyan}${deployedVersion}${colors.reset}`);
    log(`Tests Passed: ${testsPassed === totalTests ? colors.green : colors.yellow}${testsPassed}/${totalTests}${colors.reset}`);
    
    if (versionsMatch) {
      log(`\n${colors.green}✅ SUCCESS: Version verification passed${colors.reset}`);
      log(`The deployed application version matches the source version.`);
    } else {
      log(`\n${colors.red}❌ FAILURE: Version mismatch detected${colors.reset}`);
      log(`${colors.yellow}This indicates that:${colors.reset}`);
      log(`  • The latest code changes may not have been deployed`);
      log(`  • There may be a deployment issue`);
      log(`  • The package.json version may need to be updated`);
      log(`\n${colors.yellow}Recommended actions:${colors.reset}`);
      log(`  1. Verify the latest code has been committed and pushed`);
      log(`  2. Check if deployment was successful`);
      log(`  3. Re-deploy if necessary`);
      log(`  4. Update package.json version if this is expected`);
      
      process.exit(1);
    }
    
  } catch (error) {
    log(`\n${colors.red}❌ FATAL ERROR: ${error}${colors.reset}`);
    log(`\n${colors.yellow}This could indicate:${colors.reset}`);
    log(`  • The service is not accessible at ${API_URL}`);
    log(`  • The health endpoint is not working`);
    log(`  • Network connectivity issues`);
    log(`  • The service is not deployed`);
    
    process.exit(1);
  }
}

// Additional health check
async function runBasicHealthCheck(): Promise<void> {
  log(`\n${colors.bright}${colors.blue}Additional Check: Basic Health Verification${colors.reset}`);
  
  try {
    const response = await fetch(`${API_URL}/health`);
    const healthData = await response.json();
    
    // Check basic health status
    if (healthData.status === 'ok') {
      logResult('Health Status', true, 'Service is healthy');
    } else {
      logResult('Health Status', false, `Service status: ${healthData.status}`);
    }
    
    // Check timestamp (should be recent)
    if (healthData.timestamp) {
      const healthTimestamp = new Date(healthData.timestamp);
      const now = new Date();
      const ageMinutes = (now.getTime() - healthTimestamp.getTime()) / (1000 * 60);
      
      if (ageMinutes < 5) {
        logResult('Health Timestamp', true, `Recent timestamp (${ageMinutes.toFixed(1)} minutes old)`);
      } else {
        logResult('Health Timestamp', false, `Stale timestamp (${ageMinutes.toFixed(1)} minutes old)`);
      }
    }
    
    // Check API key status if available
    if (healthData.mistralApiKeyStatus) {
      const apiKeyOk = healthData.mistralApiKeyStatus.configured;
      logResult('API Key Status', apiKeyOk, healthData.mistralApiKeyStatus.message);
    }
    
  } catch (error) {
    logResult('Basic Health Check', false, `Failed to perform basic health check: ${error}`);
  }
}

// Run the tests
async function main(): Promise<void> {
  await runVersionTest();
  await runBasicHealthCheck();
}

main().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});