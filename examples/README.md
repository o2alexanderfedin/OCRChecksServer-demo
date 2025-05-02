# OCR Response Examples and Client Interface

This directory contains example JSON responses from the OCR Checks Server and a client interface for testing the API.

## Example Web Interface

The `client.html` file provides a simple web interface for testing the API. This interface allows you to:

1. Process check images via the `/check` endpoint
2. Process receipt images via the `/receipt` endpoint
3. Process any document type via the universal `/process` endpoint
4. Check the API health via the `/health` endpoint

### How to Use the Example Web Interface

#### Method 1: Using the API Server's Static File Serving

If you have the OCR API server running with static file serving enabled:

1. Start the API server:
   ```bash
   ./scripts/start-local.sh
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:8787/examples/client.html
   ```

#### Method 2: Using a Separate HTTP Server (Recommended)

This approach runs the example files on a separate web server while the API runs on its own server.

1. Start the API server:
   ```bash
   ./scripts/start-local.sh
   ```

2. In a new terminal, start a simple HTTP server for the examples directory:
   ```bash
   cd /path/to/OCRChecksServer
   npx http-server examples -p 8001
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:8001/client.html
   ```

### Using the Interface

1. **Check Scanner**:
   - Click "Browse" to select a check image
   - Click "Process Check" to send it to the API
   - View the structured check data in the result area

2. **Receipt Scanner**:
   - Click "Browse" to select a receipt image
   - Click "Process Receipt" to send it to the API
   - View the structured receipt data in the result area

3. **Universal Document Scanner**:
   - Click "Browse" to select an image
   - Select the document type (check or receipt)
   - Click "Process Document" to send it to the API
   - View the structured data in the result area

4. **Health Check**:
   - Click "Check API Health" to test the API availability
   - View the server status, version, and timestamp

### Client API

The `client.js` file exports these functions that you can use in your own JavaScript applications:

- `processCheck(imageFile)`: Process a check image
- `processReceipt(imageFile)`: Process a receipt image
- `processDocument(imageFile, documentType)`: Process any document type
- `checkHealth()`: Check API health

For TypeScript applications, see `client.ts` which includes full type definitions.

## Available Examples

### Receipt OCR Example

[receipt-ocr-response-example.json](./receipt-ocr-response-example.json) - A comprehensive example of a receipt OCR response, containing:

- Complete merchant information
- Transaction details (timestamp, receipt number, payment method)
- Detailed line items with quantities, prices, and categories
- Tax information
- Payment method details
- Confidence scores for OCR and extraction

This example follows the [Receipt Schema](../docs/receipt-schema-documentation.md) specification.

### Check OCR Example

[check-ocr-response-example.json](./check-ocr-response-example.json) - A comprehensive example of a check OCR response, containing:

- Check number and date
- Payee and payer information
- Amount (numerical and text)
- Bank details (routing number, account number)
- Check type and account type
- Signature information
- MICR line data
- Confidence scores for OCR and extraction

This example follows the [Check Schema](../docs/check-schema-documentation.md) specification.

## Usage

These examples can be used for:

1. Understanding the expected response format from the API
2. Testing client applications that consume the OCR Checks Server API
3. Evaluating the data structure for integration planning
4. Training or demonstration purposes

## Schema Validation

The examples in this directory are validated against their respective JSON schemas to ensure they represent valid responses according to the API specifications.