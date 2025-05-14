# Release Summary v1.56.0

## Overview

Version 1.56.0 focuses on enhancing API discoverability and developer experience through the addition of interactive API documentation. This release also includes improvements to deployment configuration and fixes for CORS issues.

## Features

### Interactive API Documentation

- Added Swagger UI integration via `/api-docs` endpoint for easy API exploration and testing
- Implemented OpenAPI specification at `/openapi.json` endpoint
- Created dynamic version synchronization between package.json and API documentation
- Added multi-environment server selection in Swagger UI for testing across environments
- Improved cross-origin resource sharing (CORS) to allow API testing from any domain

### Deployment Improvements

- Fixed staging environment configuration in wrangler.toml
- Enhanced CORS configuration for cross-origin API calls
- Completed deployment to all environments (dev, staging, production)
- Ensured consistent configuration across all deployment environments

### Documentation

- Added comprehensive Swagger UI usage guide in docs/swagger-ui-guide.md
- Added Swagger UI troubleshooting guide in docs/swagger-ui-troubleshooting.md
- Enhanced API discoverability with interactive documentation
- Improved developer experience for API integration testing

## Swift Proxy Enhancements

- Added task cancellation support in Swift client (v1.3.0)
- Fixed Content-Type header handling for image uploads 
- Updated submodule reference to v1.3.0

## How to Access

The API documentation is now available at:

- Development: https://ocr-checks-worker-dev.af-4a0.workers.dev/api-docs
- Staging: https://ocr-checks-worker-staging.af-4a0.workers.dev/api-docs
- Production: https://ocr-checks-worker.af-4a0.workers.dev/api-docs