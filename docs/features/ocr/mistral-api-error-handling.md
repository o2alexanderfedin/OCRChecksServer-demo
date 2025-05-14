# Mistral API Error Handling

## Overview

This document describes how the OCR Checks Server handles errors from the Mistral AI API, particularly focusing on service unavailability issues. The Mistral AI API is used for both OCR text extraction and structured JSON data extraction.

## Error Types

Mistral API can return several types of errors:

1. **Service Unavailability (HTTP 500, Code 3000)**
   - Error message: "Service unavailable."
   - This is a temporary service outage on Mistral's end
   - Not related to API keys or our implementation

2. **Authentication Errors (HTTP 401)**
   - Error message: "No API key found in request" or "Invalid API key"
   - Related to missing or invalid API keys

3. **Rate Limiting Errors (HTTP 429)**
   - Error message: "Too many requests" or "Rate limit exceeded"
   - Occurs when making too many requests in a short period

4. **Validation Errors (HTTP 400)**
   - Error message varies based on the specific validation issue
   - Usually related to invalid input parameters

5. **Internal Server Errors (HTTP 500)**
   - Generic server errors not specifically coded as service unavailability
   - May be temporary or more serious infrastructure issues

## Diagnostic Implementation

The system implements detailed diagnostic logging to help troubleshoot API issues:

### 1. OCR Processing Diagnostics

In the `MistralOCRProvider` class (`src/ocr/mistral.ts`):

```typescript
// Enhanced logging for API client information
console.log('======== MISTRAL API DEBUG INFO ========');
console.log('Mistral Client Info:');
console.log('- Client type:', this.client.constructor.name);
console.log('- API Base URL:', this.client.apiBase || 'default (https://api.mistral.ai/v1)');
console.log('- API Key (first 4 chars):', (this.client.apiKey || 'unknown').substring(0, 4) + '...');
console.log('- API Key length:', (this.client.apiKey || '').length);
```

For errors:

```typescript
console.log('======== MISTRAL API ERROR ========');
console.log('- Error occurred at:', new Date().toISOString());
console.log('- Error type:', apiError?.constructor?.name || 'Unknown');
console.log('- Error message:', String(apiError));
```

### 2. JSON Extraction Diagnostics

In the `MistralJsonExtractorProvider` class (`src/json/mistral.ts`):

```typescript
console.log('======== MISTRAL JSON EXTRACTION DEBUG INFO ========');
console.log('Extracting JSON from markdown text...');
console.log('- Input text length:', request.markdown.length, 'chars');
console.log('- Schema provided:', request.schema ? 'Yes' : 'No');
```

For errors:

```typescript
console.log('======== MISTRAL JSON EXTRACTION ERROR ========');
console.log('- Error occurred at:', new Date().toISOString());
console.log('- Error type:', apiError?.constructor?.name || 'Unknown');
console.log('- Error message:', String(apiError));
```

### 3. Standalone Testing Script

A dedicated testing script (`scripts/test-mistral.js`) allows direct API testing outside the main application:

```javascript
// Test Mistral OCR API with detailed logging
async function testMistralOcr(apiKey) {
  console.log('======== MISTRAL OCR TEST ========');
  console.log('Node.js version:', process.version);
  console.log('Testing at:', new Date().toISOString());
  console.log('API key length:', apiKey.length);
  
  // ... API testing code ...
}
```

## Handling Service Unavailability

### Current Implementation

When a service unavailability error occurs (HTTP 500, Code 3000):

1. The error is caught in the `processDocument` method of `MistralOCRProvider` or the `extract` method of `MistralJsonExtractorProvider`
2. Detailed diagnostic information is logged to help identify the issue
3. An appropriate error response is returned to the client with a clear message

### Error Response Format

For API endpoints using the error handlers, the response will follow this format:

```json
{
  "success": false,
  "error": {
    "message": "Mistral OCR service is currently unavailable. Please try again later.",
    "code": "MISTRAL_SERVICE_UNAVAILABLE",
    "details": {
      "timestamp": "2025-05-04T05:36:11.673Z"
    }
  }
}
```

### Cloudflare Workers Considerations

Due to Cloudflare Workers execution model:

1. **No Automatic Retries**: Workers have strict execution time limits, so we don't implement automatic retries within a single request
2. **Limited Execution Time**: Workers may time out after 50ms (CPU time) or 30 seconds (total time), so lengthy retry sequences aren't feasible
3. **External Monitoring**: Instead of internal retries, we recommend external health checks and monitoring

## Monitoring and Detecting Issues

### Using the Test Script

The standalone test script can be used to check Mistral API status:

```bash
node scripts/test-mistral.js
```

This script will:
- Use the API key from `.dev.vars` or accept one via command line
- Test the Mistral OCR API directly
- Provide detailed logging of the request, response, and any errors
- Exit with a status code indicating success (0) or failure (non-zero)

### Integration with Monitoring Services

For production environments, we recommend:

1. **Scheduled Checks**: Running the test script regularly to verify service status
2. **Alert Integration**: Setting up alerts for persistent failures
3. **Status Page**: Creating a status page that includes Mistral API status
4. **Fallback Mechanisms**: Developing fallback mechanisms when appropriate

## Client-Side Handling Recommendations

Clients should implement the following strategies:

1. **Exponential Backoff**: When receiving a service unavailability error, wait and retry with increasing delays
2. **Circuit Breaking**: After multiple failures, temporarily stop trying for a longer cooling off period
3. **Error Display**: Show appropriate user-friendly error messages
4. **Offline Support**: Where possible, implement offline functionality during service disruptions

## Future Improvements

Potential future enhancements for error handling:

1. **Status Endpoint**: A specialized API endpoint to check Mistral service status
2. **Internal Health Dashboard**: A dashboard showing current and historical service availability
3. **Alternative Providers**: Integration with alternative OCR providers as fallback options
4. **Queue System**: A queuing system for processing requests when the service becomes available again

## Error Resolution Steps

When encountering Mistral API service unavailability:

1. Run the test script to confirm the issue is with Mistral's service
2. Check [Mistral's status page](https://status.mistral.ai/) if available
3. Wait for service restoration - these issues are typically resolved by Mistral within hours
4. If issues persist for more than 24 hours, contact Mistral support

## Conclusion

The enhanced diagnostic capabilities implemented in version 1.35.0 provide much more detailed information about Mistral API errors, making it easier to identify and diagnose service issues. As Mistral AI continues to develop their platform, we'll update our error handling strategies accordingly.