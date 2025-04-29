# JSON Extraction Usage Guide

## Overview

The JSON extraction feature enables structured data extraction from OCR-processed text. This document provides a practical guide to using the feature, complete with examples and best practices.

## Getting Started

### Installation

The JSON extraction feature is integrated with the OCRChecksServer and does not require separate installation.

### Basic Setup

To use the JSON extraction feature, you need to initialize the extractor with the necessary dependencies:

```typescript
import { MistralJsonExtractorProvider } from './src/json/mistral';
import { IoE } from './src/ocr/types';
import { Mistral } from '@mistralai/mistralai';

// Initialize dependencies
const io: IoE = /* your IO implementation */;
const mistralClient = new Mistral({ apiKey: 'your-api-key' });

// Create the JSON extractor
const jsonExtractor = new MistralJsonExtractorProvider(io, mistralClient);
```

## Basic Usage Examples

### Simple Extraction

Extract JSON from markdown text without a schema:

```typescript
const result = await jsonExtractor.extract({
  markdown: `
    Invoice Number: 12345
    Date: 01/15/2024
    Amount: $120.45
    Customer: John Doe
  `
});

if (result[0] === 'ok') {
  console.log('Extracted JSON:', result[1].json);
  console.log('Confidence score:', result[1].confidence);
} else {
  console.error('Extraction failed:', result[1]);
}
```

Expected output:

```json
{
  "invoiceNumber": "12345",
  "date": "01/15/2024",
  "amount": 120.45,
  "customer": "John Doe"
}
```

### Extraction with Schema

Using a schema provides more control over the structure of the extracted data:

```typescript
// Define a schema for the extraction
const schema = {
  name: "InvoiceSchema",
  schemaDefinition: {
    type: "object",
    properties: {
      invoiceNumber: { type: "string" },
      date: { type: "string" },
      amount: { type: "number" },
      customer: { type: "string" }
    },
    required: ["invoiceNumber", "amount"]
  }
};

// Extract with schema validation
const result = await jsonExtractor.extract({
  markdown: invoiceText,
  schema,
  options: {
    strictValidation: true // Will return error if validation fails
  }
});

if (result[0] === 'ok') {
  // Process valid data
  processInvoice(result[1].json);
} else {
  // Handle validation error
  handleExtractionError(result[1]);
}
```

## Advanced Usage

### Integrating with OCR

Combine OCR and JSON extraction for end-to-end document processing:

```typescript
// Process a document with OCR
const ocrResult = await ocrProvider.processDocuments([documentData]);

if (ocrResult[0] === 'ok') {
  const markdown = ocrResult[1][0][0].text;
  
  // Pass to JSON extractor
  const jsonResult = await jsonExtractor.extract({ 
    markdown,
    schema: mySchema 
  });
  
  if (jsonResult[0] === 'ok') {
    // Use structured data
    const data = jsonResult[1].json;
    
    // Save to database, process further, etc.
    await saveInvoiceToDatabase(data);
  }
}
```

### Processing Different Document Types

#### Check Processing

```typescript
// Check-specific schema
const checkSchema = {
  name: "CheckSchema",
  schemaDefinition: {
    type: "object",
    properties: {
      checkNumber: { type: "string" },
      date: { type: "string" },
      payee: { type: "string" },
      amount: { type: "number" },
      memo: { type: "string" }
    },
    required: ["checkNumber", "date", "payee", "amount"]
  }
};

// Process OCR result from check image
const jsonResult = await jsonExtractor.extract({
  markdown: checkText,
  schema: checkSchema
});
```

#### Invoice Processing

```typescript
// Invoice-specific schema
const invoiceSchema = {
  name: "InvoiceSchema",
  schemaDefinition: {
    type: "object",
    properties: {
      invoiceNumber: { type: "string" },
      invoiceDate: { type: "string" },
      dueDate: { type: "string" },
      vendor: { type: "string" },
      customer: { type: "string" },
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            description: { type: "string" },
            quantity: { type: "number" },
            unitPrice: { type: "number" },
            amount: { type: "number" }
          }
        }
      },
      subtotal: { type: "number" },
      tax: { type: "number" },
      total: { type: "number" }
    },
    required: ["invoiceNumber", "invoiceDate", "total"]
  }
};

// Process OCR result from invoice image
const jsonResult = await jsonExtractor.extract({
  markdown: invoiceText,
  schema: invoiceSchema
});
```

#### Utility Bill Processing

```typescript
// Utility bill-specific schema
const utilityBillSchema = {
  name: "UtilityBillSchema",
  schemaDefinition: {
    type: "object",
    properties: {
      accountNumber: { type: "string" },
      statementDate: { type: "string" },
      dueDate: { type: "string" },
      customerName: { type: "string" },
      serviceAddress: { type: "string" },
      billAmount: { type: "number" },
      previousBalance: { type: "number" },
      payments: { type: "number" },
      currentCharges: { type: "number" }
    },
    required: ["accountNumber", "dueDate", "billAmount"]
  }
};

// Process OCR result from utility bill image
const jsonResult = await jsonExtractor.extract({
  markdown: utilityBillText,
  schema: utilityBillSchema
});
```

## Working with Confidence Scores

The confidence score indicates the reliability of the extraction:

```typescript
const result = await jsonExtractor.extract({ markdown: text });

if (result[0] === 'ok') {
  const { json, confidence } = result[1];
  
  if (confidence > 0.9) {
    // High confidence - proceed automatically
    await processWithoutReview(json);
  } else if (confidence > 0.7) {
    // Medium confidence - flag for quick review
    await queueForQuickReview(json);
  } else {
    // Low confidence - needs manual review
    await queueForManualReview(json);
  }
}
```

## Error Handling

The extractor uses Result types to handle errors elegantly:

```typescript
const result = await jsonExtractor.extract({
  markdown: markdownText,
  schema: mySchema
});

if (result[0] === 'error') {
  const error = result[1];
  
  if (error.message.includes('validation failed')) {
    // Handle validation error
    console.error('Schema validation failed:', error);
    notifyUser('The extracted data does not match the expected format.');
  } else if (error.message.includes('API')) {
    // Handle API error
    console.error('API error:', error);
    retryExtractionLater(markdownText, mySchema);
  } else if (error.message.includes('Invalid JSON')) {
    // Handle parsing error
    console.error('JSON parsing error:', error);
    notifyUser('The extraction produced invalid data. Please check the input.');
  } else {
    // Handle other errors
    console.error('Unexpected error:', error);
    logErrorForInvestigation(error);
  }
}
```

## Best Practices

1. **Use Schemas When Possible**
   - Schemas help ensure the extracted data is in the expected format
   - They provide documentation for expected fields
   - They allow the model to better understand what data to extract

2. **Check Confidence Scores**
   - Higher confidence scores indicate more reliable extractions
   - Implement different processing flows based on confidence levels
   - Consider manual review for low confidence extractions

3. **Provide Clear Context**
   - Include all relevant information in the markdown text
   - Structure is important; well-structured input leads to better extraction
   - Use proper formatting where possible (tables, headers, etc.)

4. **Handle Errors Appropriately**
   - Always check for errors and handle them gracefully
   - Implement retry logic for transient errors
   - Log error details for debugging and monitoring

5. **Optimize Performance**
   - Batch extractions when processing multiple documents
   - Implement caching for frequently extracted documents
   - Use higher-performing models for time-critical operations

## Troubleshooting

### Common Issues

1. **Low Confidence Scores**
   - **Issue**: Extraction returns with low confidence
   - **Solution**: Improve input text formatting, provide more context, or use a more specific schema

2. **Schema Validation Errors**
   - **Issue**: Extraction fails schema validation
   - **Solution**: Check if the schema matches the expected data structure, or use less strict validation

3. **API Rate Limiting**
   - **Issue**: Extraction fails due to rate limiting
   - **Solution**: Implement retry logic with exponential backoff, batch requests, or optimize token usage

4. **Empty or Missing Fields**
   - **Issue**: Some fields are missing in the extracted JSON
   - **Solution**: Check if the input markdown contains the expected information, or adjust the prompt

## Performance Considerations

- The extraction process involves API calls to Mistral, which adds latency
- Consider implementing caching for frequently extracted documents
- Batch extractions when processing multiple related documents
- Monitor token usage for cost optimization