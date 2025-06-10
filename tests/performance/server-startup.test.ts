/**
 * Performance test for server startup time
 * 
 * This test verifies that the server starts quickly, as expected for a Cloudflare Worker.
 * Since Cloudflare Workers are designed for fast cold starts and low latency,
 * our server should initialize within 1.5 seconds ideally, with a hard limit of 3 seconds.
 * 
 * Performance thresholds:
 * - Target: 1.5 seconds (good performance)
 * - Maximum: 3 seconds (test failure if exceeded)
 * 
 * This test helps:
 * 1. Catch performance regressions in server initialization
 * 2. Ensure we maintain fast startup times expected in serverless environments
 * 3. Alert developers if initialization code becomes too heavy
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve as pathResolve } from 'path';
import fs from 'fs/promises';

// Constants
const SERVER_START_TIMEOUT = 3000; // 3 seconds max (Cloudflare workers should start fast)
const TARGET_START_TIME = 1500; // 1.5 seconds target time for good performance
const SERVER_READY_MESSAGE = 'Ready on http://localhost';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = pathResolve(__dirname, '..', '..');
const serverScript = pathResolve(projectRoot, 'scripts', 'start-server.ts');
const PID_FILE_PATH = pathResolve(projectRoot, '.server-startup-test-pid');

describe('Server Startup Performance', function() {
  // Set a timeout just slightly longer than our maximum allowed startup time
  // Add just 1 second for test overhead (process spawning, cleanup, etc)
  jasmine.DEFAULT_TIMEOUT_INTERVAL = SERVER_START_TIMEOUT + 1000;
  
  let serverProcess: any = null;
  let startTime: number;
  
  beforeAll(async () => {
    // Make sure there's no leftover PID file from a previous test run
    try {
      await fs.unlink(PID_FILE_PATH).catch(() => {});
    } catch (err) {
      // Ignore errors if the file doesn't exist
    }
  });
  
  afterAll(async () => {
    // Clean up the server process if it's still running
    if (serverProcess) {
      try {
        serverProcess.kill();
      } catch (err) {
        console.error('Error killing server process:', err);
      }
    }
    
    // Clean up the PID file
    try {
      await fs.unlink(PID_FILE_PATH).catch(() => {});
    } catch (err) {
      // Ignore errors if the file doesn't exist
    }
  });
  
  it('should start within a reasonable time limit', async function() {
    // Skip if not in an environment where we can spawn processes
    if (typeof spawn !== 'function') {
      pending('spawn is not available in this environment');
      return;
    }
    
    // Create a promise that resolves when the server is ready or rejects on timeout
    const serverStartPromise = new Promise<number>((resolve, reject) => {
      startTime = Date.now();
      
      // Start the server
      console.log('Starting server for performance test...');
      serverProcess = spawn('npx', ['tsx', serverScript], {
        env: { 
          ...process.env,
          // Skip lengthy health checks for faster startup measurement
          SKIP_HEALTH_CHECK: 'true'
        },
        stdio: ['ignore', 'pipe', 'pipe']
      });
      
      // Save the PID for cleanup
      if (serverProcess.pid) {
        fs.writeFile(PID_FILE_PATH, serverProcess.pid.toString())
          .catch(err => console.error('Error saving PID:', err));
      }
      
      // Set up a timeout to reject the promise if the server doesn't start in time
      const timeoutId = setTimeout(() => {
        const elapsedTime = Date.now() - startTime;
        serverProcess.kill();
        console.log(`❌ TIMEOUT (${elapsedTime}ms)`);
        reject(new Error(`Server failed to start within ${SERVER_START_TIMEOUT}ms (actual: ${elapsedTime}ms)`));
      }, SERVER_START_TIMEOUT);
      
      // Process management
      let serverReady = false;
      let errorOutput = '';
      
      // Listen for server ready message
      serverProcess.stdout.on('data', (data: Buffer) => {
        const output = data.toString();
        
        // Check for server ready message 
        if (!serverReady && output.includes(SERVER_READY_MESSAGE)) {
          serverReady = true;
          const elapsedTime = Date.now() - startTime;
          console.log(`✅ SERVER READY (${elapsedTime}ms)`);
          
          // Clean up
          clearTimeout(timeoutId);
          serverProcess.kill();
          resolve(elapsedTime);
        }
      });
      
      // Collect error output
      serverProcess.stderr.on('data', (data: Buffer) => {
        const output = data.toString();
        errorOutput += output;
        console.error(`Server error: ${output}`);
      });
      
      // Handle server exit
      serverProcess.on('exit', (code: number, signal: string) => {
        // If the server exited without being ready, we have a problem
        if (!serverReady) {
          const elapsedTime = Date.now() - startTime;
          clearTimeout(timeoutId);
          console.log(`❌ SERVER EXIT (${elapsedTime}ms) with code ${code}`);
          if (errorOutput) {
            console.error(`Server error output: ${errorOutput}`);
          }
          reject(new Error(`Server exited with code ${code} after ${elapsedTime}ms`));
        }
      });
      
      // Handle process errors
      serverProcess.on('error', (err: Error) => {
        const elapsedTime = Date.now() - startTime;
        clearTimeout(timeoutId);
        console.log(`❌ SERVER ERROR (${elapsedTime}ms): ${err.message}`);
        reject(new Error(`Failed to start server: ${err.message} after ${elapsedTime}ms`));
      });
    });
    
    // Wait for the server to start and measure the time
    try {
      const startupTime = await serverStartPromise;
      
      // Log the startup time with performance indicators
      if (startupTime <= TARGET_START_TIME) {
        console.log(`✅ FAST STARTUP: Server started in ${startupTime}ms (target: ${TARGET_START_TIME}ms)`);
      } else if (startupTime <= SERVER_START_TIMEOUT) {
        console.log(`⚠️ SLOW STARTUP: Server started in ${startupTime}ms (target: ${TARGET_START_TIME}ms)`);
      } else {
        console.log(`❌ TIMEOUT EXCEEDED: Server started in ${startupTime}ms (limit: ${SERVER_START_TIMEOUT}ms)`);
      }
      
      // Verify startup meets our requirements
      expect(startupTime).toBeLessThan(SERVER_START_TIMEOUT);
      
      // Warning for slow startup (not a failure, but worth noting)
      if (startupTime > TARGET_START_TIME) {
        console.warn(`Server startup was slower than target time of ${TARGET_START_TIME}ms. Consider optimizing initialization.`);
      }
      
      // Additional checks could include verifying the server responds to requests
      // but we'll keep it simple for now since this is just a startup test
    } catch (error) {
      fail(error);
    } finally {
      // Clean up
      if (serverProcess) {
        serverProcess.kill();
        console.log('Server process terminated');
      }
    }
  });
});