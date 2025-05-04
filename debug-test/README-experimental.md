# Experimental Mistral Direct API Testing Endpoint

This documentation describes the enhanced experimental endpoint for directly testing the Mistral OCR API, bypassing the SDK for debugging purposes.

## Overview

The `/experimental/mistral-direct` endpoint allows you to:

1. Directly test the Mistral OCR API with detailed debugging information
2. Compare snake_case vs camelCase field formats to identify compatibility issues
3. Validate requests without actually making API calls (test mode)
4. Get detailed performance metrics and image validation data
5. Control timeouts and error handling behavior

This endpoint is intended for debugging and testing purposes only.

## Client Tool Usage

A comprehensive client tool is provided at `debug-test/experimental-client-v2.js` for testing the endpoint.

```bash
# Basic usage
API_URL=https://ocr-checks-worker-dev.af-4a0.workers.dev node debug-test/experimental-client-v2.js

# With options
API_URL=https://ocr-checks-worker-dev.af-4a0.workers.dev node debug-test/experimental-client-v2.js --camelCase --compare --verbose --save
```

### Client Options

| Option | Description |
|--------|-------------|
| `--camelCase` | Use camelCase field names (default is snake_case) |
| `--test` | Test mode - validate request but don't send to API |
| `--diagnostic` | Enable extra detailed diagnostics |
| `--compare` | Run comparison test of snake_case vs camelCase formats |
| `--model NAME` | Specify model name (default: mistral-ocr-latest) |
| `--timeout MS` | Set request timeout in milliseconds (default: 30000) |
| `--image PATH` | Path to image file (default: tiny-test.jpg) |
| `--raw-base64` | Send raw base64 without data URL wrapper |
| `--save` | Save full response to debug-test/response-*.json |
| `--verbose` | Show more detailed output |
| `--quiet` | Show minimal output |
| `--request-id ID` | Add custom request ID for tracing |
| `--help` | Show help message |

## API Request Format

The experimental endpoint accepts POST requests with the following JSON payload structure:

```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA...",
  
  "debug": true,
  "diagnosticMode": false,
  "testMode": false,
  "comparison": false,
  
  "format": "snake_case",
  "model": "mistral-ocr-latest",
  "timeout": 30000,
  
  "requestId": "optional-request-id"
}
```

### Request Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `image` | string | **Required**. Base64 encoded image, either as raw base64 or data URL format |
| `debug` | boolean | Enable debug info in response (default: false) |
| `diagnosticMode` | boolean | Enable extra detailed diagnostics (default: false) |
| `testMode` | boolean | Validate request without making API call (default: false) |
| `comparison` | boolean | Test both snake_case and camelCase formats (default: false) |
| `format` | string | Field format to use: 'snake_case' or 'camelCase' (default: 'snake_case') |
| `model` | string | Mistral OCR model to use (default: 'mistral-ocr-latest') |
| `timeout` | number | Request timeout in milliseconds (default: 30000) |
| `requestId` | string | Optional request ID for tracing |

## API Response Format

The response format varies based on the request mode:

### Standard Mode Response

```json
{
  "success": true,
  "statusCode": 200,
  "statusText": "OK",
  "duration": 1234,
  "totalDuration": 1245,
  "format": "snake_case",
  "responseHeaders": { ... },
  "data": {
    "model": "mistral-ocr-latest",
    "pages": [ ... ],
    "usage_info": { ... }
  },
  "warnings": [ ... ],
  "debug": { ... }
}
```

### Comparison Mode Response

```json
{
  "success": true,
  "comparisonMode": true,
  "message": "Comparison of snake_case vs camelCase formats",
  "duration": 2345,
  "totalDuration": 2355,
  "results": {
    "snakeCase": {
      "success": true,
      "statusCode": 200,
      "statusText": "OK",
      "headers": { ... },
      "data": { ... }
    },
    "camelCase": {
      "success": false,
      "statusCode": 400,
      "statusText": "Bad Request",
      "headers": { ... },
      "data": { ... }
    },
    "analysis": {
      "snakeCaseWorked": true,
      "camelCaseWorked": false,
      "recommendation": "Use snake_case format only"
    }
  },
  "debug": { ... }
}
```

### Test Mode Response

```json
{
  "success": true,
  "testMode": true,
  "message": "Test mode: API request not sent",
  "endpoint": "https://api.mistral.ai/v1/ocr",
  "requestTime": "2023-06-25T15:45:30.123Z",
  "duration": 123,
  "documentPayload": { ... },
  "validationResults": {
    "apiKey": { ... },
    "image": { ... },
    "payload": { ... }
  },
  "debug": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Network error",
  "message": "Failed to fetch: timeout",
  "timestamp": "2023-06-25T15:45:30.123Z",
  "debug": { ... }
}
```

## Debug Information Structure

When `debug: true` is set, the response includes a detailed `debug` object with the following structure:

```json
{
  "requestInfo": {
    "timestamps": { "start": "...", "apiRequestStart": "...", "apiRequestEnd": "...", "end": "..." },
    "metrics": { "timeout": 30000, "fetchDuration": "123.45", "duration": 1234, "totalDuration": 1245 },
    "headers": { "contentType": "application/json" },
    "body": { "received": true, "keys": ["image", "debug"], "size": 12345 }
  },
  "apiKeyInfo": {
    "available": true,
    "length": 40,
    "prefix": "msk_...",
    "validFormat": true,
    "hasRecognizedPrefix": true
  },
  "environment": {
    "runtime": {
      "isCloudflareWorker": true,
      "isNodeJS": false,
      "isBrowser": false,
      "hasBuffer": false,
      "hasPerformanceNow": true
    }
  },
  "imageInfo": {
    "metadata": { "originalLength": 12345 },
    "format": {
      "isDataUrl": true,
      "hasMimeType": true,
      "hasBase64Marker": true,
      "type": "data URL",
      "mimeType": "image/jpeg",
      "dataPrefix": "data:image/jpeg;base64,",
      "actualBase64Length": 12300
    },
    "validation": {
      "hasValidChars": true,
      "correctPadding": true,
      "isReasonableLength": true,
      "isValidBase64": true
    },
    "conversions": []
  },
  "requestPayload": {
    "format": { "selected": "snake_case", "comparison": false },
    "fields": {
      "model": "mistral-ocr-latest",
      "documentType": "image_url",
      "imageFieldName": "image_url",
      "includeImageFieldName": "include_image_base64"
    },
    "validation": {
      "snakeCase": {
        "hasModel": true,
        "modelValue": "mistral-ocr-latest",
        "documentFormatValid": true,
        "fieldNamesValid": true
      },
      "camelCase": {
        "hasModel": true,
        "modelValue": "mistral-ocr-latest",
        "documentFormatValid": true,
        "fieldNamesValid": true
      }
    },
    "endpoint": "https://api.mistral.ai/v1/ocr",
    "method": "POST",
    "sdkVersion": "direct API call (no SDK)"
  },
  "requestResult": {
    "metrics": { "fetchDuration": "123.45", "duration": 1234, "durationHR": "1234.56" },
    "network": { "timedOut": false }
  },
  "responseInfo": {
    "metadata": {
      "statusCode": 200,
      "statusText": "OK",
      "headers": { "content-type": "application/json" },
      "ok": true,
      "contentType": "application/json",
      "contentLength": 12345
    },
    "content": {
      "format": "json",
      "parseTime": "12.34",
      "size": 12345,
      "keys": ["model", "pages", "usage_info"],
      "hasPagesArray": true,
      "pageCount": 1,
      "model": "mistral-ocr-latest",
      "usageInfo": { "input_tokens": 1000 }
    }
  },
  "errors": [],
  "warnings": []
}
```

## Common Use Cases

### Testing Field Name Format Compatibility

```bash
# Test both formats side-by-side
node debug-test/experimental-client-v2.js --compare

# Test camelCase format only
node debug-test/experimental-client-v2.js --camelCase
```

### Validating Images Without API Calls

```bash
# Validate the request without sending to API
node debug-test/experimental-client-v2.js --test
```

### Diagnosing API Timeout Issues

```bash
# Set a longer timeout for slow connections
node debug-test/experimental-client-v2.js --timeout 60000

# Get detailed timing information
node debug-test/experimental-client-v2.js --diagnostic --verbose
```

### Testing Different Image Formats

```bash
# Send raw base64 instead of data URL format
node debug-test/experimental-client-v2.js --raw-base64

# Test with a specific image file
node debug-test/experimental-client-v2.js --image path/to/image.jpg
```

## Troubleshooting

### API Key Issues

- Check the `apiKeyInfo` section in the debug output
- Ensure the API key is correctly set in your environment variables
- For Cloudflare Workers, check wrangler.toml or use `wrangler secret put MISTRAL_API_KEY`

### Image Format Issues

- Check the `imageInfo.validation` section in the debug output
- Ensure the image is properly base64 encoded
- Verify the correct MIME type is used

### Network Issues

- Check `requestResult.network` for timeout information
- Use the `--timeout` option to increase the timeout for slow connections
- Verify your network can reach the Mistral API (api.mistral.ai)

### Field Format Issues

- Use the `--compare` option to test both snake_case and camelCase formats
- Check the recommendation in the comparison results
- The Mistral API expects snake_case field names (image_url, not imageUrl)