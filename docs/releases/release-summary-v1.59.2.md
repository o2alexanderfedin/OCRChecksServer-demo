# Release Summary: v1.59.2

## Release Date
May 22, 2025

## Overview
This minor release improves error handling in the OCR Checks Server by changing HTTP 500 status codes to 429 (Too Many Requests) for error responses. This change prevents the endpoints from appearing "broken" when encountering transient errors while still providing detailed error messages for debugging.

## Changes

### Bug Fixes
- Changed HTTP status code from 500 to 429 for error responses to better indicate transient errors
- Ensured error messages are preserved in the response for debugging purposes
- Added additional server-side logging for improved troubleshooting

### New Features
- Added a new testing script (`scripts/test-all-environments.sh`) to help test and monitor all environments, with proper error message display

## Deployment Instructions
The release has been deployed to all environments (development, staging, and production) using the standard deployment process:

```bash
npm run deploy:with-secrets            # Deploy to dev
npm run deploy:with-secrets -- staging  # Deploy to staging
npm run deploy:with-secrets -- production # Deploy to production
```

## Testing Instructions
The changes can be tested using the new test script:

```bash
./scripts/test-all-environments.sh [duration_in_seconds]
```

This script will test all environments (dev, staging, and production) and display any error messages that occur.

## Known Issues
- The development and staging environments may still occasionally time out during heavy processing loads.

## Contributors
- Alexander Fedin