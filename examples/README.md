# OCR Response Examples

This directory contains example JSON responses from the OCR Checks Server, demonstrating the expected format and structure of the data returned by the API.

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