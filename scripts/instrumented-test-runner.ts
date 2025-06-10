#!/usr/bin/env node
/**
 * Instrumented test runner to measure performance bottlenecks
 */

import { spawn } from 'child_process';
import { addDevVarsToEnv } from './load-dev-vars.ts';

const timers = {};

function startTimer(name) {
  timers[name] = Date.now();
  console.log(`⏱️  [${new Date().toISOString()}] STARTING: ${name}`);
}

function endTimer(name) {
  const duration = Date.now() - timers[name];
  console.log(`✅ [${new Date().toISOString()}] FINISHED: ${name} (${duration}ms)`);
  return duration;
}

async function runInstrumentedHealthTest() {
  console.log('🔍 INSTRUMENTED INTEGRATION TEST RUNNER');
  console.log('=====================================');
  
  const totalStart = Date.now();
  
  try {
    // 1. Environment loading
    startTimer('Environment Loading');
    await addDevVarsToEnv();
    endTimer('Environment Loading');
    
    // 2. Server startup
    startTimer('Server Startup');
    console.log('🚀 Starting Wrangler server...');
    
    const server = spawn('wrangler', ['dev', '--port', '8787'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false
    });
    
    let serverReady = false;
    let serverOutput = '';
    
    server.stdout.on('data', (data) => {
      const output = data.toString();
      serverOutput += output;
      if (output.includes('Ready on http://localhost:8787')) {
        serverReady = true;
        endTimer('Server Startup');
        startTimer('Health Check Request');
      }
    });
    
    server.stderr.on('data', (data) => {
      console.log(`📝 Server stderr: ${data.toString().slice(0, 200)}...`);
    });
    
    // Wait for server with detailed timing
    const maxWait = 15000; // 15 seconds max
    const checkInterval = 500; // Check every 500ms
    let waited = 0;
    
    while (!serverReady && waited < maxWait) {
      await new Promise(r => setTimeout(r, checkInterval));
      waited += checkInterval;
      if (waited % 2000 === 0) {
        console.log(`⏳ Still waiting for server... (${waited/1000}s elapsed)`);
      }
    }
    
    if (!serverReady) {
      console.log('❌ Server failed to start within 15 seconds');
      console.log('📝 Server output so far:', serverOutput);
      server.kill();
      return;
    }
    
    // 3. Health check
    console.log('🏥 Testing health endpoint...');
    const response = await fetch('http://localhost:8787/health');
    endTimer('Health Check Request');
    
    startTimer('Response Processing');
    if (response.ok) {
      const data = await response.json();
      endTimer('Response Processing');
      console.log(`✅ Health check passed: ${data.status} v${data.version}`);
    } else {
      endTimer('Response Processing');
      console.log(`❌ Health check failed: ${response.status}`);
    }
    
    // 4. Cleanup
    startTimer('Server Cleanup');
    server.kill();
    endTimer('Server Cleanup');
    
    const totalTime = Date.now() - totalStart;
    console.log('=====================================');
    console.log(`🎯 TOTAL TEST TIME: ${totalTime}ms (${(totalTime/1000).toFixed(1)}s)`);
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

runInstrumentedHealthTest();