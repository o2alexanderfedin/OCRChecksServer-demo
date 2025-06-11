#!/usr/bin/env npx tsx
/**
 * Get Cloudflare Environment URLs
 * 
 * This script queries Cloudflare to get the actual deployment URLs for each environment.
 * It can use either the Cloudflare API or wrangler CLI to fetch the real URLs.
 * 
 * Usage:
 *   npx tsx scripts/get-cloudflare-urls.ts [--method api|wrangler] [--format json|env|urls]
 * 
 * Options:
 *   --method     Method to query URLs: 'api' (Cloudflare API) or 'wrangler' (CLI) [default: wrangler]
 *   --format     Output format: 'json', 'env', or 'urls' [default: urls]
 * 
 * Examples:
 *   npx tsx scripts/get-cloudflare-urls.ts                    # Get URLs using wrangler
 *   npx tsx scripts/get-cloudflare-urls.ts --method api       # Use Cloudflare API
 *   npx tsx scripts/get-cloudflare-urls.ts --format json      # Output as JSON
 *   npx tsx scripts/get-cloudflare-urls.ts --format env       # Output as env vars
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
  method: args.includes('--method') ? args[args.indexOf('--method') + 1] : 'wrangler',
  format: args.includes('--format') ? args[args.indexOf('--format') + 1] : 'urls'
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
  if (options.format === 'urls' || options.format === 'json') {
    console.log(`${color}${message}${colors.reset}`);
  }
}

/**
 * Parse wrangler.toml to get worker names for each environment
 */
function parseWranglerConfig(): Record<string, string> {
  try {
    const wranglerPath = path.join(projectRoot, 'wrangler.toml');
    const wranglerContent = fs.readFileSync(wranglerPath, 'utf8');
    
    const workerNames: Record<string, string> = {};
    
    // Parse main worker name
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
 * Get worker URLs using wrangler CLI
 */
async function getUrlsWithWrangler(workerNames: Record<string, string>): Promise<Record<string, string>> {
  const urls: Record<string, string> = {};
  
  for (const [env, workerName] of Object.entries(workerNames)) {
    try {
      log(`Querying ${env} environment (${workerName})...`, colors.cyan);
      
      // Run wrangler whoami to get account info first
      const whoamiResult = await runCommand('wrangler', ['whoami']);
      if (whoamiResult.includes('You are not authenticated')) {
        throw new Error('Not authenticated with Cloudflare. Run: wrangler auth login');
      }
      
      // Get subdomain info - for workers.dev URLs we can construct them
      // The format is: https://{worker-name}.{account-subdomain}.workers.dev
      
      // Try to get worker info
      const workerInfoArgs = env === 'production' 
        ? ['worker', 'get', workerName]
        : ['worker', 'get', workerName, '--env', env];
      
      try {
        const workerInfo = await runCommand('wrangler', workerInfoArgs);
        
        // Extract subdomain from wrangler output or construct URL
        // For most cases, we can construct the URL directly
        const accountSubdomain = await getAccountSubdomain();
        
        if (accountSubdomain) {
          urls[env] = `https://${workerName}.${accountSubdomain}.workers.dev`;
        } else {
          // Fallback: try to extract from worker info or use default pattern
          urls[env] = `https://${workerName}.workers.dev`;
        }
        
        log(`  ${env}: ${urls[env]}`, colors.green);
      } catch (error) {
        log(`  ${env}: Could not determine URL for ${workerName}`, colors.yellow);
        // Use fallback URL pattern
        urls[env] = `https://${workerName}.workers.dev`;
      }
      
    } catch (error) {
      log(`  ${env}: Error querying worker ${workerName}: ${error}`, colors.red);
      // Use fallback URL pattern
      urls[env] = `https://${workerNames[env]}.workers.dev`;
    }
  }
  
  return urls;
}

/**
 * Get account subdomain for workers.dev URLs
 */
async function getAccountSubdomain(): Promise<string | null> {
  try {
    // Try to get subdomain from wrangler whoami or other command
    const whoami = await runCommand('wrangler', ['whoami']);
    
    // Look for account subdomain pattern in output
    const subdomainMatch = whoami.match(/([a-zA-Z0-9-]+)\.workers\.dev/);
    if (subdomainMatch) {
      return subdomainMatch[1];
    }
    
    // Alternative: try to parse from existing deployments
    try {
      const deployments = await runCommand('wrangler', ['deployments', 'list']);
      const urlMatch = deployments.match(/https:\/\/[^.]+\.([^.]+)\.workers\.dev/);
      if (urlMatch) {
        return urlMatch[1];
      }
    } catch {
      // Ignore deployment list errors
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Get worker URLs using Cloudflare API
 */
async function getUrlsWithAPI(workerNames: Record<string, string>): Promise<Record<string, string>> {
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  
  if (!apiToken) {
    throw new Error('CLOUDFLARE_API_TOKEN environment variable is required for API method');
  }
  
  const urls: Record<string, string> = {};
  
  // First, get account ID
  const accountResponse = await fetch('https://api.cloudflare.com/client/v4/accounts', {
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!accountResponse.ok) {
    throw new Error(`Failed to get account info: ${accountResponse.status}`);
  }
  
  const accountData = await accountResponse.json();
  const accountId = accountData.result[0]?.id;
  
  if (!accountId) {
    throw new Error('No account found');
  }
  
  log(`Using account ID: ${accountId}`, colors.cyan);
  
  // Get workers for this account
  for (const [env, workerName] of Object.entries(workerNames)) {
    try {
      log(`Querying ${env} environment (${workerName})...`, colors.cyan);
      
      const workerResponse = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${workerName}`,
        {
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (workerResponse.ok) {
        // Get subdomain info
        const subdomainResponse = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/subdomain`,
          {
            headers: {
              'Authorization': `Bearer ${apiToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (subdomainResponse.ok) {
          const subdomainData = await subdomainResponse.json();
          const subdomain = subdomainData.result?.subdomain;
          
          if (subdomain) {
            urls[env] = `https://${workerName}.${subdomain}.workers.dev`;
          } else {
            urls[env] = `https://${workerName}.workers.dev`;
          }
        } else {
          urls[env] = `https://${workerName}.workers.dev`;
        }
        
        log(`  ${env}: ${urls[env]}`, colors.green);
      } else {
        log(`  ${env}: Worker ${workerName} not found or not accessible`, colors.yellow);
        urls[env] = `https://${workerName}.workers.dev`;
      }
    } catch (error) {
      log(`  ${env}: Error querying ${workerName}: ${error}`, colors.red);
      urls[env] = `https://${workerName}.workers.dev`;
    }
  }
  
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
 * Output results in the requested format
 */
function outputResults(urls: Record<string, string>): void {
  switch (options.format) {
    case 'json':
      console.log(JSON.stringify(urls, null, 2));
      break;
      
    case 'env':
      for (const [env, url] of Object.entries(urls)) {
        const envVar = `OCR_API_URL_${env.toUpperCase()}`;
        console.log(`export ${envVar}="${url}"`);
      }
      break;
      
    case 'urls':
    default:
      log(`\n${colors.bright}${colors.magenta}Environment URLs:${colors.reset}`);
      for (const [env, url] of Object.entries(urls)) {
        log(`  ${env.padEnd(12)}: ${colors.cyan}${url}${colors.reset}`);
      }
      break;
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    log(`${colors.bright}${colors.magenta}Cloudflare Environment URL Discovery${colors.reset}`);
    log(`Method: ${colors.cyan}${options.method}${colors.reset}`);
    log(`Format: ${colors.cyan}${options.format}${colors.reset}\n`);
    
    // Parse wrangler.toml to get worker names
    const workerNames = parseWranglerConfig();
    log(`Found workers:`, colors.yellow);
    for (const [env, name] of Object.entries(workerNames)) {
      log(`  ${env}: ${name}`, colors.cyan);
    }
    log('');
    
    // Get URLs using the specified method
    let urls: Record<string, string>;
    
    if (options.method === 'api') {
      urls = await getUrlsWithAPI(workerNames);
    } else {
      urls = await getUrlsWithWrangler(workerNames);
    }
    
    // Add local development URL
    urls.local = 'http://localhost:8787';
    
    // Output results
    outputResults(urls);
    
  } catch (error) {
    console.error(`${colors.red}Error: ${error}${colors.reset}`);
    process.exit(1);
  }
}

// Run the script
main();