/**
 * JSON Schema for check data extraction
 * 
 * This schema defines the structure for check data extracted from images
 * using OCR and structured data extraction.
 */

export const checkSchema = {
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
    "metadata": {
      "type": "object",
      "description": "Additional information about the extraction",
      "properties": {
        "confidenceScore": {
          "type": "number",
          "description": "Overall confidence of extraction (0-1)",
          "minimum": 0,
          "maximum": 1
        },
        "sourceImageId": {
          "type": "string",
          "description": "Reference to the source image"
        },
        "ocrProvider": {
          "type": "string",
          "description": "Provider used for OCR"
        },
        "warnings": {
          "type": "array",
          "description": "List of warning messages",
          "items": {
            "type": "string"
          }
        }
      }
    },
    "confidence": {
      "type": "number",
      "description": "Overall confidence score (0-1)",
      "minimum": 0,
      "maximum": 1
    }
  }
};

// Enum definitions for TypeScript
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

// Type definitions for TypeScript
export interface CheckMetadata {
  confidenceScore: number;
  sourceImageId?: string;
  ocrProvider?: string;
  warnings?: string[];
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
  metadata?: CheckMetadata;
  confidence: number;
}

export default checkSchema;