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
npm run test:all
```

This script will:
1. Run unit tests
2. Start the server
3. Run integration tests
4. Stop the server

## Test Images

Integration tests use check images from the `Checks` directory. The images should meet these requirements:

1. Located in the project's `Checks` directory
2. JPEG format (`.jpg` or `.jpeg` extension)
3. Filenames starting with `telegram` (for automatic selection)

## Configuration

You can customize the API endpoint by setting the `OCR_API_URL` environment variable:

```
OCR_API_URL=https://your-api-url.com npm run test:integration
```

## Test Results

Test results are saved to `integration-test-results.json` in the project root directory for review and debugging.