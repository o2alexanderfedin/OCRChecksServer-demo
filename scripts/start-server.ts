#!/usr/bin/env node
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve as pathResolve, join } from 'path';
import { setTimeout } from 'timers/promises';
import fs from 'fs/promises';
import { addDevVarsToEnv } from './load-dev-vars.ts';

/**
 * This script starts the development server and waits until it's ready,
 * or exits with an error if the server fails to start within the timeout.
 * 
 * Enhanced with proper server process tracking and improved cleanup mechanism.
 */

// Constants
const SERVER_START_TIMEOUT = 60000; // 60 seconds
const SERVER_READY_MESSAGE = 'Ready on http://localhost';
const PORT = 8787;
const PID_FILE_PATH = join(process.cwd(), '.server-pid');

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if there's an existing server process
async function checkExistingServer() {
  try {
    const existingPid = await fs.readFile(PID_FILE_PATH, 'utf8');
    const pid = parseInt(existingPid.trim(), 10);
    
    if (pid && !isNaN(pid)) {
      console.log(`Found existing server process with PID: ${pid}`);
      try {
        // Check if process exists by sending signal 0 (doesn't actually send a signal)
        process.kill(pid, 0);
        console.log('Existing server is still running, terminating it...');
        process.kill(pid);
        console.log('Waiting for existing server to shut down...');
        await setTimeout(2000); // Wait for the server to shut down
      } catch (err) {
        if (err.code === 'ESRCH') {
          console.log('Existing server process is not running anymore.');
        } else {
          console.error('Error checking existing server:', err);
        }
      }
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error('Error reading PID file:', err);
    }
  }
}

// Function to clean up the server
async function saveServerPid(pid) {
  try {
    await fs.writeFile(PID_FILE_PATH, pid.toString());
    console.log(`Server PID ${pid} saved to ${PID_FILE_PATH}`);
  } catch (err) {
    console.error('Error saving server PID to file:', err);
  }
}

// Clean up existing server if any
await checkExistingServer();

// Load environment variables from .dev.vars
console.log('Loading environment variables from .dev.vars file...');
await addDevVarsToEnv();

// Check if we have the API key
if (!process.env.MISTRAL_API_KEY) {
  console.error('ERROR: MISTRAL_API_KEY environment variable is not set');
  console.error('Please add it to your .dev.vars file or set it as an environment variable');
  process.exit(1);
}

// Log the API key (partially masked)
console.log('INFO: Using MISTRAL_API_KEY from .dev.vars');
console.log(`API Key length: ${process.env.MISTRAL_API_KEY.length} characters`);
console.log(`API Key first 4 chars: ${process.env.MISTRAL_API_KEY.substring(0, 4)}****`);

// Start the server with the custom environment
console.log('Starting development server...');
// Try to use a consistent port (8787) by default
const port = process.env.SERVER_PORT || 8787;
console.log(`Attempting to start server on port ${port}...`);
const serverProcess = spawn('wrangler', [
  'dev', 
  '--port', port.toString(),
  '--var', `MISTRAL_API_KEY:${process.env.MISTRAL_API_KEY}`
], {
  cwd: pathResolve(__dirname, '..'), // Point to project root instead of scripts directory
  shell: true,
  stdio: ['ignore', 'pipe', 'pipe'],
  detached: false // Changed to false to ensure process is properly managed
});

// Save the server's PID for easier management
await saveServerPid(serverProcess.pid);

// Set up output and error handling
let serverReady = false;
let serverUrl = null;
let errorOutput = '';

serverProcess.stdout.on('data', (data) => {
  const output = data.toString();
  process.stdout.write(output);
  
  // Check for server ready message and extract the actual URL
  if (output.includes(SERVER_READY_MESSAGE)) {
    const match = output.match(/Ready on (http:\/\/localhost:\d+)/);
    if (match && match[1]) {
      serverUrl = match[1];
      console.log(`Found server URL: ${serverUrl}`);
      // Export the URL as an environment variable for tests
      process.env.OCR_API_URL = serverUrl;
    }
    serverReady = true;
  }
});

serverProcess.stderr.on('data', (data) => {
  const output = data.toString();
  process.stderr.write(output);
  errorOutput += output;
});

// Wait for server to be ready or timeout
const startTime = Date.now();
while (!serverReady && (Date.now() - startTime < SERVER_START_TIMEOUT)) {
  await setTimeout(100);
}

// Check if server started successfully
if (!serverReady) {
  console.error(`Server failed to start within ${SERVER_START_TIMEOUT / 1000} seconds.`);
  console.error('Error output:', errorOutput);
  serverProcess.kill();
  process.exit(1);
}

// Verify server is actually responding with a health check
if (serverUrl) {
  try {
    console.log('Performing health check on server...');
    // Wait a moment for the server to initialize fully
    await setTimeout(1000);
    
    // Attempt to make a simple request to verify the server is responding
    const response = await fetch(`${serverUrl}/health`, { 
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    if (response.ok) {
      console.log('Server health check passed!');
    } else {
      console.log(`Server responded with status: ${response.status}`);
    }
  } catch (error) {
    console.warn(`Server health check failed: ${error.message}`);
    console.log('Continuing anyway, but tests might fail if server is not ready');
  }
}

console.log(`Server started successfully on port ${PORT}. PID: ${serverProcess.pid}`);

// Print the command to kill the server
console.log(`To stop the server, run: kill ${serverProcess.pid}`);

// THIS IS THE KEY CHANGE: Don't detach and don't exit
// We'll keep this process running, and it will be killed by the test runner
// This ensures the server process is properly terminated when tests finish