# Scripts

> Copyright © 2025 [Nolock.social](https://nolock.social). All rights reserved.  
> Authored by: [O2.services](https://o2.services)  
> Contact: [sales@o2.services](mailto:sales@o2.services)

This directory contains utility scripts for running tests and starting the server.

## Test Runners

- `run-tests.js` - Universal test runner that can run all test types
- `run-unit-tests.js` - Runs only unit tests
- `run-functional-tests.js` - Runs only functional tests
- `run-semi-tests.js` - Runs only semi-integration tests

## Server Scripts

- `start-server.js` - Utility script to start the development server for integration tests

## Usage

These scripts are typically invoked through npm scripts defined in `package.json`:

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit
npm run test:functional
npm run test:semi
npm run test:integration

# Start server
npm run start-server
```

## Implementation Details

### Universal Test Runner (`run-tests.js`)

The universal test runner:
- Accepts a test type parameter: `unit`, `functional`, `semi`, `integration`, or `all`
- Manages starting/stopping the server for integration tests
- Configures timeouts appropriate for each test type
- Handles errors and aborts gracefully

### Single Type Runners

The type-specific runners:
- Focus on one test type only
- Have configurations optimized for their test type
- Use error handling tailored to their needs

### Server Script (`start-server.js`)

The server script:
- Starts the development server in a managed mode (improved in v1.12.1)
- Waits for the server to be ready before proceeding
- Creates a PID file (`/.server-pid`) to track the server process
- Checks for and cleans up any existing server processes
- Uses improved process management for reliable cleanup

#### Server Process Management (v1.12.2)

In version 1.12.2, the server management was significantly improved:

- **Process Tracking**: Server PID is saved to a `.server-pid` file in the project root
- **Automatic Cleanup**: Checks for existing server processes before starting new ones
- **No Process Detachment**: Uses `detached: false` to ensure proper process hierarchy
- **Improved Reliability**: Ensures server processes don't remain after tests complete

For detailed documentation on server process management, see [Test Server Management](../docs/test-server-management.md).