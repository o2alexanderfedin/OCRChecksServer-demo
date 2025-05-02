# Integration Tests

This directory contains integration tests for the OCR Checks Server.

## Running Tests

Integration tests require a running server instance. You can run the tests in two ways:

### Option 1: Manual Server Start

1. Start the server in one terminal:
   ```
   npm run dev
   ```

2. Run the integration tests in another terminal:
   ```
   npm run test:integration
   ```

### Option 2: Automatic Server Start

Run all tests (unit and integration) with automatic server management:
```
npm test
```

This script will:
1. Run unit tests
2. Start the server with process tracking (using PID file)
3. Run integration tests
4. Automatically shut down the server when tests complete

> **Note:** As of version 1.12.1, the server process management has been significantly improved. The test runner now tracks server processes via PID files and ensures proper cleanup, even if tests are interrupted. This prevents "zombie" server processes that previously required manual termination.

## Test Images

Integration tests use check images from the `tests/fixtures/images` directory. The images should meet these requirements:

1. Located in the project's `tests/fixtures/images` directory
2. JPEG format (`.jpg` or `.jpeg` extension)
3. Filenames starting with `telegram` (for automatic selection)

## Configuration

You can customize the API endpoint by setting the `OCR_API_URL` environment variable:

```
OCR_API_URL=https://your-api-url.com npm run test:integration
```

## Test Timeout Configuration

Integration tests have a longer timeout (2 minutes) to handle external API calls and network latency. If you're experiencing timeouts, you can increase this value in the individual test files.

## Handling API Rate Limits

The tests are designed to automatically skip if they encounter API rate limits or other temporary API issues. They'll be marked as "pending" rather than failing.

## Troubleshooting

If integration tests are failing:

1. Check that the server is running and accessible
2. Verify that MISTRAL_API_KEY is set correctly
3. Try running with `NODE_DEBUG=request,http npm run test:integration` for more verbose logging
4. Check for API rate limits in the test output

## Test Results

Test results are saved to `integration-test-results.json` in the project root directory for review and debugging.