# Testing the Unified Processor

This document provides guidance on testing the new UnifiedProcessor component and its `/process` API endpoint.

## Unit Testing

Unit tests for the UnifiedProcessor are located in `src/processor/unified-processor.test.ts`. These tests verify:

1. Successful processing of documents
2. Proper error handling for OCR failures
3. Proper error handling for JSON extraction failures

Run the unit tests with:

```bash
npm run test:unit -- src/processor/unified-processor.test.ts
```

## Integration Testing

Integration tests for the UnifiedProcessor are located in `tests/integration/unified-processor.test.ts`. These tests verify:

1. End-to-end processing of real document images
2. Extraction of structured data with correct properties
3. Confidence score calculation

Run the integration tests with:

```bash
npm run test:integration -- tests/integration/unified-processor.test.ts
```

Note: You need to set the `MISTRAL_API_KEY` environment variable for integration tests to run.

## Manual Testing

You can test the `/process` endpoint using cURL or Postman:

### Using cURL

```bash
# Test with a receipt image
curl -X POST http://localhost:8787/process \
  -H "Content-Type: image/jpeg" \
  --data-binary @./tests/fixtures/images/fredmeyer-receipt.jpg

# Test with a check image
curl -X POST http://localhost:8787/process \
  -H "Content-Type: image/jpeg" \
  --data-binary @./tests/fixtures/images/promo-check.HEIC
```

### Expected Response

The response should include:

1. Extracted JSON data
2. Confidence scores (OCR, extraction, and overall)

Example:

```json
{
  "data": {
    "merchant": {
      "name": "EXAMPLE STORE",
      "address": "123 MAIN ST, ANYTOWN, US 12345"
    },
    "timestamp": "2023-04-15T14:30:00Z",
    "totals": {
      "subtotal": 42.50,
      "tax": 3.40,
      "total": 45.90
    },
    "currency": "USD"
  },
  "confidence": {
    "ocr": 0.95,
    "extraction": 0.89,
    "overall": 0.92
  }
}
```

## Performance Testing

For performance testing, you can use the following script to send multiple requests:

```bash
#!/bin/bash

# Number of requests to send
NUM_REQUESTS=10

# URL to test
URL="http://localhost:8787/process"

# Path to test image
IMAGE_PATH="./tests/fixtures/images/fredmeyer-receipt.jpg"

echo "Starting performance test with $NUM_REQUESTS requests..."

START_TIME=$(date +%s)

for ((i=1; i<=$NUM_REQUESTS; i++)); do
  echo "Sending request $i of $NUM_REQUESTS..."
  curl -s -X POST "$URL" \
    -H "Content-Type: image/jpeg" \
    --data-binary @"$IMAGE_PATH" > /dev/null
done

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "Performance test completed in $DURATION seconds."
echo "Average request time: $(echo "scale=2; $DURATION / $NUM_REQUESTS" | bc) seconds"
```

## Error Cases to Test

Verify error handling for:

1. Invalid image formats
2. Empty images
3. Images with no recognizable text
4. Missing required API key
5. Network failures during OCR or extraction

## Debugging

To enable detailed debugging:

1. Start the server with debug logging:
   ```bash
   DEBUG=true npm run dev
   ```

2. Check the console output for detailed processing logs

3. For integration tests, examine the `integration-test-results.json` file that's created after test runs