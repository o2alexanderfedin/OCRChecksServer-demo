# 💻 Local Development Guide

---
**🏠 [Home](../../../README.md)** | **📚 [Documentation](../../README.md)** | **📖 [Guides](../index.md)** | **💻 [Development](./)**
---

This document provides instructions for setting up the OCR Checks Server for local development.

## Environment Setup

### Setting up the .dev.vars File

The OCR Checks Server uses Cloudflare Workers for deployment and requires a Mistral API key for OCR processing. When developing locally, you should store your API key in a `.dev.vars` file to avoid exposing sensitive credentials in your code.

1. Create a `.dev.vars` file in the project root directory:

```bash
touch .dev.vars
```

2. Add your Mistral API key to the `.dev.vars` file:

```
MISTRAL_API_KEY=your_api_key_here
```

3. Make sure `.dev.vars` is included in your `.gitignore` file to prevent accidentally committing sensitive information.

### Environment Variables Loading

The OCR Checks Server is configured to automatically load environment variables from the `.dev.vars` file for both development and testing purposes. This happens through the following mechanisms:

- During local development, Wrangler automatically loads variables from `.dev.vars`
- For testing, a custom loader (`scripts/load-dev-vars.js`) loads variables from `.dev.vars` into the Node.js environment
- Integration tests specifically look for the MISTRAL_API_KEY in the loaded environment variables

This ensures consistency between your development and testing environments without requiring you to set environment variables manually. The `.dev.vars` file with a valid MISTRAL_API_KEY is required for running integration tests and connecting to the Mistral API.

## Running the Server Locally

To start the development server:

```bash
npm run start-local
```

This will:
1. Load environment variables from `.dev.vars`
2. Start the Wrangler development server
3. Make the server available at http://localhost:8787

## Running Tests

To run tests with the correct environment variables:

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run functional tests only
npm run test:functional

# Run integration tests only
npm run test:integration

# Run semi-integration tests only
npm run test:semi
```

All test runners will automatically load environment variables from `.dev.vars`, including the Mistral API key needed for OCR tests.

### Troubleshooting Integration Tests

If integration tests fail with API connection issues, check the following:

1. **API Key Issues**
   - Ensure there's a valid MISTRAL_API_KEY in your `.dev.vars` file
   - Verify the API key isn't expired or has reached its rate limit
   - The key should be 32+ characters long with only alphanumeric characters

2. **Server Connectivity Issues**
   - Check that a development server is running (started automatically by test scripts or manually)
   - Default server URL is http://localhost:8787
   - If manually starting the server, use `npm run dev` before running tests

3. **Debugging Server Connection**
   - Run a simple health check: `curl http://localhost:8787/health`
   - If that fails, the server isn't running properly
   - Check for server startup errors in console output

## Testing Mistral API Directly

For direct testing of the Mistral API integration:

```bash
npm run test:mistral
```

This runs a standalone script that tests the Mistral OCR API with images from the test fixtures, using the API key from your `.dev.vars` file.

## Production Deployment

For production deployment, use the `deploy:with-secrets` script which handles moving your API key from `.dev.vars` to Cloudflare Worker secrets:

```bash
npm run deploy:with-secrets
```

See [Cloudflare Deployment Guide](../deployment/cloudflare-deployment-guide.md) for more details on deployment.

---
**🏠 [Home](../../../README.md)** | **📚 [Documentation](../../README.md)** | **📖 [Guides](../index.md)** | **💻 [Development](./)** | **⬆️ [Top](#-local-development-guide)**
---