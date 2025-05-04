# Cloudflare Worker Compatibility with Mistral AI

## Overview

This document provides detailed information about running the OCR Checks Server with Mistral AI integration in a Cloudflare Workers environment. The combination presents specific challenges that require careful configuration and error handling.

## Key Compatibility Considerations

### 1. Base64 Encoding for Images

The OCR processing requires converting image data to base64 for the Mistral API. This operation has some specific requirements in Cloudflare Workers:

- **Environment Detection**: The application detects if it's running in a Cloudflare Worker environment and uses specialized code paths.
- **Chunked Processing**: Large images are processed in smaller chunks to avoid memory limits and call stack issues.
- **Buffer Compatibility**: While Cloudflare Workers with Node.js compatibility supports Buffer, it's more reliable to use alternative approaches.

### 2. API Key Management

Proper API key management is critical for security:

- **Use Secrets**: Never store API keys in wrangler.toml. Always use Cloudflare Worker secrets.
- **Setting Secrets**: Use the `wrangler secret put MISTRAL_API_KEY` command to securely store your Mistral API key.
- **Deployment**: The `deploy-with-secrets.sh` script handles proper secrets management during deployment.

### 3. CPU and Memory Limits

Cloudflare Workers have specific resource constraints:

- **CPU Time**: Worker CPU time is limited (50ms on the free tier, customizable on paid plans).
- **Memory Limits**: Worker memory is limited (128MB by default), which affects base64 processing of large images.
- **Execution Time**: Total execution time is limited (30 seconds), which affects timeouts for API requests.

### 4. Error Handling

Enhanced error handling is implemented for Cloudflare Worker specific scenarios:

- **Environment-Specific Diagnostics**: Different error information is collected based on the runtime environment.
- **Network Error Detection**: Special handling for common Worker network issues like ECONNRESET or ETIMEDOUT.
- **API Error Categorization**: Clear distinction between Mistral service issues and Worker configuration problems.

## Implementation Details

### Base64 Encoding Strategy

```typescript
// Specific Worker environment detection
const isCloudflareWorker = typeof caches !== 'undefined' && 
                           typeof navigator !== 'undefined' && 
                           navigator.userAgent === 'Cloudflare-Workers';

// If in Cloudflare Worker, use optimized approach
if (isCloudflareWorker) {
    // Use smaller chunk size (4KB vs 8KB)
    // Process in chunks to avoid memory issues
    // Special error handling for Worker environment
}
```

### API Key Verification

The application explicitly verifies API key availability and format:

```typescript
// Check API key exists and has correct format
if (!c.env.MISTRAL_API_KEY) {
    console.error('[endpoint:handler] CRITICAL ERROR: MISTRAL_API_KEY environment variable is not set');
    return errorResponse('API key not configured', 500);
}
```

### Improved Error Diagnostics

For Cloudflare Worker environments, additional diagnostics are provided:

```typescript
if (isCloudflareWorker) {
    console.log('- Cloudflare Worker specific diagnostics:');
    // Check if API key is available (without logging the key itself)
    // Log potential Worker-specific issues
    // Provide troubleshooting guidance
}
```

## Deployment Best Practices

1. **Never commit API keys** to version control or include them in wrangler.toml
2. **Always use the deploy-with-secrets.sh script** to ensure proper secrets management
3. **Configure appropriate CPU limits** in wrangler.toml for paid plans
4. **Monitor Worker usage** for resource consumption and errors
5. **Implement fallback mechanisms** for service unavailability

## Troubleshooting

### Common Issues

1. **"Service unavailable" errors from Mistral API**
   - This is a temporary issue on Mistral's end
   - Check the Mistral status page and retry later

2. **Authentication errors**
   - Verify the secret is properly set with `wrangler secret list`
   - Check if the API key is correct and has sufficient permissions

3. **Worker CPU time exceeded**
   - Consider upgrading to a paid plan with higher CPU limits
   - Optimize the image size before processing
   - Consider using the `[limits]` section in wrangler.toml to increase CPU allocation

4. **Memory errors during base64 conversion**
   - Reduce image size/quality before sending to the API
   - Check that chunked processing is being used correctly
   - Optimize the encoding method based on image size

### Diagnostic Commands

```bash
# Check environment variables in your .dev.vars file (local)
cat .dev.vars

# List secrets configured for your Worker
wrangler secret list

# Deploy with proper secrets management
bash scripts/deploy-with-secrets.sh

# Check Worker logs for errors
wrangler tail
```

## Future Improvements

1. **Worker-specific caching** for frequently processed document types
2. **Request queue mechanism** for handling service unavailability
3. **Rate limiting** to prevent exhausting Mistral API quotas
4. **Fallback providers** when Mistral API is unavailable
5. **Split processing** for very large images across multiple Worker invocations

## Conclusion

Integrating Mistral AI with Cloudflare Workers requires careful attention to environment-specific behaviors, particularly around base64 encoding, memory management, and API key security. The enhanced error handling and environment detection in this implementation provides a robust foundation for reliable operation in production environments.