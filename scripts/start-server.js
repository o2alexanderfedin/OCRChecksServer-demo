#!/usr/bin/env node
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve as pathResolve } from 'path';
import { setTimeout } from 'timers/promises';

/**
 * This script starts the development server and waits until it's ready,
 * or exits with an error if the server fails to start within the timeout.
 */

// Constants
const SERVER_START_TIMEOUT = 60000; // 60 seconds
const SERVER_READY_MESSAGE = 'Ready on http://localhost';
const PORT = 8787;

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Start the server
console.log('Starting development server...');
const serverProcess = spawn('npm', ['run', 'dev'], {
  cwd: pathResolve(__dirname, '..'), // Point to project root instead of scripts directory
  shell: true,
  stdio: ['ignore', 'pipe', 'pipe'],
  detached: true // This lets the process run independently
});

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

// Detach from the process to allow it to run independently
serverProcess.unref();

// Print the command to kill the server
console.log(`To stop the server, run: kill ${serverProcess.pid}`);

// Exit this process, leaving the server running
process.exit(0);