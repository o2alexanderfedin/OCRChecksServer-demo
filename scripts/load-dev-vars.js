#!/usr/bin/env node
/**
 * Utility to load environment variables from .dev.vars file
 * This is used to ensure consistent environment variable loading
 * across test scripts and server startup
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the project root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

/**
 * Loads environment variables from .dev.vars file
 * @returns {Promise<Record<string, string>>} Object containing the loaded variables
 */
export async function loadDevVars() {
  const devVarsPath = path.join(projectRoot, '.dev.vars');
  let variables = {};

  try {
    // Check if .dev.vars exists
    const fileContent = await fs.readFile(devVarsPath, 'utf-8');
    const lines = fileContent.split('\n').filter(line => line.trim());

    // Parse each line as KEY=VALUE
    for (const line of lines) {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const [, key, value] = match;
        variables[key.trim()] = value.trim();
      }
    }

    console.log(`Loaded ${Object.keys(variables).length} variables from .dev.vars`);
    // Mask sensitive values in logs
    const maskedVars = Object.keys(variables).map(key => {
      const isSecret = key.includes('KEY') || key.includes('SECRET') || key.includes('TOKEN');
      const value = isSecret ? `${variables[key].substring(0, 4)}****` : variables[key];
      return `${key}=${value}`;
    });
    console.log(`Variables: ${maskedVars.join(', ')}`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('No .dev.vars file found, skipping environment variable loading');
    } else {
      console.error(`Error loading .dev.vars: ${error.message}`);
    }
  }

  return variables;
}

/**
 * Adds variables from .dev.vars file to process.env if they don't already exist
 * @returns {Promise<void>}
 */
export async function addDevVarsToEnv() {
  const variables = await loadDevVars();
  
  // Add each variable to process.env if it doesn't already exist
  for (const [key, value] of Object.entries(variables)) {
    if (!process.env[key]) {
      process.env[key] = value;
      const isSecret = key.includes('KEY') || key.includes('SECRET') || key.includes('TOKEN');
      console.log(`Set ${key}=${isSecret ? `${value.substring(0, 4)}****` : value} from .dev.vars`);
    } else {
      console.log(`${key} already exists in environment, not overwriting`);
    }
  }
}

// If this script is run directly, load variables into process.env
if (import.meta.url === `file://${process.argv[1]}`) {
  await addDevVarsToEnv();
  console.log('Environment variables loaded from .dev.vars');
}