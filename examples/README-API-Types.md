# OCR API Response Types

This document describes the TypeScript type definitions for the OCR API responses.

## Overview

We provide TypeScript type definitions for all API responses to help with integrating client applications. These type definitions ensure proper typing and include documentation for all properties.

## Available Types

### Core Response Types

- **`CheckOCRResponse`**: Response from the `/check` endpoint
- **`ReceiptOCRResponse`**: Response from the `/receipt` endpoint
- **`ProcessDocumentResponse`**: Response from the `/process` endpoint
- **`ErrorResponse`**: Error response format
- **`HealthResponse`**: Response from the `/health` endpoint

### Supporting Types

- **`ConfidenceScores`**: Confidence metrics for OCR and data extraction
- **`BaseOCRResponse<T>`**: Generic base interface for all OCR responses

## Type Definitions

All type definitions are available in the `src/types/api-responses.ts` file. These are exported via the `src/types/index.ts` for easy importing.

### Using the Types

Import the types in your TypeScript application:

```typescript
import { 
  CheckOCRResponse, 
  ReceiptOCRResponse, 
  ProcessDocumentResponse 
} from 'ocr-checks-server/src/types';
```

## Examples

### Processing a Check

```typescript
import { CheckOCRResponse, ErrorResponse } from 'ocr-checks-server/src/types';

async function processCheck(imageFile: File): Promise<CheckOCRResponse> {
  const url = 'https://api.example.com/check';
  
  const formData = new FormData();
  formData.append('file', imageFile);
  
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const errorData: ErrorResponse = await response.json();
    throw new Error(`Processing failed: ${errorData.error}`);
  }
  
  const data: CheckOCRResponse = await response.json();
  return data;
}
```

### Using the Response Data

```typescript
// Process a check image
const checkResult = await processCheck(imageFile);

// Access structured data with full type safety
console.log(`Check #${checkResult.data.checkNumber}`);
console.log(`Amount: $${checkResult.data.amount}`);
console.log(`Payee: ${checkResult.data.payee}`);

// Access confidence scores
console.log(`OCR Confidence: ${checkResult.confidence.ocr * 100}%`);
console.log(`Extraction Confidence: ${checkResult.confidence.extraction * 100}%`);
console.log(`Overall Confidence: ${checkResult.confidence.overall * 100}%`);
```

## Complete Examples

For complete client examples, see:

- [client.ts](./client.ts) - TypeScript client implementation
- [client.html](./client.html) - Example HTML UI for the OCR API

## Response Schema Examples

These type definitions match the JSON response formats shown in:

- [check-ocr-response-example.json](./check-ocr-response-example.json)
- [receipt-ocr-response-example.json](./receipt-ocr-response-example.json)