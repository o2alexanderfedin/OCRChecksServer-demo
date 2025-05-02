# Test Server Management

> Copyright © 2025 [O2.services](https://o2.services). All rights reserved.  
> Contact: [sales@o2.services](mailto:sales@o2.services)

## Overview

This document describes the improved test server management implemented in version 1.12.1, which ensures proper cleanup of server processes after running integration tests.

## Problem Statement

Prior to version 1.12.1, the integration test infrastructure had several issues:

1. Server processes started for integration tests could remain running after tests completed
2. These "zombie" processes would consume resources and potentially cause port conflicts
3. Subsequent test runs might fail due to port conflicts
4. There was no reliable way to track and terminate these processes
5. Server processes weren't properly terminated on test failures or interruptions

## Solution Approach

Version 1.12.1 implements a comprehensive solution for server process management:

### 1. Server Process Tracking

- Server PID is saved to a `.server-pid` file for tracking
- This allows test scripts to locate the process even across different sessions
- Includes automatic cleanup of previous server instances before starting a new one

```javascript
// Save the server's PID for easier management
await saveServerPid(serverProcess.pid);

// Function to save the server PID
async function saveServerPid(pid) {
  try {
    await fs.writeFile(PID_FILE_PATH, pid.toString());
    console.log(`Server PID ${pid} saved to ${PID_FILE_PATH}`);
  } catch (err) {
    console.error('Error saving server PID to file:', err);
  }
}
```

### 2. Process Cleanup and Termination

The test runner implements a robust cleanup strategy:

- Checks for existing server processes before starting new ones
- Terminates any found processes and waits for them to shut down
- Implements a multi-layered approach to ensure all processes are terminated

```javascript
// Create a robust shutdown function to clean up all server processes
async function shutdownServer() {
  console.log('Ensuring server shutdown...');
  
  // 1. Try to kill the direct child process
  if (serverProcess && !serverProcess.killed) {
    console.log(`Terminating server process with PID: ${serverProcess.pid}`);
    try {
      serverProcess.kill('SIGTERM');
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (e) {
      console.log(`Error shutting down server process: ${e.message}`);
    }
  }
  
  // 2. Try to kill the actual server process which might be different from the child process
  if (serverPid) {
    console.log(`Terminating detected server PID: ${serverPid}`);
    try {
      process.kill(serverPid, 'SIGTERM');
    } catch (e) {
      if (e.code === 'ESRCH') {
        console.log(`Server process ${serverPid} already terminated.`);
      } else {
        console.log(`Error terminating server process ${serverPid}: ${e.message}`);
      }
    }
  }
  
  // 3. Check the PID file and kill that process if it exists
  try {
    const pidFilePath = join(projectRoot, '.server-pid');
    const pidContent = await fs.readFile(pidFilePath, 'utf8').catch(() => null);
    
    if (pidContent) {
      const filePid = parseInt(pidContent.trim(), 10);
      if (filePid && !isNaN(filePid)) {
        console.log(`Terminating server from PID file: ${filePid}`);
        try {
          process.kill(filePid, 'SIGTERM');
        } catch (e) {
          // Handle potential errors
        }
      }
      
      // Remove the PID file to prevent future confusion
      await fs.unlink(pidFilePath).catch(err => {
        console.log(`Error removing PID file: ${err.message}`);
      });
    }
  } catch (error) {
    console.log(`Error during server process cleanup: ${error.message}`);
  }
}
```

### 3. Signal Handlers for Graceful Termination

Signal handlers ensure proper cleanup even when the test process is interrupted:

```javascript
// Handle termination signals to ensure clean shutdown
async function cleanupAndExit(signal) {
  console.log(`\nReceived ${signal} signal, shutting down gracefully...`);
  
  // Try to clean up server processes
  if (serverProcess && serverProcess.pid) {
    console.log(`Terminating server process with PID: ${serverProcess.pid}`);
    try {
      serverProcess.kill('SIGTERM');
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (e) {
      console.log(`Error shutting down server: ${e.message}`);
    }
  }
  
  // ... additional cleanup logic ...
  
  process.exit(signal === 'SIGINT' ? 130 : 143);
}

// Register signal handlers
process.on('SIGINT', () => cleanupAndExit('SIGINT'));  // Ctrl+C
process.on('SIGTERM', () => cleanupAndExit('SIGTERM')); // Kill command
```

### 4. Server Process Design Changes

The test server script was modified to:
- Not detach the process (using `detached: false`)
- Not exit prematurely, allowing the parent process to manage its lifecycle
- Check for and terminate any existing server processes before starting

## Benefits

These improvements provide several key benefits:

1. **Reliability**: No more "zombie" server processes after tests
2. **Resource Efficiency**: Server processes are properly terminated, freeing system resources
3. **Consistent Test Environment**: Each test run starts with a clean environment
4. **Improved Debugging**: Better logging and error reporting for server-related issues
5. **Graceful Handling**: Proper cleanup even when tests are interrupted

## Integration with Testing Workflow

The improved server management is integrated with the testing workflow:

1. When integration tests are run, the server is started with process tracking
2. After tests complete (success or failure), the server is properly terminated
3. If the test process is interrupted, signal handlers ensure proper cleanup
4. Subsequent test runs check for and clean up any existing server processes

## Related Files

- `scripts/start-server.js`: Server startup with PID tracking
- `scripts/run-tests.js`: Test runner with server management
- `.server-pid`: File storing the current server PID (in project root)

## Future Improvements

Potential future enhancements to the server management system:

1. Implement server health monitoring during tests
2. Add support for running multiple server instances with different configurations
3. Enhance error reporting with more detailed diagnostics
4. Implement automatic retry logic for server startup failures