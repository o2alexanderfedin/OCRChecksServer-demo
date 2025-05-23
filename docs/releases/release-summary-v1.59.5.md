# Release Summary for v1.59.5

## Overview
This release updates the Mistral API key used for OCR and extraction operations across all environments. It resolves the authentication issues that were preventing the API from functioning correctly and adds utility scripts for API key validation.

## Changes
- Updated Mistral API key in all environments (dev, staging, production)
- Added test scripts to validate Mistral API key functionality
- Fixed 401 Unauthorized errors in API requests

## Technical Details
- Resolved authentication issues with the Mistral API by updating the API key
- Added `simple-test.js` for quick validation of the Mistral API key
- Added `test-api-key.js` for more detailed API key verification
- Verified all environments are working correctly with the new API key

## Testing
- Comprehensive testing across all environments shows successful API operations
- The updated API key has been verified to work with both chat and OCR operations
- Load testing confirms the system can handle continuous requests

## Deployment Instructions
The new API key has already been deployed to all environments using the standard deployment process:
```
npm run deploy:with-secrets
```