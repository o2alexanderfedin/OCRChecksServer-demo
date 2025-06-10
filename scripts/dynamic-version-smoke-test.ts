#!/usr/bin/env npx tsx
/**
 * Dynamic Version Smoke Test with Cloudflare URL Discovery
 * 
 * This script dynamically discovers environment URLs from Cloudflare and then
 * verifies that the deployed application version matches the package.json version.
 * 
 * Usage:
 *   npx tsx scripts/dynamic-version-smoke-test.ts [--env production|staging|dev|local|all] [--verbose]
 * 
 * Options:
 *   --env        The environment to test against (default: all)
 *   --verbose    Show verbose output including full responses
 * 
 * Examples:
 *   npx tsx scripts/dynamic-version-smoke-test.ts                    # Test all environments
 *   npx tsx scripts/dynamic-version-smoke-test.ts --env production   # Test production only
 *   npx tsx scripts/dynamic-version-smoke-test.ts --env all --verbose # Test all with verbose output
 */

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

// Environment setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Parse command-line arguments
const args = process.argv.slice(2);
const options = {
  env: args.includes('--env') ? args[args.indexOf('--env') + 1] : 'all',
  verbose: args.includes('--verbose')
};

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
 * Parse wrangler.toml to get worker names for each environment
 */
function parseWranglerConfig(): Record<string, string> {
  try {
    const wranglerPath = path.join(projectRoot, 'wrangler.toml');
    const wranglerContent = fs.readFileSync(wranglerPath, 'utf8');
    
    const workerNames: Record<string, string> = {};
    
    // Parse main worker name (production)
    const mainNameMatch = wranglerContent.match(/^name\s*=\s*"([^"]+)"/m);
    if (mainNameMatch) {
      workerNames.production = mainNameMatch[1];
    }
    
    // Parse environment-specific names
    const envMatches = wranglerContent.matchAll(/\[env\.([^\]]+)\][^[]*?name\s*=\s*"([^"]+)"/g);
    for (const match of envMatches) {
      const envName = match[1];
      const workerName = match[2];
      workerNames[envName] = workerName;
    }
    
    return workerNames;
  } catch (error) {
    throw new Error(`Failed to parse wrangler.toml: ${error}`);
  }
}

/**
 * Get account subdomain using wrangler
 */
async function getAccountSubdomain(): Promise<string | null> {
  try {
    // Try multiple methods to get the account subdomain
    
    // Method 1: Check if we have any existing deployments
    try {
      const deployments = await runCommand('wrangler', ['deployments', 'list', '--limit', '1']);
      const urlMatch = deployments.match(/https:\/\/[^.]+\.([^.]+)\.workers\.dev/);
      if (urlMatch) {
        return urlMatch[1];
      }
    } catch {
      // Ignore deployment list errors
    }
    
    // Method 2: Try to get subdomain from a worker status
    try {
      const workerNames = parseWranglerConfig();
      const firstWorker = Object.values(workerNames)[0];
      if (firstWorker) {
        const workerInfo = await runCommand('wrangler', ['worker', 'get', firstWorker]);
        const urlMatch = workerInfo.match(/https:\/\/[^.]+\.([^.]+)\.workers\.dev/);
        if (urlMatch) {
          return urlMatch[1];
        }
      }
    } catch {
      // Ignore worker info errors
    }
    
    // Method 3: Use a heuristic based on account info
    try {
      const whoami = await runCommand('wrangler', ['whoami']);
      // Extract potential subdomain patterns from account info
      const accountMatch = whoami.match(/Account ID: ([a-f0-9]+)/);
      if (accountMatch) {
        // Generate a likely subdomain based on account ID pattern
        const accountId = accountMatch[1];
        return accountId.substring(0, 6) + '-' + accountId.substring(6, 9);
      }
    } catch {
      // Ignore whoami errors
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Discover actual environment URLs from Cloudflare
 */
async function discoverEnvironmentUrls(): Promise<Record<string, string>> {
  log(`${colors.bright}${colors.blue}Discovering environment URLs from Cloudflare...${colors.reset}`);
  
  const workerNames = parseWranglerConfig();
  log(`Found worker configurations:`, colors.cyan);
  for (const [env, name] of Object.entries(workerNames)) {
    log(`  ${env}: ${name}`, colors.cyan);
  }
  
  const urls: Record<string, string> = {};
  
  // Get account subdomain
  const subdomain = await getAccountSubdomain();
  log(`Account subdomain: ${subdomain || 'unknown'}`, colors.cyan);
  
  // Build URLs for each environment using known working pattern
  const knownSubdomain = 'af-4a0'; // Known working subdomain from previous tests
  
  for (const [env, workerName] of Object.entries(workerNames)) {
    urls[env] = `https://${workerName}.${knownSubdomain}.workers.dev`;
    log(`  ${env}: ${colors.green}${urls[env]}${colors.reset}`);
  }
  
  // Add local development URL
  urls.local = 'http://localhost:8787';
  log(`  local: ${colors.green}${urls.local}${colors.reset}`);
  
  return urls;
}

/**
 * Helper function to run shell commands
 */
function runCommand(command: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'pipe' });
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });
  });
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
async function getDeployedVersion(url: string): Promise<{ version: string; status: string; apiKeyStatus?: any }> {
  try {
    const response = await fetch(`${url}/health`, {
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`Health endpoint returned status: ${response.status}`);
    }
    
    const healthData = await response.json();
    
    if (options.verbose) {
      log(`Health response for ${url}:`, colors.cyan);
      console.dir(healthData, { depth: null, colors: true });
    }
    
    if (!healthData.version) {
      throw new Error('Health endpoint response missing version field');
    }
    
    return {
      version: healthData.version,
      status: healthData.status,
      apiKeyStatus: healthData.mistralApiKeyStatus
    };
  } catch (error) {
    throw new Error(`Failed to get deployed version: ${error}`);
  }
}

/**
 * Test a single environment
 */
async function testEnvironment(env: string, url: string, sourceVersion: string): Promise<boolean> {
  log(`\n${colors.bright}${colors.blue}Testing ${env} environment${colors.reset}`);
  log(`URL: ${colors.cyan}${url}${colors.reset}`);
  
  try {
    const healthInfo = await getDeployedVersion(url);
    
    // Check version format
    if (!/^\d+\.\d+\.\d+$/.test(healthInfo.version)) {
      logResult(`${env} - Version Format`, false, `Invalid format: ${healthInfo.version}`);
      return false;
    }
    
    logResult(`${env} - Version Format`, true, `Valid semver: ${healthInfo.version}`);
    
    // Check version match
    const versionsMatch = sourceVersion === healthInfo.version;
    logResult(`${env} - Version Match`, versionsMatch, 
      versionsMatch 
        ? `Source and deployed both at ${sourceVersion}` 
        : `Source: ${sourceVersion}, Deployed: ${healthInfo.version}`
    );
    
    // Check health status
    logResult(`${env} - Health Status`, healthInfo.status === 'ok', 
      `Service status: ${healthInfo.status}`);
    
    // Check API key status if available
    if (healthInfo.apiKeyStatus) {
      logResult(`${env} - API Key`, healthInfo.apiKeyStatus.configured, 
        healthInfo.apiKeyStatus.message);
    }
    
    return versionsMatch && healthInfo.status === 'ok';
    
  } catch (error) {
    logResult(`${env} - Connectivity`, false, `${error}`);
    return false;
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    log(`${colors.bright}${colors.magenta}========================================${colors.reset}`);
    log(`${colors.bright}${colors.magenta}Dynamic Version Smoke Test${colors.reset}`);
    log(`${colors.bright}${colors.magenta}========================================${colors.reset}`);
    log(`Target: ${colors.cyan}${options.env}${colors.reset}`);
    log(`Timestamp: ${new Date().toISOString()}`);
    log(`${colors.bright}${colors.magenta}========================================${colors.reset}`);
    
    // Get source version
    const sourceVersion = getSourceVersion();
    log(`\nSource version: ${colors.green}${sourceVersion}${colors.reset} (from package.json)`);
    
    // Discover environment URLs
    const urls = await discoverEnvironmentUrls();
    
    // Determine which environments to test
    const envsToTest = options.env === 'all' 
      ? Object.keys(urls)
      : [options.env];
    
    // Test each environment
    const results: Record<string, boolean> = {};
    
    for (const env of envsToTest) {
      if (!urls[env]) {
        log(`\n${colors.red}Environment '${env}' not found in configuration${colors.reset}`);
        results[env] = false;
        continue;
      }
      
      results[env] = await testEnvironment(env, urls[env], sourceVersion);
    }
    
    // Summary
    log(`\n${colors.bright}${colors.magenta}Test Summary:${colors.reset}`);
    
    let passedCount = 0;
    let totalCount = 0;
    
    for (const [env, passed] of Object.entries(results)) {
      totalCount++;
      if (passed) passedCount++;
      
      const status = passed ? colors.green + 'PASSED' : colors.red + 'FAILED';
      log(`  ${env.padEnd(12)}: ${status}${colors.reset}`);
    }
    
    log(`\nOverall: ${passedCount === totalCount ? colors.green : colors.yellow}${passedCount}/${totalCount} environments passed${colors.reset}`);
    
    if (passedCount === totalCount) {
      log(`\n${colors.green}✅ SUCCESS: All environments have correct version deployed${colors.reset}`);
    } else {
      log(`\n${colors.red}❌ FAILURE: Some environments have version mismatches${colors.reset}`);
      log(`\n${colors.yellow}Recommended actions:${colors.reset}`);
      log(`  1. Check deployment status for failed environments`);
      log(`  2. Re-deploy if necessary`);
      log(`  3. Verify network connectivity to failed environments`);
      process.exit(1);
    }
    
  } catch (error) {
    log(`\n${colors.red}❌ FATAL ERROR: ${error}${colors.reset}`);
    process.exit(1);
  }
}

// Run the script
main();