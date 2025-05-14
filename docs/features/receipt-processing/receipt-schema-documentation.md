# Receipt Schema Documentation

This document provides detailed information about the Receipt Schema used for structured data extraction from receipt images.

## Overview

The Receipt Schema defines the structure and validation rules for data extracted from retail, restaurant, and service receipts. It enables consistent extraction of important receipt information including merchant details, transaction timestamps, line items, totals, taxes, and payment methods.

## Schema Definition

The receipt schema is implemented in TypeScript and follows the JSON Schema Draft-07 specification.

### Required Properties

The following properties are required for all valid receipt data:

- `merchant`: Information about the merchant (with required `name` property)
- `timestamp`: Date and time of the transaction
- `totals`: Financial totals (with required `total` property)
- `confidence`: Overall confidence score of the extraction

Note: The `currency` field is optional as of v1.25.0.

### Complete Schema Structure

```typescript
// Base interface with common receipt properties
interface ReceiptBase {
  merchant: MerchantInfo;
  receiptNumber?: string;
  receiptType?: ReceiptType;
  timestamp: string;
  paymentMethod?: PaymentMethod | string;
}

// Full Receipt interface extending the base
interface Receipt extends ReceiptBase {
  totals: ReceiptTotals;
  currency?: string;  // Optional as of v1.25.0
  items?: ReceiptLineItem[];
  taxes?: ReceiptTaxItem[];
  payments?: ReceiptPaymentMethod[];
  notes?: string[];
  metadata?: ReceiptMetadata;
  confidence: number;
}
```

## Component Types

### Merchant Information

```typescript
interface MerchantInfo {
  name: string;              // Required
  address?: string;
  phone?: string;
  website?: string;
  taxId?: string;
  storeId?: string;
  chainName?: string;
}
```

### Receipt Type

The `receiptType` property uses an enumeration of valid receipt types:

```typescript
enum ReceiptType {
  Sale = 'sale',
  Return = 'return',
  Refund = 'refund',
  Estimate = 'estimate',
  Proforma = 'proforma',
  Other = 'other'
}
```

### Financial Totals

```typescript
interface ReceiptTotals {
  subtotal?: number;         // Pre-tax amount
  tax?: number;              // Total tax amount
  tip?: number;              // Gratuity amount
  discount?: number;         // Discount amount
  total: number;             // Required - Final total amount
}
```

### Line Items

Each item on the receipt can be represented as:

```typescript
interface ReceiptLineItem {
  description: string;       // Required
  sku?: string;              // Stock keeping unit
  quantity?: number;
  unit?: UnitOfMeasure | string;
  unitPrice?: number;
  totalPrice: number;        // Required
  discounted?: boolean;
  discountAmount?: number;
  category?: string;
}
```

Units of measure are standardized through an enumeration:

```typescript
enum UnitOfMeasure {
  Each = 'ea',
  Kilogram = 'kg',
  Gram = 'g',
  Pound = 'lb',
  Ounce = 'oz',
  Liter = 'l',
  Milliliter = 'ml',
  Gallon = 'gal',
  Piece = 'pc',
  Pair = 'pr',
  Pack = 'pk',
  Box = 'box',
  Other = 'other'
}
```

### Tax Information

```typescript
interface ReceiptTaxItem {
  taxName: string;           // Required
  taxType?: TaxType | string;
  taxRate?: number;          // 0-1 (e.g., 0.1 for 10%)
  taxAmount: number;         // Required
}
```

Tax types are standardized through an enumeration:

```typescript
enum TaxType {
  Sales = 'sales',
  VAT = 'vat',
  GST = 'gst',
  PST = 'pst',
  HST = 'hst',
  Excise = 'excise',
  Service = 'service',
  Other = 'other'
}
```

### Payment Methods

```typescript
interface ReceiptPaymentMethod {
  method: PaymentMethod;     // Required
  cardType?: CardType | string;
  lastDigits?: string;       // Last 4 digits of payment card
  amount: number;            // Required
  transactionId?: string;
}
```

Payment methods are standardized through an enumeration:

```typescript
enum PaymentMethod {
  Credit = 'credit',
  Debit = 'debit',
  Cash = 'cash',
  Check = 'check',
  GiftCard = 'gift_card',
  StoreCredit = 'store_credit',
  MobilePayment = 'mobile_payment',
  Other = 'other'
}
```

Card types are also standardized:

```typescript
enum CardType {
  Visa = 'visa',
  Mastercard = 'mastercard',
  Amex = 'amex',
  Discover = 'discover',
  DinersClub = 'diners_club',
  JCB = 'jcb',
  UnionPay = 'union_pay',
  Other = 'other'
}
```

### Metadata

```typescript
interface ReceiptMetadata {
  confidenceScore: number;   // Required
  currency?: string;
  languageCode?: string;     // ISO language code
  timeZone?: string;
  receiptFormat?: ReceiptFormat;
  sourceImageId?: string;
  warnings?: string[];
}
```

Receipt formats are standardized:

```typescript
enum ReceiptFormat {
  Retail = 'retail',
  Restaurant = 'restaurant',
  Service = 'service',
  Utility = 'utility',
  Transportation = 'transportation',
  Accommodation = 'accommodation',
  Other = 'other'
}
```

## Validation Rules

The schema enforces the following validation rules:

- All numerical amounts must be non-negative
- Currency codes must be uppercase, 3-letter ISO codes (e.g., USD, EUR)
- Confidence scores must be between 0 and 1
- Timestamps should be in ISO 8601 format
- Tax rates must be between 0 and 1 (representing 0% to 100%)
- Card last digits must be exactly 4 digits

## Usage Example

```typescript
import { receiptSchema, Receipt } from '../src/json/schemas/receipt';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

// Create a validator
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validate = ajv.compile(receiptSchema);

// Example receipt data
const receiptData: Receipt = {
  merchant: {
    name: "Grocery Store",
    address: "123 Main St, Anytown, USA"
  },
  timestamp: "2025-04-15T14:30:00Z",
  totals: {
    subtotal: 42.97,
    tax: 3.44,
    total: 46.41
  },
  currency: "USD", // Optional, but recommended
  confidence: 0.92
};

// Validate the data
const isValid = validate(receiptData);

if (\!isValid) {
  console.log(validate.errors);
} else {
  console.log("Receipt data is valid");
}
```

## Integration with OCR and Extraction

The Receipt Schema is integrated into the overall document processing flow:

1. OCR extracts text from receipt images
2. The JSON extractor uses the schema to guide AI-based structured data extraction
3. The extracted data is validated against the schema
4. Any normalization or post-processing is applied
5. The final validated receipt data is returned to the client

This schema-driven approach ensures consistent, reliable extraction of receipt data across different receipt formats and layouts.

## Complete Example JSON

For a comprehensive example of receipt OCR output, refer to the [receipt-ocr-response-example.json](../examples/receipt-ocr-response-example.json) file in the examples directory.