# OpenAPI Specification

> Copyright © 2025 [Nolock.social](https://nolock.social). All rights reserved.  
> Authored by: [O2.services](https://o2.services)  
> Contact: [sales@o2.services](mailto:sales@o2.services)  
> Licensed under the [GNU Affero General Public License v3.0 or later](https://www.gnu.org/licenses/agpl-3.0.html) (AGPL-3.0-or-later)

## Overview

This document explains the OpenAPI specification for the OCR Checks Server API. The specification is provided in OpenAPI 3.0 format and describes all available endpoints, request/response schemas, and includes examples.

## Specification Location

The OpenAPI specification is available in the root of the project as `openapi.yaml`.

## Key Components

### Endpoints

The API provides the following endpoints:

1. **POST /process** - Universal document processing endpoint
   - Process images of either checks or receipts based on the `type` parameter
   - Parameters: `type`, `format`, `filename`
   - Content Type: `image/*`

2. **POST /check** - Check-specific processing endpoint
   - Dedicated for processing check images
   - Parameters: `format`, `filename`
   - Content Type: `image/*`

3. **POST /receipt** - Receipt-specific processing endpoint
   - Dedicated for processing receipt images
   - Parameters: `format`, `filename`
   - Content Type: `image/*`

4. **GET /health** - Health check endpoint
   - Returns server status, current timestamp, and version

### Data Models

The specification defines detailed schemas for:

- **Check** - Structure for check data extracted from images
- **Receipt** - Structure for receipt data extracted from images
- **Confidence** - Confidence scores for the processing
- **Error** - Standard error format

### Examples

The specification includes examples for all endpoints and response types to guide API consumers.

## Using the Specification

### Documentation Generation

You can use various tools to generate interactive documentation from the OpenAPI specification:

1. **Swagger UI**:
   ```bash
   npx serve-swagger-ui openapi.yaml
   ```

   When deployed, API documentation will be available at https://api.nolock.social/docs

2. **Redoc**:
   ```bash
   npx @redocly/cli preview-docs openapi.yaml
   ```

### Client Generation

The OpenAPI specification can be used to generate API clients in various languages for integrating with the Nolock.social API:

```bash
npx @openapitools/openapi-generator-cli generate -i openapi.yaml -g typescript-fetch -o ./generated-client
```

### Validation

You can validate the specification using OpenAPI validator tools:

```bash
npx @stoplight/spectral-cli lint openapi.yaml
```

## Future Improvements

Potential enhancements to the API specification:

1. Add authentication mechanisms (API keys, OAuth, etc.)
2. Add rate limiting information
3. Include response headers documentation
4. Add more detailed examples including error scenarios
5. Add schema validation for query parameters

## Maintenance

The OpenAPI specification should be updated whenever there are changes to the Nolock.social API endpoints, request or response formats. This ensures that the documentation stays in sync with the implementation.

API documentation and client SDKs for Nolock.social are automatically generated from this specification.