# Mistral API Rate Limiting Implementation

This document explains the implementation of rate limiting for Mistral API calls in the OCR Checks Server to handle the limit of 6 requests per second.

## Overview

The Mistral AI API enforces a rate limit of 6 requests per second. Since each non-health endpoint in our application makes 2 Mistral API calls, this effectively limits us to about 3 client requests per second. To ensure our integration tests don't exceed this limit and fail with rate limit errors, we've implemented a comprehensive rate limiting strategy.

## Implementation Components

### 1. Queue-Based Rate Limiting

We use a queue-based approach to rate limiting in `/tests/helpers/retry.ts`:

- All API requests that need rate limiting are added to a queue
- A single processor handles executing the queued requests
- Requests are executed with a delay to respect the rate limit
- The queue is processed asynchronously, allowing tests to continue running

### 2. Throttled Fetch Utility

We created a `throttledFetch` utility in `/tests/helpers/throttled-fetch.ts` as a drop-in replacement for the global `fetch`:

- Automatically detects Mistral API calls
- Uses the rate limiting queue for all API requests
- Maintains proper promise chaining for async/await compatibility
- Provides configuration options for debugging and rate limit customization

### 3. Test Framework Integration

The `run-tests.js` script has been enhanced to:

- Add configurable delays between test files
- Add pauses between test suites
- Prevent overwhelming the API with concurrent requests
- Provide different delay configurations for different test types

## Configuration Options

Rate limiting can be configured through:

1. **Global Configuration**:
   ```typescript
   // From any test file
   import { configureRateLimiting } from '../helpers/throttled-fetch.js';
   
   configureRateLimiting({
     enabled: true,
     requestInterval: 167, // milliseconds (≈ 6 requests per second)
     debug: false
   });
   ```

2. **Environment Variables**:
   - `DEBUG_THROTTLE=true`: Enable verbose logging of rate limiting activity
   - `DISABLE_RATE_LIMIT=true`: Disable rate limiting entirely (not recommended)

## Testing Considerations

### Integration Tests

Integration tests make actual API calls and need to respect rate limits:

- Always use `throttledFetch` instead of global `fetch`
- Run tests sequentially rather than in parallel
- Be aware that tests will run more slowly due to rate limiting

### Load Testing

For load testing, rate limiting should be managed differently:

- Load tests should be run separately from integration tests
- Consider creating a separate load testing configuration
- Use monitoring to track rate limit headers from the API

## Troubleshooting

If you encounter rate limit errors:

1. Check if rate limiting is enabled: `throttledFetch` should report configuration at startup
2. Enable debug mode to see the queue processing: `DEBUG_THROTTLE=true npm test`
3. Increase the request interval for more conservative rate limiting
4. Check for requests that might be bypassing the throttled fetch implementation

## Future Improvements

Potential enhancements to the rate limiting implementation:

1. **Adaptive rate limiting**: Dynamically adjust based on rate limit headers
2. **Priority queuing**: Allow certain requests to have higher priority
3. **Request batching**: Combine multiple requests into batches where applicable
4. **Circuit breaking**: Automatically disable features when rate limits are consistently exceeded