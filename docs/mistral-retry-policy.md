# Mistral Retry Policy Configuration

This document explains the rationale and configuration details for the Mistral API client retry policy implemented in the OCR Checks Server.

## Overview

The OCR Checks Server uses the Mistral AI API client with a configured retry policy to improve resilience against transient network issues, rate limiting, and temporary service unavailability. The retry configuration is specifically optimized for Cloudflare Workers environment constraints.

## Configuration Parameters

The current retry configuration uses the following parameters:

```typescript
const mistralClientConfig = {
  retryConfig: {
    strategy: "backoff",
    backoff: {
      initialInterval: 500,     // Milliseconds before first retry
      maxInterval: 10000,       // Maximum milliseconds between retries
      exponent: 1.8,            // Exponential factor for backoff increase
      maxElapsedTime: 25000     // Total milliseconds before giving up
    },
    retryConnectionErrors: true // Retry network connectivity errors
  },
  timeoutMs: 15000              // Timeout for individual requests
};
```

## Cloudflare Worker Considerations

The retry policy is specifically designed to work within Cloudflare Workers execution constraints:

1. **Execution Time Limit**: Cloudflare Workers have a 30-second maximum execution time. Our `maxElapsedTime` is set to 25 seconds to ensure we don't exceed this limit while leaving a buffer for other operations.

2. **CPU Time**: Workers have CPU time limitations (50ms on free tier). The retry policy uses exponential backoff to minimize the impact of retries on CPU usage.

3. **Memory Limits**: Workers have a 128MB memory limit. The retry policy is designed to be memory-efficient.

## Retry Behavior Analysis

With the current configuration:

- First retry: 500ms after initial failure
- Second retry: ~1,600ms after first retry (500ms × 1.8^2)
- Third retry: ~5,000ms after second retry (500ms × 1.8^3)
- Fourth retry: ~16,200ms after third retry (500ms × 1.8^4, but capped at 10,000ms)

Total time before giving up: Up to 25 seconds (maxElapsedTime)

## Error Categories and Retry Behavior

The retry policy handles different types of errors:

1. **Network Connectivity Errors**: Automatically retried when `retryConnectionErrors` is `true`
   - Connection refused
   - Connection reset
   - DNS resolution failures
   - Gateway timeout errors

2. **HTTP Status Code Errors**:
   - 429 (Too Many Requests): Always retried
   - 500-599 (Server Errors): Always retried
   - 408 (Request Timeout): Always retried
   - Others: Not retried by default

3. **Client Errors (4xx)**: Generally not retried except for 429 and 408

## Performance Impact

The retry policy's performance impact includes:

- Increased resilience to temporary service issues
- Potential latency increase for failing requests
- Minimal impact on successful requests
- Built-in circuit breaking with maxElapsedTime

## Monitoring and Optimization

The system logs retry attempts with the following information:

- Retry count
- Error type and message
- Time between retries
- Total elapsed time

This information can be used to further optimize the retry policy based on actual usage patterns.

## Future Considerations

Potential future improvements to the retry policy:

1. **Environment-specific configurations**: Different settings for development, staging, and production
2. **Dynamic adjustment**: Adapt retry parameters based on error rates and API health
3. **Circuit breaker pattern**: Automatically disable retries when the error rate is too high
4. **Jitter implementation**: Add randomness to retry intervals to prevent thundering herd problems