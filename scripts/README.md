# Scripts

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
- Starts the development server in the background
- Waits for the server to be ready
- Outputs the process ID for manual termination if needed
- Exits after successful startup