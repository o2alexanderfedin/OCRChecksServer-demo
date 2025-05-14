# Curl-Based Integration Testing Guide

This guide explains how to use the curl-based integration tests for testing the OCR Checks Server API directly using the HTTP protocol.

## Overview

The curl-based integration tests provide a lightweight alternative to the standard integration tests, allowing you to:

1. Test the API endpoints directly using HTTP requests
2. Run quick health and functionality checks
3. Test with minimal dependencies
4. Identify API-level issues without the overhead of the full test suite

## Prerequisites

- A running OCR Checks Server (local or remote)
- Bash shell environment
- curl installed
- Basic knowledge of HTTP protocols

## Running the Tests

### Testing Local Development Server

To test your local development server:

1. Start the server in one terminal:
   ```bash
   npm run start-server
   ```

2. Run the curl tests in another terminal:
   ```bash
   npm run test:integration:curl
   ```

### Verbosity Options

You can control the verbosity of the test output:

- **Normal mode** (default): Shows test names, endpoints, and pass/fail results
  ```bash
  npm run test:integration:curl
  ```

- **Verbose mode**: Shows everything plus full request/response details
  ```bash
  npm run test:integration:curl:verbose
  ```

- **Quiet mode**: Shows only errors and the final summary
  ```bash
  TEST_MODE=quiet npm run test:integration:curl
  ```

### Testing Against Different Environments

You can test against any deployment by setting the API_URL environment variable:

```bash
# Test against production
API_URL=https://ocr-checks-worker.af-4a0.workers.dev npm run test:integration:curl

# Test against staging
API_URL=https://ocr-checks-worker-staging.af-4a0.workers.dev npm run test:integration:curl
```

## Test Cases

The curl tests cover the following endpoints and scenarios:

1. **Health Check API**: Verifies the server is responsive and correctly configured
2. **Check Processing**: Tests the /check endpoint with image upload
3. **Receipt Processing**: Tests the /receipt endpoint with image upload
4. **Process Universal Endpoint**: Tests the /process endpoint with different document types
5. **Error Handling**: Verifies proper error responses for invalid requests
   - Invalid content type
   - Invalid document type
   - Unsupported HTTP method

## Rate Limiting and Timeouts

### Rate Limiting

The test script includes built-in rate limiting to avoid hitting Mistral API rate limits. By default, it adds a 200ms delay between requests to stay under the 6 requests/second limit.

You can adjust this delay if needed:

```bash
RATE_LIMIT_DELAY=300 npm run test:integration:curl
```

### Request Timeouts

For endpoints that involve AI processing (like image OCR), the tests use an extended timeout value to allow for longer processing times. The default timeout for requests is 30 seconds, but AI-powered endpoints use 60 seconds.

You can customize the global timeout by setting the `CURL_TIMEOUT` environment variable:

```bash
CURL_TIMEOUT=45 npm run test:integration:curl
```

Individual tests can also specify their own timeout values as the last parameter to the `run_test` function.

## Adding New Tests

To add new test cases to the curl test script, modify the `scripts/run-curl-tests.sh` file and add new `run_test` function calls with appropriate parameters:

```bash
run_test \
  "Your Test Name" \
  "/endpoint-path" \
  "HTTP_METHOD" \
  "content-type" \
  "data or path-to-file" \
  expected_status_code \
  "validation_command" \
  timeout_in_seconds
```

The timeout parameter is optional and defaults to 30 seconds. For endpoints that require longer processing times (like AI-powered OCR), you may need to increase this value to avoid premature timeouts.

## Troubleshooting

If tests are failing, check the following:

1. Is the server running and accessible at the expected URL?
2. Do you have a valid Mistral API key configured?
3. Are there any network issues preventing connections?
4. Has the API structure changed since the tests were written?

For more detailed diagnostics, run in verbose mode to see full requests and responses:

```bash
npm run test:integration:curl:verbose
```

## Integration with CI/CD

To incorporate these tests into your CI/CD pipeline, you can add a step that:

1. Deploys the service to a test environment
2. Runs the curl tests against that environment
3. Proceeds with the deployment if tests pass

Example GitHub Actions workflow step:

```yaml
- name: Run curl integration tests
  run: |
    API_URL=${{ env.STAGING_URL }} npm run test:integration:curl
```