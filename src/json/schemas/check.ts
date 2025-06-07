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
  "required": ["confidence"],
  "properties": {
    "isValidInput": {
      "type": "boolean",
      "description": "Indicates if the input appears to be a valid check image"
    },
    "checkNumber": {
      "type": "string",
      "description": "Check number or identifier"
    },
    "date": {
      "type": "string",
      "format": "date-time",
      "description": "Date on the check (ISO 8601 format)"
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
      "type": "string",
      "description": "Dollar amount of the check as a string to preserve exact decimal representation",
      "pattern": "^\\d+(\\.\\d{1,2})?$"
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
  checkNumber?: string;
  /**
   * Date on the check
   * 
   * @type Date object representing the check date
   * Transmitted as ISO 8601 formatted string in the JSON schema
   */
  date?: Date | string;
  payee?: string;
  payer?: string;
  /**
   * Dollar amount of the check
   * 
   * @type Monetary value as a string to preserve exact decimal representation
   * Format should be numerical with optional decimal point (e.g., "1250.00")
   * Default currency is USD unless specified otherwise
   */
  amount?: string;
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
  /**
   * Indicates if the input appears to be a valid check image
   * False if the system has detected potential hallucinations
   */
  isValidInput?: boolean;
}

export default checkSchema;