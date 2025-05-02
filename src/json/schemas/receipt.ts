/**
 * JSON Schema for receipt data extraction
 * 
 * This schema defines the structure for receipt data extracted from images
 * using OCR and structured data extraction.
 */

export const receiptSchema = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Receipt",
  "description": "Schema for receipt data extracted from images",
  "type": "object",
  "required": ["merchant", "timestamp", "totals", "confidence"],
  "properties": {
    "merchant": {
      "type": "object",
      "required": ["name"],
      "description": "Information about the merchant",
      "properties": {
        "name": {
          "type": "string",
          "description": "Name of the merchant or store"
        },
        "address": {
          "type": "string",
          "description": "Physical address of the merchant"
        },
        "phone": {
          "type": "string",
          "description": "Contact phone number"
        },
        "website": {
          "type": "string",
          "format": "uri",
          "description": "Website URL"
        },
        "taxId": {
          "type": "string",
          "description": "Tax identification number (VAT/GST ID)"
        },
        "storeId": {
          "type": "string",
          "description": "Store or branch identifier"
        },
        "chainName": {
          "type": "string",
          "description": "Name of the store chain if applicable"
        }
      }
    },
    "receiptNumber": {
      "type": "string",
      "description": "Receipt or invoice number"
    },
    "receiptType": {
      "type": "string",
      "description": "Type of receipt (e.g., 'sale', 'return', 'refund')",
      "enum": ["sale", "return", "refund", "estimate", "proforma", "other"]
    },
    "timestamp": {
      "type": "string",
      "format": "date-time",
      "description": "Date and time of transaction (ISO 8601 format)"
    },
    "paymentMethod": {
      "type": "string",
      "description": "Method of payment (e.g., 'cash', 'credit', 'debit')"
    },
    "totals": {
      "type": "object",
      "required": ["total"],
      "description": "Financial totals from the receipt",
      "properties": {
        "subtotal": {
          "type": "number",
          "description": "Pre-tax total amount",
          "minimum": 0
        },
        "tax": {
          "type": "number",
          "description": "Total tax amount",
          "minimum": 0
        },
        "tip": {
          "type": "number",
          "description": "Tip/gratuity amount",
          "minimum": 0
        },
        "discount": {
          "type": "number",
          "description": "Total discount amount",
          "minimum": 0
        },
        "total": {
          "type": "number",
          "description": "Final total amount including tax, tip, and adjusting for discounts",
          "minimum": 0
        }
      }
    },
    "currency": {
      "type": "string",
      "description": "3-letter ISO currency code",
      "pattern": "^[A-Z]{3}$"
    },
    "items": {
      "type": "array",
      "description": "List of line items on the receipt",
      "items": {
        "type": "object",
        "required": ["description", "totalPrice"],
        "properties": {
          "description": {
            "type": "string",
            "description": "Item description or name"
          },
          "sku": {
            "type": "string",
            "description": "Stock keeping unit or product code"
          },
          "quantity": {
            "type": "number",
            "description": "Quantity purchased",
            "minimum": 0
          },
          "unit": {
            "type": "string",
            "description": "Unit of measurement (e.g., 'ea', 'kg')"
          },
          "unitPrice": {
            "type": "number",
            "description": "Price per unit",
            "minimum": 0
          },
          "totalPrice": {
            "type": "number",
            "description": "Total price for this line item",
            "minimum": 0
          },
          "discounted": {
            "type": "boolean",
            "description": "Whether the item was discounted"
          },
          "discountAmount": {
            "type": "number",
            "description": "Amount of discount applied",
            "minimum": 0
          },
          "category": {
            "type": "string",
            "description": "Product category"
          }
        }
      }
    },
    "taxes": {
      "type": "array",
      "description": "Breakdown of taxes",
      "items": {
        "type": "object",
        "required": ["taxName", "taxAmount"],
        "properties": {
          "taxName": {
            "type": "string",
            "description": "Name of tax (e.g., 'VAT', 'GST', 'Sales Tax')"
          },
          "taxType": {
            "type": "string",
            "description": "Type of tax"
          },
          "taxRate": {
            "type": "number",
            "description": "Tax rate as decimal (e.g., 0.1 for 10%)",
            "minimum": 0,
            "maximum": 1
          },
          "taxAmount": {
            "type": "number",
            "description": "Tax amount",
            "minimum": 0
          }
        }
      }
    },
    "payments": {
      "type": "array",
      "description": "Details about payment methods used",
      "items": {
        "type": "object",
        "required": ["method", "amount"],
        "properties": {
          "method": {
            "type": "string",
            "description": "Payment method (e.g., 'credit', 'cash')",
            "enum": ["credit", "debit", "cash", "check", "gift_card", "store_credit", "mobile_payment", "other"]
          },
          "cardType": {
            "type": "string",
            "description": "Type of card (e.g., 'Visa', 'Mastercard')"
          },
          "lastDigits": {
            "type": "string",
            "description": "Last 4 digits of payment card",
            "pattern": "^\\d{4}$"
          },
          "amount": {
            "type": "number",
            "description": "Amount paid with this method",
            "minimum": 0
          },
          "transactionId": {
            "type": "string",
            "description": "Payment transaction ID"
          }
        }
      }
    },
    "notes": {
      "type": "array",
      "description": "Additional notes or comments",
      "items": {
        "type": "string"
      }
    },
    "metadata": {
      "type": "object",
      "description": "Additional information about the extraction",
      "required": ["confidenceScore"],
      "properties": {
        "confidenceScore": {
          "type": "number",
          "description": "Overall confidence of extraction (0-1)",
          "minimum": 0,
          "maximum": 1
        },
        "currency": {
          "type": "string",
          "description": "ISO currency code detected",
          "pattern": "^[A-Z]{3}$"
        },
        "languageCode": {
          "type": "string",
          "description": "ISO language code of the receipt",
          "pattern": "^[a-z]{2}(-[A-Z]{2})?$"
        },
        "timeZone": {
          "type": "string",
          "description": "Time zone identifier"
        },
        "receiptFormat": {
          "type": "string",
          "description": "Format type (e.g., 'retail', 'restaurant')",
          "enum": ["retail", "restaurant", "service", "utility", "transportation", "accommodation", "other"]
        },
        "sourceImageId": {
          "type": "string",
          "description": "Reference to the source image"
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
export enum ReceiptType {
  Sale = 'sale',
  Return = 'return',
  Refund = 'refund',
  Estimate = 'estimate',
  Proforma = 'proforma',
  Other = 'other'
}

export enum PaymentMethod {
  Credit = 'credit',
  Debit = 'debit',
  Cash = 'cash',
  Check = 'check',
  GiftCard = 'gift_card',
  StoreCredit = 'store_credit',
  MobilePayment = 'mobile_payment',
  Other = 'other'
}

export enum CardType {
  Visa = 'visa',
  Mastercard = 'mastercard',
  Amex = 'amex',
  Discover = 'discover',
  DinersClub = 'diners_club',
  JCB = 'jcb',
  UnionPay = 'union_pay',
  Other = 'other'
}

export enum TaxType {
  Sales = 'sales',
  VAT = 'vat',
  GST = 'gst',
  PST = 'pst',
  HST = 'hst',
  Excise = 'excise',
  Service = 'service',
  Other = 'other'
}

export enum ReceiptFormat {
  Retail = 'retail',
  Restaurant = 'restaurant',
  Service = 'service',
  Utility = 'utility',
  Transportation = 'transportation',
  Accommodation = 'accommodation',
  Other = 'other'
}

export enum UnitOfMeasure {
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

// Type definitions for TypeScript
export interface ReceiptLineItem {
  description: string;
  sku?: string;
  quantity?: number;
  unit?: UnitOfMeasure | string;
  unitPrice?: number;
  totalPrice: number;
  discounted?: boolean;
  discountAmount?: number;
  category?: string;
}

export interface ReceiptTaxItem {
  taxName: string;
  taxType?: TaxType | string;
  taxRate?: number;
  taxAmount: number;
}

export interface ReceiptPaymentMethod {
  method: PaymentMethod;
  cardType?: CardType | string;
  lastDigits?: string;
  amount: number;
  transactionId?: string;
}

export interface ReceiptMetadata {
  confidenceScore: number;
  currency?: string;
  languageCode?: string;
  timeZone?: string;
  receiptFormat?: ReceiptFormat;
  sourceImageId?: string;
  warnings?: string[];
}

export interface MerchantInfo {
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  taxId?: string;
  storeId?: string;
  chainName?: string;
}

export interface ReceiptTotals {
  subtotal?: number;
  tax?: number;
  tip?: number;
  discount?: number;
  total: number;
}

export interface ReceiptBase {
  merchant: MerchantInfo;
  receiptNumber?: string;
  receiptType?: ReceiptType;
  timestamp: string;
  paymentMethod?: PaymentMethod | string;
}

export interface Receipt {
  merchant: MerchantInfo;
  receiptNumber?: string;
  receiptType?: ReceiptType;
  timestamp: string;
  paymentMethod?: PaymentMethod | string;
  totals: ReceiptTotals;
  currency?: string;
  items?: ReceiptLineItem[];
  taxes?: ReceiptTaxItem[];
  payments?: ReceiptPaymentMethod[];
  notes?: string[];
  metadata?: ReceiptMetadata;
  confidence: number;
}

export default receiptSchema;