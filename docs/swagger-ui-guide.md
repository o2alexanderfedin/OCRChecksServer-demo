# Swagger UI Integration

## Overview

The OCR Checks Server now includes a Swagger UI integration that provides an interactive API documentation interface. This makes it easier to explore and test the API endpoints directly from your browser.

## Available Endpoints

- **Swagger UI Interface**: `/api-docs`
- **Raw OpenAPI Specification**: `/openapi.json`

## Environments

The Swagger UI allows you to select from the following server environments:

1. **Current Server**: Uses the current host (relative URL) - best for local testing
2. **Local Development**: http://localhost:8787
3. **Development Environment**: https://ocr-checks-worker-dev.af-4a0.workers.dev
4. **Staging Environment**: https://ocr-checks-worker-staging.af-4a0.workers.dev
5. **Production Environment**: https://ocr-checks-worker.af-4a0.workers.dev

You can switch between these environments in the Swagger UI interface by selecting from the dropdown at the top of the page.

## Features

- **Interactive API Documentation**: Browse all available endpoints with descriptions
- **Real-time Testing**: Try out API endpoints directly from the browser
- **Request/Response Examples**: View sample requests and responses
- **Schema Validation**: See detailed data models and validation rules
- **Version Synchronization**: The API version shown in the documentation is automatically updated from package.json

## Usage Instructions

1. Start the local server:
   ```bash
   ./scripts/start-local.sh
   ```

2. Access the Swagger UI at:
   - Local: http://localhost:8787/api-docs
   - Development: https://ocr-checks-worker-dev.af-4a0.workers.dev/api-docs
   - Staging: https://ocr-checks-worker-staging.af-4a0.workers.dev/api-docs
   - Production: https://ocr-checks-worker.af-4a0.workers.dev/api-docs

3. The raw OpenAPI specification is available at `/openapi.json` and can be imported into other API tools if needed.

## Implementation Details

The Swagger UI integration is implemented using:

- `@hono/swagger-ui` package for the UI interface
- `@hono/zod-openapi` package for OpenAPI schema handling
- Embedded OpenAPI specification in `src/swagger/openapi-spec.ts`
- Dynamic version injection from package.json

This approach ensures that the API documentation is always up-to-date with the current implementation and version.