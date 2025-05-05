# Configuration Files

This directory contains configuration files for various components of the OCR Checks Server.

## Mistral Client Configuration

The `mistral-client-config.json` file contains configuration for the Mistral AI client, including:

### Retry Configuration

The client can automatically retry failed requests based on the retry configuration:

- **strategy**: The retry strategy to use (e.g., "backoff")
- **backoff**: Configuration for exponential backoff strategy
  - **initialInterval**: The initial delay in milliseconds between retries (default: 1000ms)
  - **maxInterval**: The maximum delay in milliseconds between retries (default: 10000ms)
  - **exponent**: The exponential growth factor for the delay (default: 1.5)
  - **maxElapsedTime**: The maximum total time in milliseconds before giving up (default: 60000ms)
- **retryConnectionErrors**: Whether to retry on network connection errors (default: true)

### Timeout Configuration

- **timeoutMs**: The maximum time in milliseconds to wait for a request to complete (default: 30000ms)

## Usage

These configuration files are imported and used in the dependency injection system to configure services. You can modify these configuration files to adjust the behavior of the system without changing code.

```typescript
import mistralClientConfig from '../config/mistral-client-config.json';

// Use the configuration
const client = new Mistral({
  apiKey,
  retryConfig: mistralClientConfig.retryConfig,
  timeoutMs: mistralClientConfig.timeoutMs
});
```