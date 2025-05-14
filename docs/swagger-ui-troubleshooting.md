# Swagger UI Troubleshooting Guide

This document provides solutions for common issues encountered with the Swagger UI integration.

## Blank UI Issues

If you encounter a blank Swagger UI page, try the following solutions:

### Solution 1: Check for JavaScript Errors

Open your browser's developer console (F12 or Right-click > Inspect > Console) to check for JavaScript errors. Common errors include:

- Syntax errors in the Swagger UI configuration
- CORS issues when loading the OpenAPI specification
- Invalid JSON in the OpenAPI specification

### Solution 2: Verify the OpenAPI Specification

Ensure the OpenAPI specification is valid JSON:

1. Visit the `/openapi.json` endpoint directly
2. Check that it returns valid JSON
3. Verify there are no JavaScript comments in the specification

### Solution 3: Simplify Swagger UI Configuration

If you're having issues with complex Swagger UI options, try simplifying the configuration:

```typescript
// Simple configuration that should work reliably
return swaggerUI({
  spec: yourOpenAPISpec,
  title: 'API Documentation'
});
```

### Solution 4: Network Connectivity

Ensure your browser can access the CDN resources that Swagger UI depends on:

- https://cdn.jsdelivr.net/npm/swagger-ui-dist/swagger-ui.css
- https://cdn.jsdelivr.net/npm/swagger-ui-dist/swagger-ui-bundle.js

### Solution 5: Browser Cache

Clear your browser cache and reload the page. Sometimes stale JavaScript or CSS files can cause display issues.

## Loading Performance Issues

If Swagger UI is slow to load:

1. Consider embedding a smaller OpenAPI specification
2. Use the `tagsSorter` option to organize endpoints logically
3. Set `docExpansion: 'none'` to start with all operations collapsed

## API Testing Issues

If you're having trouble testing API endpoints through Swagger UI:

1. Ensure the server is running on the correct hostname and port
2. Check that CORS is properly configured
3. Verify that the `tryItOutEnabled` option is set to `true`
4. For file uploads, ensure the server properly handles multipart/form-data requests