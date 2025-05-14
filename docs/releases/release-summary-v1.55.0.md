# Release Summary v1.55.0

## Overview
Version 1.55.0 focuses on improving interoperability between the server and Swift client, along with optimizing API communications.

## Changes

### Server Improvements
- Fixed health endpoint to return ISO-formatted timestamp string for better client compatibility
- Optimized server response handling for different image formats
- Updated API response formats for better type safety across clients

### Swift Proxy Enhancements
- Fixed Content-Type header handling to properly reflect image format (JPEG vs PNG)
- Enhanced HEIC conversion handling with proper MIME type detection
- Added task cancellation support for all asynchronous operations
- Updated documentation with MIME type guidelines

### Documentation
- Added comprehensive instructions for testing against remote environments
- Enhanced troubleshooting section with common issues and solutions
- Updated content type guidelines for different image formats

## Testing Notes
- All standard tests pass for both server and client components
- Swift integration tests verified against the remote environment
- Manual verification performed with both JPEG and PNG image formats

## Deployment Instructions
Standard deployment process applies:
```bash
npm run deploy:with-secrets
```