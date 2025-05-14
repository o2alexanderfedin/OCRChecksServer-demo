/**
 * OpenAPI specification as a JavaScript object
 * This is the embedded version of the openapi.yaml file
 * 
 * Note: The version field will be dynamically replaced with the package version
 */
const openApiSpec = {
  "openapi": "3.0.3",
  "info": {
    "title": "OCR Checks Server API",
    "description": "API for processing images of paper checks and receipts using OCR and extracting structured data.\n\nThis API accepts image uploads (JPEG, PNG) and returns structured JSON data with extracted information.\n\nThe API offers both dedicated endpoints for specific document types and a universal processing endpoint.",
    "version": "1.0.0",
    "license": {
      "name": "AGPL-3.0-or-later",
      "url": "https://www.gnu.org/licenses/agpl-3.0.html"
    },
    "contact": {
      "name": "Nolock.social",
      "url": "https://nolock.social",
      "email": "sales@o2.services"
    }
  },
  "servers": [
    {
      "url": "https://api.nolock.social",
      "description": "Production server"
    },
    {
      "url": "https://dev-api.nolock.social",
      "description": "Development server"
    },
    {
      "url": "http://localhost:8787",
      "description": "Local development server"
    }
  ],
  "tags": [
    {
      "name": "processing",
      "description": "Document processing endpoints"
    },
    {
      "name": "health",
      "description": "Server status and health endpoints"
    }
  ],
  "paths": {
    "/process": {
      "post": {
        "tags": [
          "processing"
        ],
        "summary": "Universal document processing endpoint",
        "description": "Process an image as either a check or receipt based on the type parameter.\nThis flexible endpoint allows you to specify the document type at runtime.",
        "operationId": "processDocument",
        "parameters": [
          {
            "name": "type",
            "in": "query",
            "description": "Type of document to process",
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "check",
                "receipt"
              ],
              "default": "receipt"
            }
          },
          {
            "name": "format",
            "in": "query",
            "description": "Format of the document",
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "image",
                "pdf"
              ],
              "default": "image"
            }
          },
          {
            "name": "filename",
            "in": "query",
            "description": "Optional filename for the uploaded document",
            "required": false,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "image/*": {
              "schema": {
                "type": "string",
                "format": "binary"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Successful document processing",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "data",
                    "documentType",
                    "confidence"
                  ],
                  "properties": {
                    "data": {
                      "oneOf": [
                        {
                          "$ref": "#/components/schemas/Check"
                        },
                        {
                          "$ref": "#/components/schemas/Receipt"
                        }
                      ],
                      "description": "Extracted document data"
                    },
                    "documentType": {
                      "type": "string",
                      "enum": [
                        "check",
                        "receipt"
                      ],
                      "description": "Type of document processed"
                    },
                    "confidence": {
                      "$ref": "#/components/schemas/Confidence"
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Invalid input",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "500": {
            "description": "Internal server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        }
      }
    },
    "/check": {
      "post": {
        "tags": [
          "processing"
        ],
        "summary": "Check-specific processing endpoint",
        "description": "Process an image specifically as a check. This dedicated endpoint\nis optimized for check processing.",
        "operationId": "processCheck",
        "parameters": [
          {
            "name": "format",
            "in": "query",
            "description": "Format of the document",
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "image",
                "pdf"
              ],
              "default": "image"
            }
          },
          {
            "name": "filename",
            "in": "query",
            "description": "Optional filename for the uploaded document",
            "required": false,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "image/*": {
              "schema": {
                "type": "string",
                "format": "binary"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Successful check processing",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "data",
                    "confidence"
                  ],
                  "properties": {
                    "data": {
                      "$ref": "#/components/schemas/Check"
                    },
                    "confidence": {
                      "$ref": "#/components/schemas/Confidence"
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Invalid input",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "500": {
            "description": "Internal server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        }
      }
    },
    "/receipt": {
      "post": {
        "tags": [
          "processing"
        ],
        "summary": "Receipt-specific processing endpoint",
        "description": "Process an image specifically as a receipt. This dedicated endpoint\nis optimized for receipt processing.",
        "operationId": "processReceipt",
        "parameters": [
          {
            "name": "format",
            "in": "query",
            "description": "Format of the document",
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "image",
                "pdf"
              ],
              "default": "image"
            }
          },
          {
            "name": "filename",
            "in": "query",
            "description": "Optional filename for the uploaded document",
            "required": false,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "image/*": {
              "schema": {
                "type": "string",
                "format": "binary"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Successful receipt processing",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "data",
                    "confidence"
                  ],
                  "properties": {
                    "data": {
                      "$ref": "#/components/schemas/Receipt"
                    },
                    "confidence": {
                      "$ref": "#/components/schemas/Confidence"
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Invalid input",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "500": {
            "description": "Internal server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        }
      }
    },
    "/health": {
      "get": {
        "tags": [
          "health"
        ],
        "summary": "Health check endpoint",
        "description": "Get the server's health status and version information. Use this endpoint\nto confirm the service is running and to check the current version.",
        "operationId": "getHealth",
        "responses": {
          "200": {
            "description": "Server health information",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "status",
                    "timestamp",
                    "version"
                  ],
                  "properties": {
                    "status": {
                      "type": "string",
                      "enum": [
                        "ok"
                      ],
                      "description": "Server status"
                    },
                    "timestamp": {
                      "type": "string",
                      "format": "date-time",
                      "description": "Current server time"
                    },
                    "version": {
                      "type": "string",
                      "description": "Server version"
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "Error": {
        "type": "object",
        "required": [
          "error"
        ],
        "properties": {
          "error": {
            "type": "string",
            "description": "Error message"
          }
        }
      },
      "Confidence": {
        "type": "object",
        "required": [
          "ocr",
          "extraction",
          "overall"
        ],
        "properties": {
          "ocr": {
            "type": "number",
            "minimum": 0,
            "maximum": 1,
            "description": "Confidence score for the OCR process (0-1)"
          },
          "extraction": {
            "type": "number",
            "minimum": 0,
            "maximum": 1,
            "description": "Confidence score for the data extraction (0-1)"
          },
          "overall": {
            "type": "number",
            "minimum": 0,
            "maximum": 1,
            "description": "Overall confidence score (0-1)"
          }
        }
      },
      "CheckType": {
        "type": "string",
        "description": "Type of check",
        "enum": [
          "personal",
          "business",
          "cashier",
          "certified",
          "traveler",
          "government",
          "payroll",
          "money_order",
          "other"
        ]
      },
      "BankAccountType": {
        "type": "string",
        "description": "Type of bank account",
        "enum": [
          "checking",
          "savings",
          "money_market",
          "other"
        ]
      },
      "CheckMetadata": {
        "type": "object",
        "required": [
          "confidenceScore"
        ],
        "properties": {
          "confidenceScore": {
            "type": "number",
            "minimum": 0,
            "maximum": 1,
            "description": "Overall confidence of extraction (0-1)"
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
      "Check": {
        "type": "object",
        "required": [
          "checkNumber",
          "date",
          "payee",
          "amount",
          "confidence"
        ],
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
            "type": "string",
            "pattern": "^\\d+(\\.\\d{1,2})?$",
            "description": "Dollar amount of the check as a string to preserve exact decimal representation"
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
            "pattern": "^\\d{9}$",
            "description": "Bank routing number (9 digits)"
          },
          "accountNumber": {
            "type": "string",
            "description": "Bank account number"
          },
          "checkType": {
            "$ref": "#/components/schemas/CheckType"
          },
          "accountType": {
            "$ref": "#/components/schemas/BankAccountType"
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
            "$ref": "#/components/schemas/CheckMetadata"
          },
          "confidence": {
            "type": "number",
            "minimum": 0,
            "maximum": 1,
            "description": "Overall confidence score (0-1)"
          }
        }
      },
      "ReceiptType": {
        "type": "string",
        "description": "Type of receipt",
        "enum": [
          "sale",
          "return",
          "refund",
          "estimate",
          "proforma",
          "other"
        ]
      },
      "PaymentMethod": {
        "type": "string",
        "description": "Method of payment",
        "enum": [
          "credit",
          "debit",
          "cash",
          "check",
          "gift_card",
          "store_credit",
          "mobile_payment",
          "other"
        ]
      },
      "CardType": {
        "type": "string",
        "description": "Type of payment card",
        "enum": [
          "visa",
          "mastercard",
          "amex",
          "discover",
          "diners_club",
          "jcb",
          "union_pay",
          "other"
        ]
      },
      "TaxType": {
        "type": "string",
        "description": "Type of tax",
        "enum": [
          "sales",
          "vat",
          "gst",
          "pst",
          "hst",
          "excise",
          "service",
          "other"
        ]
      },
      "ReceiptFormat": {
        "type": "string",
        "description": "Format type of receipt",
        "enum": [
          "retail",
          "restaurant",
          "service",
          "utility",
          "transportation",
          "accommodation",
          "other"
        ]
      },
      "UnitOfMeasure": {
        "type": "string",
        "description": "Unit of measurement",
        "enum": [
          "ea",
          "kg",
          "g",
          "lb",
          "oz",
          "l",
          "ml",
          "gal",
          "pc",
          "pr",
          "pk",
          "box",
          "other"
        ]
      },
      "MerchantInfo": {
        "type": "object",
        "required": [
          "name"
        ],
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
      "ReceiptTotals": {
        "type": "object",
        "required": [
          "total"
        ],
        "properties": {
          "subtotal": {
            "type": "string",
            "pattern": "^\\d+(\\.\\d{1,2})?$",
            "description": "Pre-tax total amount as a string to preserve exact decimal representation"
          },
          "tax": {
            "type": "string",
            "pattern": "^\\d+(\\.\\d{1,2})?$",
            "description": "Total tax amount as a string to preserve exact decimal representation"
          },
          "tip": {
            "type": "string",
            "pattern": "^\\d+(\\.\\d{1,2})?$",
            "description": "Tip/gratuity amount as a string to preserve exact decimal representation"
          },
          "discount": {
            "type": "string",
            "pattern": "^\\d+(\\.\\d{1,2})?$",
            "description": "Total discount amount as a string to preserve exact decimal representation"
          },
          "total": {
            "type": "string",
            "pattern": "^\\d+(\\.\\d{1,2})?$",
            "description": "Final total amount including tax, tip, and adjusting for discounts as a string to preserve exact decimal representation"
          }
        }
      },
      "ReceiptLineItem": {
        "type": "object",
        "required": [
          "description",
          "totalPrice"
        ],
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
            "minimum": 0,
            "description": "Quantity purchased"
          },
          "unit": {
            "oneOf": [
              {
                "$ref": "#/components/schemas/UnitOfMeasure"
              },
              {
                "type": "string"
              }
            ],
            "description": "Unit of measurement"
          },
          "unitPrice": {
            "type": "string",
            "pattern": "^\\d+(\\.\\d{1,2})?$",
            "description": "Price per unit as a string to preserve exact decimal representation"
          },
          "totalPrice": {
            "type": "string",
            "pattern": "^\\d+(\\.\\d{1,2})?$",
            "description": "Total price for this line item as a string to preserve exact decimal representation"
          },
          "discounted": {
            "type": "boolean",
            "description": "Whether the item was discounted"
          },
          "discountAmount": {
            "type": "string",
            "pattern": "^\\d+(\\.\\d{1,2})?$",
            "description": "Amount of discount applied as a string to preserve exact decimal representation"
          },
          "category": {
            "type": "string",
            "description": "Product category"
          }
        }
      },
      "ReceiptTaxItem": {
        "type": "object",
        "required": [
          "taxName",
          "taxAmount"
        ],
        "properties": {
          "taxName": {
            "type": "string",
            "description": "Name of tax (e.g., 'VAT', 'GST', 'Sales Tax')"
          },
          "taxType": {
            "oneOf": [
              {
                "$ref": "#/components/schemas/TaxType"
              },
              {
                "type": "string"
              }
            ],
            "description": "Type of tax"
          },
          "taxRate": {
            "type": "string",
            "pattern": "^0?\\.(\\d{1,2})$",
            "description": "Tax rate as string representation of decimal (e.g., \"0.1\" for 10%)"
          },
          "taxAmount": {
            "type": "string",
            "pattern": "^\\d+(\\.\\d{1,2})?$",
            "description": "Tax amount as a string to preserve exact decimal representation"
          }
        }
      },
      "ReceiptPaymentMethod": {
        "type": "object",
        "required": [
          "method",
          "amount"
        ],
        "properties": {
          "method": {
            "$ref": "#/components/schemas/PaymentMethod"
          },
          "cardType": {
            "oneOf": [
              {
                "$ref": "#/components/schemas/CardType"
              },
              {
                "type": "string"
              }
            ],
            "description": "Type of card"
          },
          "lastDigits": {
            "type": "string",
            "pattern": "^\\d{4}$",
            "description": "Last 4 digits of payment card"
          },
          "amount": {
            "type": "string",
            "pattern": "^\\d+(\\.\\d{1,2})?$",
            "description": "Amount paid with this method as a string to preserve exact decimal representation"
          },
          "transactionId": {
            "type": "string",
            "description": "Payment transaction ID"
          }
        }
      },
      "ReceiptMetadata": {
        "type": "object",
        "required": [
          "confidenceScore"
        ],
        "properties": {
          "confidenceScore": {
            "type": "number",
            "minimum": 0,
            "maximum": 1,
            "description": "Overall confidence of extraction (0-1)"
          },
          "currency": {
            "type": "string",
            "pattern": "^[A-Z]{3}$",
            "description": "ISO currency code detected"
          },
          "languageCode": {
            "type": "string",
            "pattern": "^[a-z]{2}(-[A-Z]{2})?$",
            "description": "ISO language code of the receipt"
          },
          "timeZone": {
            "type": "string",
            "description": "Time zone identifier"
          },
          "receiptFormat": {
            "$ref": "#/components/schemas/ReceiptFormat"
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
      "Receipt": {
        "type": "object",
        "required": [
          "merchant",
          "timestamp",
          "totals",
          "currency",
          "confidence"
        ],
        "properties": {
          "merchant": {
            "$ref": "#/components/schemas/MerchantInfo"
          },
          "receiptNumber": {
            "type": "string",
            "description": "Receipt or invoice number"
          },
          "receiptType": {
            "$ref": "#/components/schemas/ReceiptType"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time",
            "description": "Date and time of transaction (ISO 8601 format)"
          },
          "paymentMethod": {
            "oneOf": [
              {
                "$ref": "#/components/schemas/PaymentMethod"
              },
              {
                "type": "string"
              }
            ],
            "description": "Method of payment"
          },
          "totals": {
            "$ref": "#/components/schemas/ReceiptTotals"
          },
          "currency": {
            "type": "string",
            "pattern": "^[A-Z]{3}$",
            "description": "3-letter ISO currency code"
          },
          "items": {
            "type": "array",
            "description": "List of line items on the receipt",
            "items": {
              "$ref": "#/components/schemas/ReceiptLineItem"
            }
          },
          "taxes": {
            "type": "array",
            "description": "Breakdown of taxes",
            "items": {
              "$ref": "#/components/schemas/ReceiptTaxItem"
            }
          },
          "payments": {
            "type": "array",
            "description": "Details about payment methods used",
            "items": {
              "$ref": "#/components/schemas/ReceiptPaymentMethod"
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
            "$ref": "#/components/schemas/ReceiptMetadata"
          },
          "confidence": {
            "type": "number",
            "minimum": 0,
            "maximum": 1,
            "description": "Overall confidence score (0-1)"
          }
        }
      }
    }
  }
};

export default openApiSpec;