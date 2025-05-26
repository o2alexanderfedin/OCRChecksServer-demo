/**
 * Receipt Extractor
 * 
 * Processes OCR text to extract structured receipt data according to the receipt schema.
 */

import { Receipt } from '../schemas/receipt';
import { JsonExtractor, JsonSchema } from '../types';
import type { Result } from 'functionalscript/types/result/module.f.js';
import { ReceiptExtractor as IReceiptExtractor } from './types';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../types/di-types';

/**
 * Class for extracting receipt data from OCR text
 * Implements the ReceiptExtractor interface
 */
@injectable()
export class ReceiptExtractor implements IReceiptExtractor {
  private jsonExtractor: JsonExtractor;

  /**
   * Creates a new receipt extractor
   * 
   * @param jsonExtractor - The JSON extractor to use
   */
  constructor(
    @inject(TYPES.JsonExtractorProvider) jsonExtractor: JsonExtractor
  ) {
    this.jsonExtractor = jsonExtractor;
  }

  /**
   * Extracts receipt data from OCR text
   * 
   * @param ocrText - The OCR text from a receipt image
   * @returns A Result tuple with either an error or the extracted receipt data with confidence
   */
  async extractFromText(ocrText: string): Promise<Result<{ json: Receipt, confidence: number }, string>> {
    // Define the schema for extraction
    const receiptSchema: JsonSchema = {
      name: "Receipt",
      schemaDefinition: {
        type: "object",
        required: ["confidence"], // Only require confidence, allowing empty receipts
        properties: {
          isValidInput: { type: "boolean" }, // New field to indicate if input appears valid
          merchant: {
            type: "object",
            required: ["name"],
            properties: {
              name: { type: "string" },
              address: { type: "string" },
              phone: { type: "string" },
              website: { type: "string" },
              taxId: { type: "string" },
              storeId: { type: "string" },
              chainName: { type: "string" }
            }
          },
          receiptNumber: { type: "string" },
          receiptType: { 
            type: "string",
            enum: ["sale", "return", "refund", "estimate", "proforma", "other"]
          },
          timestamp: { type: "string", format: "date-time" },
          paymentMethod: {
            type: "string",
            enum: ["credit", "debit", "cash", "check", "gift_card", "store_credit", "mobile_payment", "other"]
          },
          totals: {
            type: "object",
            required: ["total"],
            properties: {
              subtotal: { type: "number", minimum: 0 },
              tax: { type: "number", minimum: 0 },
              tip: { type: "number", minimum: 0 },
              discount: { type: "number", minimum: 0 },
              total: { type: "number", minimum: 0 }
            }
          },
          currency: { type: "string", pattern: "^[A-Z]{3}$" },
          items: {
            type: "array",
            items: {
              type: "object",
              required: ["description", "totalPrice"],
              properties: {
                description: { type: "string" },
                sku: { type: "string" },
                quantity: { type: "number", minimum: 0 },
                unit: { type: "string", enum: ["ea", "kg", "g", "lb", "oz", "l", "ml", "gal", "pc", "pr", "pk", "box", "other"] },
                unitPrice: { type: "number", minimum: 0 },
                totalPrice: { type: "number", minimum: 0 },
                discounted: { type: "boolean" },
                discountAmount: { type: "number", minimum: 0 },
                category: { type: "string" }
              }
            }
          },
          taxes: {
            type: "array",
            items: {
              type: "object",
              required: ["taxName", "taxAmount"],
              properties: {
                taxName: { type: "string" },
                taxType: { type: "string", enum: ["sales", "vat", "gst", "pst", "hst", "excise", "service", "other"] },
                taxRate: { type: "number", minimum: 0, maximum: 1 },
                taxAmount: { type: "number", minimum: 0 }
              }
            }
          },
          payments: {
            type: "array",
            items: {
              type: "object",
              required: ["method", "amount"],
              properties: {
                method: { type: "string", enum: ["credit", "debit", "cash", "check", "gift_card", "store_credit", "mobile_payment", "other"] },
                cardType: { type: "string", enum: ["visa", "mastercard", "amex", "discover", "diners_club", "jcb", "union_pay", "other"] },
                lastDigits: { type: "string", pattern: "^\\d{4}$" },
                amount: { type: "number", minimum: 0 },
                transactionId: { type: "string" }
              }
            }
          },
          notes: {
            type: "array",
            items: { type: "string" }
          },
          metadata: {
            type: "object",
            properties: {
              confidenceScore: { type: "number", minimum: 0, maximum: 1 },
              currency: { type: "string", pattern: "^[A-Z]{3}$" },
              languageCode: { type: "string", pattern: "^[a-z]{2}(-[A-Z]{2})?$" },
              timeZone: { type: "string" },
              receiptFormat: { type: "string", enum: ["retail", "restaurant", "service", "utility", "transportation", "accommodation", "other"] },
              sourceImageId: { type: "string" },
              warnings: { type: "array", items: { type: "string" } }
            }
          },
          confidence: { type: "number", minimum: 0, maximum: 1 }
        }
      }
    };

    // Generate extraction prompt
    const extractionPrompt = this.generateExtractionPrompt(ocrText);

    // Extract JSON using the extractor
    const result = await this.jsonExtractor.extract({
      markdown: extractionPrompt,
      schema: receiptSchema
    });

    // Handle extraction result
    const [kind, value] = result;
    if (kind === 'error') {
      return ['error', value instanceof Error ? value.message : String(value)];
    }

    // Add overall confidence to the receipt and normalize
    const extractedData = value.json as unknown as Receipt;
    extractedData.confidence = value.confidence;
    
    // Normalize the receipt data
    const normalizedData = this.normalizeReceiptData(extractedData);

    return [
      'ok', 
      {
        json: normalizedData,
        confidence: value.confidence
      }
    ];
  }

  /**
   * Generates a prompt for extracting receipt data from OCR text
   * 
   * @param ocrText - The OCR text from a receipt image
   * @returns A prompt string for the AI model
   */
  private generateExtractionPrompt(ocrText: string): string {
    return `
# Receipt Data Extraction

Below is the text extracted from a receipt image using OCR. Please extract the relevant information into a structured JSON format.

## OCR Text:

${ocrText}

## Instructions:

Extract the following information:
- Merchant information (grouped under "merchant" object):
  - Name of store/merchant
  - Address
  - Phone number
  - Website (if present)
  - Store ID or branch number (if present)
  - Chain name (if applicable)
- Receipt number and date/time
- Items purchased with quantities, unit prices, and total prices
- Financial totals (grouped under "totals" object):
  - Subtotal (pre-tax amount)
  - Tax amount
  - Tip amount (if applicable)
  - Discount amount (if applicable)
  - Total amount (final amount paid)
- Payment method details
- Any other relevant information from the receipt

For numerical values, extract them as numbers without currency symbols.
For the date, convert it to ISO 8601 format (YYYY-MM-DDThh:mm:ssZ) if possible.
For the currency, use the standard 3-letter ISO currency code (e.g., USD, EUR, GBP).

IMPORTANT: 
- Extract only information that is clearly visible in the input
- Use null, empty strings, or 0 values for uncertain information
- Assign confidence scores proportional to clarity and completeness of the input
- Prioritize accuracy over completeness
- Set overall confidence below 0.5 if the input appears invalid or contains minimal information
`;
  }

  /**
   * Post-processes the extracted receipt data for additional validation and normalization
   * 
   * @param receipt - The extracted receipt data
   * @returns The normalized receipt data
   */
  private normalizeReceiptData(receipt: Receipt): Receipt {
    // Make a copy to avoid modifying the original
    const normalized = { ...receipt };
    
    // Detect potential hallucinations
    this.detectHallucinations(normalized);

    // Ensure currency is uppercase
    if (normalized.currency) {
      normalized.currency = normalized.currency.toUpperCase();
    }

    // Ensure timestamp is a Date object
    if (normalized.timestamp && !(normalized.timestamp instanceof Date)) {
      try {
        // Convert to Date object if it's not already
        const date = new Date(normalized.timestamp);
        if (!isNaN(date.getTime())) {
          normalized.timestamp = date;
        }
      } catch {
        // Keep original if conversion fails
      }
    }

    // Additional normalization logic can be added here

    return normalized;
  }
  
  /**
   * Detects potential hallucinations in the extracted receipt data
   * 
   * @param receipt - The receipt data to validate
   */
  private detectHallucinations(receipt: Receipt): void {
    // Common hallucinated values and suspicious patterns
    const suspiciousPatterns = {
      stores: ["Store", "Market", "Supermarket", "Shop"],
      totals: [0, 10, 15.99, 20, 25, 50, 100],
      currencies: ["USD", "EUR", "GBP"],
      itemCounts: [0, 1], // Having exactly 0 or 1 items is suspicious for hallucination
      emptyMerchant: true // Having an empty merchant name but other fields filled is suspicious
    };
    
    // Count suspicious matches
    let suspicionScore = 0;
    
    // Check for suspicious merchant name
    if (receipt.merchant && receipt.merchant.name) {
      if (suspiciousPatterns.stores.some(s => receipt.merchant?.name === s)) {
        suspicionScore++;
      }
    } else if (receipt.totals && receipt.totals.total > 0) {
      // Empty merchant name but has total - suspicious
      suspicionScore++;
    }
    
    // Check for suspicious total
    if (receipt.totals && suspiciousPatterns.totals.includes(receipt.totals.total)) {
      suspicionScore++;
    }
    
    // Check for suspicious currency
    if (receipt.currency && receipt.currency.length === 3 && !receipt.merchant?.name) {
      suspicionScore++;
    }
    
    // Check item count (0 or 1 items but with total is suspicious)
    if (receipt.items && receipt.items.length <= 1 && receipt.totals && receipt.totals.total > 0) {
      suspicionScore++;
    }
    
    // If input data is minimal but results are rich, that's suspicious
    const hasRichOutput = receipt.merchant?.name || (receipt.totals && receipt.totals.total > 0);
    const hasMinimalInput = !receipt.merchant?.address && !receipt.merchant?.phone && !receipt.items?.length;
    if (hasRichOutput && hasMinimalInput) {
      suspicionScore++;
    }
    
    // If multiple suspicious patterns match, likely hallucination
    if (suspicionScore >= 2) {
      // Mark as invalid input
      receipt.isValidInput = false;
      
      // Reduce confidence significantly
      receipt.confidence = Math.min(receipt.confidence || 0, 0.3);
      
      console.log(`Potential hallucination detected in receipt data (suspicion score: ${suspicionScore})`);
    } else {
      // Mark as valid unless explicitly set otherwise
      receipt.isValidInput = receipt.isValidInput !== false;
    }
  }
}