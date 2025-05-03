#!/usr/bin/env node
/**
 * Release Name Generator
 * 
 * Helps generate release names following the project's convention.
 * See /docs/release-naming-convention.md for details.
 * 
 * Usage:
 *   node scripts/generate-release-name.js
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJsonPath = path.join(__dirname, '..', 'package.json');

// Codename suggestions by type
const CODENAME_SUGGESTIONS = {
  feature: ['Nova', 'Genesis', 'Horizon', 'Nexus', 'Zenith', 'Odyssey', 'Frontier'],
  fix: ['Salvage', 'Shield', 'Patch', 'Remedy', 'Mend', 'Tidy', 'Resolve'],
  breaking: ['Phoenix', 'Titan', 'Quantum', 'Revolution', 'Rebirth', 'Metamorph', 'Overhaul'],
  security: ['Bastion', 'Fortress', 'Aegis', 'Bulwark', 'Guardian', 'Citadel', 'Sentinel'],
  hotfix: ['Bolt', 'Flash', 'Rapid', 'Urgent', 'Swift', 'Instant', 'Prompt'],
  refactor: ['Flux', 'Reforge', 'Reform', 'Reshape', 'Realign', 'Adapt', 'Streamline'],
  maintenance: ['Atlas', 'Foundation', 'Backbone', 'Beacon', 'Compass', 'Anchor', 'Bedrock']
};

// Release type descriptions
const TYPE_DESCRIPTIONS = {
  feature: 'New capabilities or significant enhancements',
  fix: 'Bug fixes and minor improvements',
  breaking: 'Contains breaking changes requiring client updates',
  security: 'Primarily addresses security vulnerabilities',
  hotfix: 'Emergency fixes for critical issues',
  refactor: 'Code restructuring without functional changes',
  maintenance: 'Dependency updates, documentation, and housekeeping'
};

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Promisify readline question
 * @param {string} query - The question to ask
 * @returns {Promise<string>} - The user's answer
 */
function question(query) {
  return new Promise(resolve => {
    rl.question(query, answer => {
      resolve(answer);
    });
  });
}

/**
 * Get the current version from package.json
 * @returns {Promise<string>} - The current version
 */
async function getCurrentVersion() {
  try {
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonContent);
    return packageJson.version;
  } catch (error) {
    console.error('Error reading package.json:', error.message);
    return 'unknown';
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('\n🏷️  Release Name Generator 🏷️\n');
    console.log('This tool helps you generate a release name following the project convention.');
    console.log('See /docs/release-naming-convention.md for details.\n');
    
    // Get current version
    const currentVersion = await getCurrentVersion();
    console.log(`Current version (from package.json): ${currentVersion}`);
    
    // Ask for version
    const version = await question(`Enter the version number [${currentVersion}]: `);
    const finalVersion = version || currentVersion;
    
    // Print release types with descriptions
    console.log('\nRelease Types:');
    Object.entries(TYPE_DESCRIPTIONS).forEach(([type, description]) => {
      console.log(`- ${type}: ${description}`);
    });
    
    // Ask for release type
    let releaseType;
    do {
      releaseType = (await question('\nEnter the release type: ')).toLowerCase();
      if (!Object.keys(CODENAME_SUGGESTIONS).includes(releaseType)) {
        console.log('Invalid release type. Please try again.');
      }
    } while (!Object.keys(CODENAME_SUGGESTIONS).includes(releaseType));
    
    // Suggest codenames
    console.log(`\nSuggested codenames for ${releaseType} releases:`);
    CODENAME_SUGGESTIONS[releaseType].forEach(name => console.log(`- ${name}`));
    
    // Ask for codename
    const codename = await question('\nEnter the codename: ');
    if (!codename) {
      console.log('A codename is required.');
      rl.close();
      return;
    }
    
    // Generate the release name
    const releaseName = `v${finalVersion} - ${codename} [${releaseType.charAt(0).toUpperCase() + releaseType.slice(1)}]`;
    
    console.log('\n========================================');
    console.log(`Release Name: ${releaseName}`);
    console.log('========================================\n');
    
    // Suggest next steps
    console.log('Next steps:');
    console.log('1. Add this release name to the top of release-notes.md');
    console.log('2. Use this name in release announcements and documentation');
    console.log('3. Consider using it in git tags: git tag -a "' + releaseName + '" -m "Release ' + releaseName + '"');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    rl.close();
  }
}

// Run the main function
main();