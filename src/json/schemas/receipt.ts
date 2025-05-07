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
          "type": "string",
          "description": "Pre-tax total amount as a string to preserve exact decimal representation",
          "pattern": "^\\d+(\\.\\d{1,2})?$"
        },
        "tax": {
          "type": "string",
          "description": "Total tax amount as a string to preserve exact decimal representation",
          "pattern": "^\\d+(\\.\\d{1,2})?$"
        },
        "tip": {
          "type": "string",
          "description": "Tip/gratuity amount as a string to preserve exact decimal representation",
          "pattern": "^\\d+(\\.\\d{1,2})?$"
        },
        "discount": {
          "type": "string",
          "description": "Total discount amount as a string to preserve exact decimal representation",
          "pattern": "^\\d+(\\.\\d{1,2})?$"
        },
        "total": {
          "type": "string",
          "description": "Final total amount including tax, tip, and adjusting for discounts as a string to preserve exact decimal representation",
          "pattern": "^\\d+(\\.\\d{1,2})?$"
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
            "type": "string",
            "description": "Price per unit as a string to preserve exact decimal representation",
            "pattern": "^\\d+(\\.\\d{1,2})?$"
          },
          "totalPrice": {
            "type": "string",
            "description": "Total price for this line item as a string to preserve exact decimal representation",
            "pattern": "^\\d+(\\.\\d{1,2})?$"
          },
          "discounted": {
            "type": "boolean",
            "description": "Whether the item was discounted"
          },
          "discountAmount": {
            "type": "string",
            "description": "Amount of discount applied as a string to preserve exact decimal representation",
            "pattern": "^\\d+(\\.\\d{1,2})?$"
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
            "type": "string",
            "description": "Tax rate as string representation of decimal (e.g., '0.1' for 10%)",
            "pattern": "^0?\\.(\\d{1,2})$"
          },
          "taxAmount": {
            "type": "string",
            "description": "Tax amount as a string to preserve exact decimal representation",
            "pattern": "^\\d+(\\.\\d{1,2})?$"
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
            "type": "string",
            "description": "Amount paid with this method as a string to preserve exact decimal representation",
            "pattern": "^\\d+(\\.\\d{1,2})?$"
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
  /**
   * Price per unit
   * 
   * @type Monetary value as a string to preserve exact decimal representation
   */
  unitPrice?: string;
  /**
   * Total price for this line item
   * 
   * @type Monetary value as a string to preserve exact decimal representation
   */
  totalPrice: string;
  discounted?: boolean;
  /**
   * Amount of discount applied
   * 
   * @type Monetary value as a string to preserve exact decimal representation
   */
  discountAmount?: string;
  category?: string;
}

export interface ReceiptTaxItem {
  taxName: string;
  taxType?: TaxType | string;
  /**
   * Tax rate as a decimal
   * 
   * @type String representation of percentage (e.g., "0.07" for 7%)
   */
  taxRate?: string;
  /**
   * Tax amount
   * 
   * @type Monetary value as a string to preserve exact decimal representation
   */
  taxAmount?: string;
}

export interface ReceiptPaymentMethod {
  method: PaymentMethod;
  cardType?: CardType | string;
  lastDigits?: string;
  /**
   * Amount paid with this method
   * 
   * @type Monetary value as a string to preserve exact decimal representation
   */
  amount: string;
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
  /**
   * Pre-tax total amount
   * 
   * @type Monetary value as a string to preserve exact decimal representation
   * Format should be numerical with optional decimal point (e.g., "86.42")
   */
  subtotal?: string;
  
  /**
   * Total tax amount
   * 
   * @type Monetary value as a string to preserve exact decimal representation
   */
  tax?: string;
  
  /**
   * Tip/gratuity amount
   * 
   * @type Monetary value as a string to preserve exact decimal representation
   */
  tip?: string;
  
  /**
   * Total discount amount
   * 
   * @type Monetary value as a string to preserve exact decimal representation
   */
  discount?: string;
  
  /**
   * Final total amount including tax, tip, and adjusting for discounts
   * 
   * @type Monetary value as a string to preserve exact decimal representation
   * Required field
   */
  total: string;
}

export interface ReceiptBase {
  merchant: MerchantInfo;
  receiptNumber?: string;
  receiptType?: ReceiptType;
  /**
   * Date and time of transaction
   * 
   * @type Date object representing the transaction timestamp
   * Transmitted as ISO 8601 formatted string in the JSON schema
   */
  timestamp: Date;
  paymentMethod?: PaymentMethod | string;
}

export interface Receipt extends ReceiptBase {
  totals: ReceiptTotals;
  /**
   * ISO 4217 currency code (3-letter codes like USD, EUR, GBP)
   */
  currency?: string;
  items?: ReceiptLineItem[];
  taxes?: ReceiptTaxItem[];
  payments?: ReceiptPaymentMethod[];
  notes?: string[];
  metadata?: ReceiptMetadata;
  confidence: number;
}

export default receiptSchema;