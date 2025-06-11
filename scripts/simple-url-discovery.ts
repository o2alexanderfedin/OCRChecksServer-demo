#!/usr/bin/env npx tsx
/**
 * Simple URL Discovery for Cloudflare Workers
 * 
 * This script discovers the actual working URLs for deployed workers by:
 * 1. Reading worker names from wrangler.toml
 * 2. Testing known URL patterns
 * 3. Returning verified working URLs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Environment setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

/**
 * Parse wrangler.toml to get worker names
 */
function parseWranglerConfig(): Record<string, string> {
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
}

/**
 * Test if a URL is accessible
 */
async function testUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(`${url}/health`, {
      signal: AbortSignal.timeout(5000),
      method: 'GET'
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Discover working URLs for all environments
 */
async function discoverWorkingUrls(): Promise<Record<string, string>> {
  const workerNames = parseWranglerConfig();
  const urls: Record<string, string> = {};
  
  console.log(`${colors.magenta}Discovering working URLs...${colors.reset}`);
  
  // Known subdomain patterns to try
  const subdomainPatterns = [
    'af-4a0',  // Current known working pattern
    '',        // Direct workers.dev (fallback)
  ];
  
  for (const [env, workerName] of Object.entries(workerNames)) {
    console.log(`\nTesting ${env} (${workerName}):`);
    
    let foundUrl = null;
    
    // Try each subdomain pattern
    for (const subdomain of subdomainPatterns) {
      const testUrl = subdomain 
        ? `https://${workerName}.${subdomain}.workers.dev`
        : `https://${workerName}.workers.dev`;
      
      console.log(`  Testing: ${testUrl}`);
      
      const isWorking = await testUrl(testUrl);
      if (isWorking) {
        console.log(`    ${colors.green}✓ Working!${colors.reset}`);
        foundUrl = testUrl;
        break;
      } else {
        console.log(`    ${colors.red}✗ Not accessible${colors.reset}`);
      }
    }
    
    if (foundUrl) {
      urls[env] = foundUrl;
      console.log(`  ${colors.green}${env}: ${foundUrl}${colors.reset}`);
    } else {
      // Use fallback pattern
      urls[env] = `https://${workerName}.workers.dev`;
      console.log(`  ${colors.yellow}${env}: ${urls[env]} (fallback - unverified)${colors.reset}`);
    }
  }
  
  // Add local
  urls.local = 'http://localhost:8787';
  console.log(`\n  ${colors.cyan}local: ${urls.local}${colors.reset}`);
  
  return urls;
}

/**
 * Export URLs in different formats
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const format = args.includes('--format') ? args[args.indexOf('--format') + 1] : 'json';
  
  const urls = await discoverWorkingUrls();
  
  console.log(`\n${colors.magenta}Results:${colors.reset}`);
  
  switch (format) {
    case 'env':
      for (const [env, url] of Object.entries(urls)) {
        console.log(`export OCR_API_URL_${env.toUpperCase()}="${url}"`);
      }
      break;
      
    case 'json':
      console.log(JSON.stringify(urls, null, 2));
      break;
      
    case 'typescript':
      console.log(`export const environmentUrls = ${JSON.stringify(urls, null, 2)};`);
      break;
      
    default:
      console.log('\nEnvironment URLs:');
      for (const [env, url] of Object.entries(urls)) {
        console.log(`  ${env.padEnd(12)}: ${url}`);
      }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

// Export for use in other scripts
export { discoverWorkingUrls, parseWranglerConfig };