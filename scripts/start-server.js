#!/usr/bin/env node
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { setTimeout } from 'timers/promises';

/**
 * This script starts the development server and waits until it's ready,
 * or exits with an error if the server fails to start within the timeout.
 */

// Constants
const SERVER_START_TIMEOUT = 30000; // 30 seconds
const SERVER_READY_MESSAGE = 'Ready on http://localhost';
const PORT = 8787;

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Start the server
console.log('Starting development server...');
const serverProcess = spawn('npm', ['run', 'dev'], {
  cwd: __dirname,
  shell: true,
  stdio: ['ignore', 'pipe', 'pipe'],
  detached: true // This lets the process run independently
});

// Set up output and error handling
let serverReady = false;
let errorOutput = '';

serverProcess.stdout.on('data', (data) => {
  const output = data.toString();
  process.stdout.write(output);
  
  if (output.includes(SERVER_READY_MESSAGE)) {
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

console.log(`Server started successfully on port ${PORT}. PID: ${serverProcess.pid}`);

// Detach from the process to allow it to run independently
serverProcess.unref();

// Print the command to kill the server
console.log(`To stop the server, run: kill ${serverProcess.pid}`);

// Exit this process, leaving the server running
process.exit(0);