# Check Schema Documentation

The OCR Checks Worker provides a comprehensive schema for extracting structured data from check images. This schema is designed to capture all relevant information typically found on paper checks.

## Schema Overview

The check schema defines a structured format for representing check data with validation rules and type definitions.

### Key Properties

| Property | Type | Description | Required |
|----------|------|-------------|:--------:|
| `checkNumber` | string | The check number or identifier | ✓ |
| `date` | string | Date on the check (ISO 8601 format preferred) | ✓ |
| `payee` | string | Person or entity to whom the check is payable | ✓ |
| `payer` | string | Person or entity who wrote/signed the check | |
| `amount` | number | Dollar amount of the check (must be >= 0) | ✓ |
| `amountText` | string | Written text amount of the check | |
| `memo` | string | Memo or note on the check | |
| `bankName` | string | Name of the bank issuing the check | |
| `routingNumber` | string | Bank routing number (9 digits) | |
| `accountNumber` | string | Bank account number | |
| `checkType` | enum | Type of check (personal, business, etc.) | |
| `accountType` | enum | Type of account (checking, savings, etc.) | |
| `signature` | boolean | Whether the check appears to be signed | |
| `signatureText` | string | Text of the signature if readable | |
| `fractionalCode` | string | Fractional code on the check | |
| `micrLine` | string | MICR line at the bottom of the check | |
| `confidence` | number | Overall confidence score (0-1) | ✓ |

### Enum Types

#### Check Type
- `personal` - Personal check
- `business` - Business check
- `cashier` - Cashier's check
- `certified` - Certified check
- `traveler` - Traveler's check
- `government` - Government check
- `payroll` - Payroll check
- `money_order` - Money order
- `other` - Other check type

#### Account Type
- `checking` - Checking account
- `savings` - Savings account
- `money_market` - Money market account
- `other` - Other account type

## Schema Definition

The schema is defined using JSON Schema Draft-07:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Check",
  "description": "Schema for check data extracted from images",
  "type": "object",
  "required": ["checkNumber", "date", "payee", "amount", "confidence"],
  "properties": {
    "checkNumber": {
      "type": "string",
      "description": "Check number or identifier"
    },
    "date": {
      "type": "string",
      "description": "Date on the check (preferably ISO 8601 format)"
    },
    "payee": {
      "type": "string",
      "description": "Person or entity to whom the check is payable"
    },
    "payer": {
      "type": "string",
      "description": "Person or entity who wrote/signed the check"
    },
    "amount": {
      "type": "number",
      "description": "Dollar amount of the check",
      "minimum": 0
    },
    "amountText": {
      "type": "string",
      "description": "Written text amount of the check"
    },
    "memo": {
      "type": "string",
      "description": "Memo or note on the check"
    },
    "bankName": {
      "type": "string",
      "description": "Name of the bank issuing the check"
    },
    "routingNumber": {
      "type": "string",
      "description": "Bank routing number (9 digits)",
      "pattern": "^\\d{9}$"
    },
    "accountNumber": {
      "type": "string",
      "description": "Bank account number"
    },
    "checkType": {
      "type": "string",
      "description": "Type of check (e.g., 'personal', 'business')",
      "enum": ["personal", "business", "cashier", "certified", "traveler", "government", "payroll", "money_order", "other"]
    },
    "accountType": {
      "type": "string",
      "description": "Type of account (e.g., 'checking', 'savings')",
      "enum": ["checking", "savings", "money_market", "other"]
    },
    "signature": {
      "type": "boolean",
      "description": "Whether the check appears to be signed"
    },
    "signatureText": {
      "type": "string",
      "description": "Text of the signature if readable"
    },
    "fractionalCode": {
      "type": "string",
      "description": "Fractional code on the check (alternative routing identifier)"
    },
    "micrLine": {
      "type": "string",
      "description": "Full MICR (Magnetic Ink Character Recognition) line on the bottom of check"
    },
    "confidence": {
      "type": "number",
      "description": "Overall confidence score (0-1)",
      "minimum": 0,
      "maximum": 1
    }
  }
}
```

## TypeScript Type Definitions

The schema is represented in TypeScript with the following interfaces and enums:

```typescript
export enum CheckType {
  Personal = 'personal',
  Business = 'business',
  Cashier = 'cashier',
  Certified = 'certified',
  Traveler = 'traveler',
  Government = 'government',
  Payroll = 'payroll',
  MoneyOrder = 'money_order',
  Other = 'other'
}

export enum BankAccountType {
  Checking = 'checking',
  Savings = 'savings',
  MoneyMarket = 'money_market',
  Other = 'other'
}

export interface Check {
  checkNumber: string;
  date: string;
  payee: string;
  payer?: string;
  amount: number;
  amountText?: string;
  memo?: string;
  bankName?: string;
  routingNumber?: string;
  accountNumber?: string;
  checkType?: CheckType;
  accountType?: BankAccountType;
  signature?: boolean;
  signatureText?: string;
  fractionalCode?: string;
  micrLine?: string;
  confidence: number;
}
```

## Usage Example

Here's an example of using the check schema to extract data from OCR text:

```javascript
import { checkSchema } from './src/json/schemas/check';
import { jsonExtractor } from './src/json/mistral';

// OCR text from check image
const ocrText = "Check #12345\nPay to: John Smith\nAmount: $1,234.56\nMemo: Services rendered";

// Extract structured data
const result = await jsonExtractor.extract({
  markdown: ocrText,
  schema: checkSchema
});

if (result[0] === 'ok') {
  const checkData = result[1].json;
  console.log('Extracted check data:', checkData);
  console.log('Confidence score:', result[1].confidence);
}
```

## Integration with Scanner

The [`CheckScanner`](../src/scanner/check-scanner.ts) class provides an end-to-end processing workflow:

```javascript
import { ScannerFactory } from './src/scanner/factory';
import { DocumentType } from './src/ocr/types';

// Create a check scanner
const scanner = ScannerFactory.createMistralCheckScanner(io, apiKey);

// Process a check image
const result = await scanner.processDocument({
  content: imageBuffer,
  type: DocumentType.Image,
  name: 'check.jpg'
});

if (result[0] === 'ok') {
  console.log('Extracted check data:', result[1].json);
  console.log('OCR confidence:', result[1].ocrConfidence);
  console.log('Extraction confidence:', result[1].extractionConfidence);
  console.log('Overall confidence:', result[1].overallConfidence);
}
```

## API Response Format

When processing a check through the API, the response will have the following format:

```json
{
  "data": {
    "checkNumber": "12345",
    "date": "2023-01-15",
    "payee": "John Smith",
    "payer": "Jane Doe",
    "amount": 1234.56,
    "memo": "Services rendered",
    "bankName": "First National Bank",
    "routingNumber": "123456789",
    "accountNumber": "9876543210",
    "checkType": "personal",
    "signature": true,
    "confidence": 0.95
  },
  "confidence": {
    "ocr": 0.98,
    "extraction": 0.92,
    "overall": 0.96
  }
}
```

## Complete Example JSON

For a comprehensive example of check OCR output, refer to the [check-ocr-response-example.json](../examples/check-ocr-response-example.json) file in the examples directory.
```