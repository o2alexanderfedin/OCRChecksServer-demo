#!/usr/bin/env node
/**
 * Quick health test that should complete in under 5 seconds
 */

import { spawn } from 'child_process';
import { addDevVarsToEnv } from './load-dev-vars.js';

console.log('Starting quick health test...');

// Load environment
await addDevVarsToEnv();

console.log('Starting server...');
const server = spawn('wrangler', ['dev', '--port', '8787'], {
  stdio: ['ignore', 'pipe', 'ignore'],
  detached: false
});

let serverReady = false;
server.stdout.on('data', (data) => {
  const output = data.toString();
  if (output.includes('Ready on http://localhost:8787')) {
    serverReady = true;
  }
});

// Wait maximum 3 seconds for server
for (let i = 0; i < 30; i++) {
  if (serverReady) break;
  await new Promise(r => setTimeout(r, 100));
}

if (!serverReady) {
  console.log('❌ Server failed to start within 3 seconds');
  server.kill();
  process.exit(1);
}

console.log('✅ Server ready, testing health endpoint...');

try {
  const start = Date.now();
  const response = await fetch('http://localhost:8787/health');
  const duration = Date.now() - start;
  
  if (response.ok) {
    const data = await response.json();
    console.log(`✅ Health check passed in ${duration}ms`);
    console.log(`Status: ${data.status}, Version: ${data.version}`);
  } else {
    console.log(`❌ Health check failed: ${response.status}`);
    process.exit(1);
  }
} catch (error) {
  console.log(`❌ Health check error: ${error.message}`);
  process.exit(1);
} finally {
  server.kill();
}

console.log('✅ Quick health test completed successfully');