/**
 * Receipt Extractor
 * 
 * Processes OCR text to extract structured receipt data according to the receipt schema.
 */

import { Receipt } from './schemas/receipt';
import { MistralJsonExtractorProvider } from './mistral';
import { JsonExtractorProvider, SchemaDefinition, extractResult } from './types';

/**
 * Class for extracting receipt data from OCR text
 */
export class ReceiptExtractor {
  private jsonExtractor: JsonExtractorProvider;

  /**
   * Creates a new receipt extractor
   * 
   * @param jsonExtractor - The JSON extractor provider to use
   */
  constructor(jsonExtractor: JsonExtractorProvider) {
    this.jsonExtractor = jsonExtractor;
  }

  /**
   * Extracts receipt data from OCR text
   * 
   * @param ocrText - The OCR text from a receipt image
   * @returns A tuple with either an error or the extracted receipt data with confidence
   */
  async extractFromText(ocrText: string): Promise<extractResult<Receipt>> {
    // Define the schema for extraction
    const receiptSchema: SchemaDefinition = {
      name: "Receipt",
      schemaDefinition: {
        type: "object",
        required: ["merchant", "timestamp", "totalAmount", "currency"],
        properties: {
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
          timestamp: { type: "string", format: "date-time" },
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
          currency: { type: "string" },
          items: {
            type: "array",
            items: {
              type: "object",
              required: ["description", "totalPrice"],
              properties: {
                description: { type: "string" },
                quantity: { type: "number" },
                unit: { type: "string" },
                unitPrice: { type: "number" },
                totalPrice: { type: "number" }
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
                taxRate: { type: "number" },
                taxAmount: { type: "number" }
              }
            }
          },
          payments: {
            type: "array",
            items: {
              type: "object",
              required: ["method", "amount"],
              properties: {
                method: { type: "string" },
                cardType: { type: "string" },
                lastDigits: { type: "string" },
                amount: { type: "number" }
              }
            }
          }
        }
      }
    };

    // Generate extraction prompt
    const extractionPrompt = this.generateExtractionPrompt(ocrText);

    // Extract JSON using the provider
    const result = await this.jsonExtractor.extract({
      markdown: extractionPrompt,
      schema: receiptSchema
    });

    // Handle extraction result
    if (result[0] === 'error') {
      return result;
    }

    // Add overall confidence to the receipt
    const extractedData = result[1].json as Receipt;
    extractedData.confidence = result[1].confidence;

    return ['ok', {
      json: extractedData,
      confidence: result[1].confidence
    }];
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

If any information is not present or cannot be confidently extracted, omit those fields.
Provide confidence levels for the extracted data where appropriate.
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

    // Ensure currency is uppercase
    if (normalized.currency) {
      normalized.currency = normalized.currency.toUpperCase();
    }

    // Normalize timestamp if provided but not in ISO format
    if (normalized.timestamp && !normalized.timestamp.includes('T')) {
      try {
        // Simple attempt to convert to ISO format if it's a valid date
        const date = new Date(normalized.timestamp);
        if (!isNaN(date.getTime())) {
          normalized.timestamp = date.toISOString();
        }
      } catch (e) {
        // Keep original if conversion fails
      }
    }

    // Additional normalization logic can be added here

    return normalized;
  }
}