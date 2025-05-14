/**
 * Utility for properly cleaning up server processes
 * Helps prevent orphaned processes that can cause test timeouts
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');
const serverPidPath = path.join(projectRoot, '.server-pid');

/**
 * Terminates all server processes and cleans up the PID file
 * 
 * @param signal The signal to send to the process (defaults to SIGTERM)
 * @returns True if a server was terminated, false otherwise
 */
export async function cleanupServerProcesses(signal: NodeJS.Signals = 'SIGTERM'): Promise<boolean> {
  console.log('Cleaning up server processes...');
  let terminated = false;
  
  try {
    // Check if PID file exists
    const pidContent = await fs.readFile(serverPidPath, 'utf8').catch(() => null);
    
    if (pidContent) {
      const pid = parseInt(pidContent.trim(), 10);
      
      if (pid && !isNaN(pid)) {
        console.log(`Terminating server process with PID: ${pid}`);
        
        try {
          process.kill(pid, signal);
          terminated = true;
          console.log(`Sent ${signal} signal to process ${pid}`);
          
          // Give process time to terminate gracefully
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (killError: any) {
          if (killError.code === 'ESRCH') {
            console.log(`Process ${pid} no longer exists`);
          } else {
            console.error(`Error terminating process ${pid}:`, killError);
          }
        }
      }
      
      // Delete the PID file regardless of whether process termination succeeded
      await fs.unlink(serverPidPath).catch(error => {
        console.error(`Failed to delete server PID file:`, error);
      });
    } else {
      console.log('No server PID file found');
    }
    
    return terminated;
  } catch (error) {
    console.error('Error during server cleanup:', error);
    return false;
  }
}

/**
 * Register cleanup handlers to ensure server processes are terminated
 * when the Node.js process exits
 */
export function registerCleanupHandlers(): void {
  // Handle process exit
  process.on('exit', () => {
    try {
      // Synchronous cleanup on exit
      const pidContent = fs.readFileSync(serverPidPath, 'utf8');
      const pid = parseInt(pidContent.trim(), 10);
      
      if (pid && !isNaN(pid)) {
        try {
          process.kill(pid, 'SIGTERM');
          console.log(`Terminated server process ${pid} during exit`);
        } catch (e) {
          // Ignore errors during exit
        }
      }
      
      // Try to delete PID file synchronously
      fs.unlinkSync(serverPidPath);
    } catch (e) {
      // Ignore errors during exit
    }
  });
  
  // Register handlers for clean shutdown
  process.on('SIGINT', async () => {
    console.log('Received SIGINT signal, cleaning up servers...');
    await cleanupServerProcesses();
    process.exit(130); // Standard exit code for SIGINT
  });
  
  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM signal, cleaning up servers...');
    await cleanupServerProcesses();
    process.exit(143); // Standard exit code for SIGTERM
  });
}

/**
 * Call this as part of test setup to ensure proper cleanup
 */
export async function setupServerCleanup(): Promise<void> {
  // First clean up any existing servers
  await cleanupServerProcesses();
  
  // Then register handlers for future cleanup
  registerCleanupHandlers();
}