/**
 * Advanced Server Performance Statistics Test
 * 
 * This test captures detailed performance statistics by measuring server
 * startup time across multiple runs. It calculates min, max, average, and
 * percentile statistics to provide a comprehensive performance profile.
 * 
 * Performance thresholds:
 * - P50 target: 1.5 seconds (median should be under this value)
 * - P95 target: 2.5 seconds (95% of starts should be under this value)
 * - Maximum: 3.0 seconds (absolute maximum acceptable time)
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve as pathResolve } from 'path';
import fs from 'fs/promises';

// Constants
const ITERATIONS = 3; // Number of times to start the server for statistics
const SERVER_MAX_TIMEOUT = 3000; // 3 seconds max startup time
const TARGET_P50 = 1500; // 1.5 seconds target for median (P50)
const TARGET_P95 = 2500; // 2.5 seconds target for P95
const SERVER_READY_MESSAGE = 'Ready on http://localhost';

// System setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = pathResolve(__dirname, '..', '..');
const serverScript = pathResolve(projectRoot, 'scripts', 'start-server.js');
const PID_FILE_PATH = pathResolve(projectRoot, '.server-perf-stats-pid');

/**
 * Calculate percentile value from a sorted array
 * @param values - Sorted array of values
 * @param percentile - Percentile to calculate (0-100)
 * @returns The value at the specified percentile
 */
function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  if (values.length === 1) return values[0];
  
  const index = Math.ceil((percentile / 100) * values.length) - 1;
  return values[Math.max(0, Math.min(values.length - 1, index))];
}

/**
 * Format milliseconds as a human-readable string with color
 * @param ms - Time in milliseconds
 * @param threshold - Threshold for warning/error colors
 * @returns Formatted string with color
 */
function formatTime(ms: number, threshold: number): string {
  if (ms <= threshold) {
    return `\x1b[32m${ms}ms\x1b[0m`; // Green
  } else if (ms <= SERVER_MAX_TIMEOUT) {
    return `\x1b[33m${ms}ms\x1b[0m`; // Yellow
  } else {
    return `\x1b[31m${ms}ms\x1b[0m`; // Red
  }
}

describe('Server Performance Statistics', function() {
  // Set a timeout based on the total expected runtime for all iterations
  jasmine.DEFAULT_TIMEOUT_INTERVAL = (SERVER_MAX_TIMEOUT * ITERATIONS) + 5000;
  
  let serverProcesses: any[] = [];
  const startupTimes: number[] = [];
  
  beforeAll(async () => {
    // Make sure there's no leftover PID file
    try {
      await fs.unlink(PID_FILE_PATH).catch(() => {});
    } catch (err) {
      // Ignore errors if the file doesn't exist
    }
  });
  
  afterAll(async () => {
    // Clean up any remaining server processes
    for (const proc of serverProcesses) {
      try {
        if (proc && !proc.killed) {
          proc.kill();
        }
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
  
  it('should collect server startup performance statistics', async function() {
    // Skip if not in an environment where we can spawn processes
    if (typeof spawn !== 'function') {
      pending('spawn is not available in this environment');
      return;
    }
    
    console.log(`\nRunning ${ITERATIONS} server startup iterations to collect performance statistics...`);
    
    // Run server startup multiple times to collect statistics
    for (let i = 0; i < ITERATIONS; i++) {
      const startupTime = await measureServerStartup(i + 1);
      startupTimes.push(startupTime);
      
      // Give a short pause between iterations
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Sort times for percentile calculations
    const sortedTimes = [...startupTimes].sort((a, b) => a - b);
    
    // Calculate statistics
    const stats = {
      min: sortedTimes[0],
      max: sortedTimes[sortedTimes.length - 1],
      avg: sortedTimes.reduce((sum, time) => sum + time, 0) / sortedTimes.length,
      p50: calculatePercentile(sortedTimes, 50), // median
      p90: calculatePercentile(sortedTimes, 90),
      p95: calculatePercentile(sortedTimes, 95),
      p99: calculatePercentile(sortedTimes, 99),
    };
    
    // Display results with color coding
    console.log('\n📊 SERVER STARTUP PERFORMANCE STATISTICS:');
    console.log('───────────────────────────────────────────');
    console.log(`Iterations:   ${ITERATIONS}`);
    console.log(`Min time:     ${formatTime(stats.min, TARGET_P50)}`);
    console.log(`Max time:     ${formatTime(stats.max, TARGET_P95)}`);
    console.log(`Avg time:     ${formatTime(Math.round(stats.avg), TARGET_P50)}`);
    console.log(`Median (P50): ${formatTime(stats.p50, TARGET_P50)} (target: ${TARGET_P50}ms)`);
    console.log(`P90:          ${formatTime(stats.p90, TARGET_P95)}`);
    console.log(`P95:          ${formatTime(stats.p95, TARGET_P95)} (target: ${TARGET_P95}ms)`);
    console.log(`P99:          ${formatTime(stats.p99, SERVER_MAX_TIMEOUT)}`);
    console.log('───────────────────────────────────────────');
    console.log('Raw startup times:');
    startupTimes.forEach((time, idx) => {
      console.log(`  Run ${idx + 1}: ${formatTime(time, TARGET_P50)}`);
    });
    console.log('───────────────────────────────────────────');
    
    // Performance assessment
    let performanceIssues = 0;
    
    if (stats.p50 > TARGET_P50) {
      performanceIssues++;
      console.log(`⚠️ MEDIAN STARTUP TIME (${stats.p50}ms) exceeds target of ${TARGET_P50}ms`);
      console.log('   This indicates typical performance is slower than desired');
    }
    
    if (stats.p95 > TARGET_P95) {
      performanceIssues++;
      console.log(`⚠️ P95 STARTUP TIME (${stats.p95}ms) exceeds target of ${TARGET_P95}ms`);
      console.log('   This indicates inconsistent performance with occasional slowness');
    }
    
    if (stats.max > SERVER_MAX_TIMEOUT) {
      performanceIssues++;
      console.log(`❌ MAXIMUM STARTUP TIME (${stats.max}ms) exceeds hard limit of ${SERVER_MAX_TIMEOUT}ms`);
      console.log('   This indicates serious performance issues with server initialization');
    }
    
    if (performanceIssues === 0) {
      console.log('✅ All performance targets met! Server startup is performing well.');
    } else {
      console.log(`\nPerformance Optimization Recommendations:`);
      console.log('1. Use lazy initialization for non-critical components');
      console.log('2. Consider reducing the number of Mistral clients created at startup');
      console.log('3. Optimize validation logic to be more efficient');
      console.log('4. Review startup sequence for potential parallelization');
    }
    
    // Test assertions - only fail the test if we exceed the hard maximum
    expect(stats.max).toBeLessThanOrEqual(SERVER_MAX_TIMEOUT);
  });
  
  /**
   * Measure the time it takes to start the server
   * @param iteration - Current iteration number
   * @returns Time in milliseconds
   */
  async function measureServerStartup(iteration: number): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      const startTime = Date.now();
      
      // Start the server
      process.stdout.write(`Running iteration ${iteration}/${ITERATIONS}: Starting server... `);
      const serverProcess = spawn('node', [serverScript], {
        env: { 
          ...process.env,
          // Add a unique identifier to prevent port conflicts
          PORT: `${9000 + iteration}`,
          // Keep the same NODE_ENV that was set by the test runner
          // Don't add NODE_ENV here - it might conflict with the parent process
          // Skip lengthy health checks for faster startup measurement
          SKIP_HEALTH_CHECK: 'true'
        },
        stdio: ['ignore', 'pipe', 'pipe']
      });
      
      // Save process for cleanup
      serverProcesses.push(serverProcess);
      
      // Save the PID for debugging if available
      if (serverProcess.pid) {
        fs.writeFile(PID_FILE_PATH, serverProcess.pid.toString())
          .catch(err => console.error('Error saving PID:', err));
      }
      
      // Set up a timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        const elapsedTime = Date.now() - startTime;
        serverProcess.kill();
        process.stdout.write(`TIMEOUT (${elapsedTime}ms)\n`);
        resolve(SERVER_MAX_TIMEOUT + 1); // Return a value exceeding the max timeout
      }, SERVER_MAX_TIMEOUT + 1000);
      
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
          process.stdout.write(`READY (${elapsedTime}ms)\n`);
          
          // Clean up
          clearTimeout(timeoutId);
          serverProcess.kill();
          resolve(elapsedTime);
        }
      });
      
      // Collect error output
      serverProcess.stderr.on('data', (data: Buffer) => {
        errorOutput += data.toString();
      });
      
      // Handle server exit
      serverProcess.on('exit', (code: number) => {
        // If the server exited without being ready, we have a problem
        if (!serverReady) {
          const elapsedTime = Date.now() - startTime;
          clearTimeout(timeoutId);
          process.stdout.write(`FAILED (${elapsedTime}ms)\n`);
          if (errorOutput) {
            console.error(`Server error output: ${errorOutput}`);
          }
          resolve(SERVER_MAX_TIMEOUT + 1); // Return a value exceeding the max timeout
        }
      });
      
      // Handle process errors
      serverProcess.on('error', (err: Error) => {
        const elapsedTime = Date.now() - startTime;
        clearTimeout(timeoutId);
        process.stdout.write(`ERROR (${elapsedTime}ms): ${err.message}\n`);
        resolve(SERVER_MAX_TIMEOUT + 1); // Return a value exceeding the max timeout
      });
    });
  }
});