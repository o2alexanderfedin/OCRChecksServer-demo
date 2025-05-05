# Mistral API Test Scripts

This directory contains test scripts for directly testing the Mistral AI API outside of the main application context. These scripts are useful for debugging, troubleshooting, and verifying Mistral API functionality.

## Available Scripts

- **test-mistral-now.js** - Tests the direct Mistral API with image inputs using base64 encoding
- **test-mistral-ocr.js** - Tests OCR processing and structured data extraction from receipt images
- **test-mistral-text.js** - Tests text extraction capabilities from document images

## Usage

These scripts require a Mistral API key to be set in the environment:

```bash
# Run with API key from environment variable
export MISTRAL_API_KEY=your_api_key_here
node scripts/mistral-tests/test-mistral-ocr.js

# Alternatively, you can set the key inline
MISTRAL_API_KEY=your_api_key_here node scripts/mistral-tests/test-mistral-ocr.js
```

## Test Image Path

By default, these scripts use test images from the `tests/fixtures/images` directory. You can modify the script to use different test images if needed.

## Error Handling

All scripts include detailed error handling and will log comprehensive information about API responses and errors.

## Adding New Tests

When adding new Mistral API test scripts, please follow the same structure:
1. Use environment variables for API keys
2. Implement detailed error handling
3. Document the purpose and usage in this README