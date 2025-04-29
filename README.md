# OCR Checks Worker

A Cloudflare Worker that uses Mistral AI to perform OCR on paper checks and extract relevant information.

## Features

- **OCR Processing**: 
  - Accepts image uploads of paper checks
  - Uses Mistral AI's vision capabilities to analyze the check
  - Extracts key information including:
    - Check number
    - Amount
    - Date
    - Payee
    - Payer
    - Bank name
    - Routing number
    - Account number
    - Memo (if present)
    
- **JSON Extraction**: 
  - Converts OCR results into structured JSON data
  - Validates against customizable schemas
  - Provides confidence scoring for extraction reliability
  - Supports various document types:
    - Checks
    - Receipts
    - Invoices
    - Utility bills
    
- **Architecture**:
  - Clean separation of concerns with specialized components
  - Dependency injection using InversifyJS for flexible configuration
  - Factory pattern for easy instantiation of complex object graphs
  - Extensive test coverage for all components

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure your environment:
   - Add your Mistral API key to `wrangler.toml`
   - Deploy using Wrangler:
     ```bash
     npx wrangler deploy
     ```

## Usage

Send a POST request to the worker endpoint with a check image:

```bash
curl -X POST \
  -H "Content-Type: image/jpeg" \
  --data-binary @check.jpg \
  https://your-worker.workers.dev
```

The response will be a JSON object containing the extracted check information.

### JSON Extraction Example

```javascript
import { MistralJsonExtractorProvider } from './src/json/mistral';
import { Mistral } from '@mistralai/mistralai';
import { workerIoE } from './src/io';

// Initialize the JSON extractor
const mistralClient = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });
const jsonExtractor = new MistralJsonExtractorProvider(workerIoE, mistralClient);

// Define a schema for check data
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

// Process OCR output with JSON extraction
async function processCheckWithOCR(imageBuffer) {
  // Step 1: Perform OCR on the check image
  const ocrResult = await ocrProvider.processDocuments([{
    content: imageBuffer,
    type: DocumentType.Image
  }]);
  
  if (ocrResult[0] === 'error') {
    return { error: 'OCR processing failed' };
  }
  
  // Step 2: Extract JSON data from OCR text
  const markdownText = ocrResult[1][0][0].text;
  const jsonResult = await jsonExtractor.extract({
    markdown: markdownText,
    schema: checkSchema
  });
  
  if (jsonResult[0] === 'error') {
    return { error: 'JSON extraction failed' };
  }
  
  // Step 3: Return structured data with confidence score
  return {
    data: jsonResult[1].json,
    confidence: jsonResult[1].confidence,
    rawText: markdownText
  };
}
```

## Development

To run locally:
```bash
npx wrangler dev
```

### Schema Documentation

The following JSON schemas are available:

- **Check Schema**: For extracting data from paper checks
- **Receipt Schema**: For extracting data from purchase receipts

For detailed schema documentation, see:
- [Check Schema Documentation](docs/check-schema.md)
- [Receipt Schema Documentation](docs/receipt-schema.md)

### Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run functional tests only
npm run test:functional

# Run semi-integration tests
npm run test:semi
```

## License

ISC 