/**
 * Check Extractor
 * 
 * Processes OCR text to extract structured check data according to the check schema.
 */

import { Check, BankAccountType, CheckType } from '../schemas/check';
import { JsonExtractor, JsonSchema } from '../types';
import type { Result } from 'functionalscript/types/result/module.f.js';
import { CheckExtractor as ICheckExtractor } from './types';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../types/di-types';

/**
 * Class for extracting check data from OCR text
 * Implements the CheckExtractor interface
 */
@injectable()
export class CheckExtractor implements ICheckExtractor {
  private jsonExtractor: JsonExtractor;

  /**
   * Creates a new check extractor
   * 
   * @param jsonExtractor - The JSON extractor to use
   */
  constructor(
    @inject(TYPES.JsonExtractorProvider) jsonExtractor: JsonExtractor
  ) {
    this.jsonExtractor = jsonExtractor;
  }

  /**
   * Extracts check data from OCR text
   * 
   * @param ocrText - The OCR text from a check image
   * @returns A Result tuple with either an error or the extracted check data with confidence
   */
  async extractFromText(ocrText: string): Promise<Result<{ json: Check, confidence: number }, string>> {
    // Define the schema for extraction
    const checkSchema: JsonSchema = {
      name: "Check",
      schemaDefinition: {
        type: "object",
        required: ["confidence"], // Only require confidence, allowing empty checks
        properties: {
          isValidInput: { type: "boolean" }, // New field to indicate if input appears valid
          checkNumber: { type: "string" },
          date: { type: "string" },
          payee: { type: "string" },
          payer: { type: "string" },
          amount: { type: "number", minimum: 0 },
          amountText: { type: "string" },
          memo: { type: "string" },
          bankName: { type: "string" },
          routingNumber: { type: "string", pattern: "^\\d{9}$" },
          accountNumber: { type: "string" },
          checkType: { 
            type: "string",
            enum: ["personal", "business", "cashier", "certified", "traveler", "government", "payroll", "money_order", "other"]
          },
          accountType: { 
            type: "string",
            enum: ["checking", "savings", "money_market", "other"]
          },
          signature: { type: "boolean" },
          signatureText: { type: "string" },
          fractionalCode: { type: "string" },
          micrLine: { type: "string" },
          confidence: { type: "number", minimum: 0, maximum: 1 }
        }
      }
    };

    // Generate extraction prompt
    const extractionPrompt = this.generateExtractionPrompt(ocrText);

    // Extract JSON using the extractor
    const result = await this.jsonExtractor.extract({
      markdown: extractionPrompt,
      schema: checkSchema
    });

    // Handle extraction result
    const [kind, value] = result;
    if (kind === 'error') {
      return ['error', value instanceof Error ? value.message : String(value)];
    }

    // Add overall confidence to the check and normalize
    const extractedData = value.json as unknown as Check;
    extractedData.confidence = value.confidence;
    
    // Normalize the check data
    const normalizedData = this.normalizeCheckData(extractedData);

    // Process MICR line if available (extract routing, account, check number)
    this.processMicrLine(normalizedData);

    return [
      'ok', 
      {
        json: normalizedData,
        confidence: value.confidence
      }
    ];
  }

  /**
   * Generates a prompt for extracting check data from OCR text
   * 
   * @param ocrText - The OCR text from a check image
   * @returns A prompt string for the AI model
   */
  private generateExtractionPrompt(ocrText: string): string {
    return `
# Check Data Extraction

Below is the text extracted from a check image using OCR. Please extract the relevant information into a structured JSON format.

## OCR Text:

${ocrText}

## Instructions:

Extract the following information:
- Check number
- Date on the check
- Payee (the person or entity to whom the check is payable)
- Payer (the person or entity who wrote the check, if available)
- Amount (numerical value)
- Amount in words (if available)
- Memo/note line content (if available)
- Bank name (if available)
- Routing number (9 digits, if available)
- Account number (if available)
- Type of check (personal, business, etc.)
- Type of account (checking, savings, etc.)
- Whether the check appears to be signed
- The MICR line at the bottom of the check (if available)

For numerical values, extract them as numbers without currency symbols.
For the date, convert it to ISO 8601 format (YYYY-MM-DD) if possible.
Extract the routing number as a 9-digit string.

IMPORTANT: 
- Extract only information that is clearly visible in the input
- Use null, empty strings, or 0 values for uncertain information
- Assign confidence scores proportional to clarity and completeness of the input
- Prioritize accuracy over completeness
- Set overall confidence below 0.5 if the input appears invalid or contains minimal information
`;
  }

  /**
   * Post-processes the extracted check data for additional validation and normalization
   * 
   * @param check - The extracted check data
   * @returns The normalized check data
   */
  private normalizeCheckData(check: Check): Check {
    // Make a copy to avoid modifying the original
    const normalized = { ...check };
    
    // Note: Hallucination detection is now handled by the scanner layer for better separation of concerns

    // Ensure date is a Date object
    if (normalized.date && !(normalized.date instanceof Date)) {
      try {
        // Convert to Date object if it's not already
        const date = new Date(normalized.date);
        if (!isNaN(date.getTime())) {
          normalized.date = date;
        }
      } catch {
        // Keep original if conversion fails
      }
    }

    // Normalize routing number - remove leading zeros if more than 9 digits
    if (normalized.routingNumber && normalized.routingNumber.length > 9) {
      normalized.routingNumber = normalized.routingNumber.replace(/^0+/, '');
      if (normalized.routingNumber.length > 9) {
        normalized.routingNumber = normalized.routingNumber.substring(0, 9);
      }
    }

    // Normalize account type to enum if string is provided
    if (normalized.accountType && typeof normalized.accountType === 'string') {
      const accountType = normalized.accountType.toLowerCase();
      switch (accountType) {
        case 'checking':
          normalized.accountType = BankAccountType.Checking;
          break;
        case 'savings':
          normalized.accountType = BankAccountType.Savings;
          break;
        case 'money market':
        case 'money_market':
          normalized.accountType = BankAccountType.MoneyMarket;
          break;
        default:
          normalized.accountType = BankAccountType.Other;
      }
    }

    // Normalize check type to enum if string is provided
    if (normalized.checkType && typeof normalized.checkType === 'string') {
      const checkType = normalized.checkType.toLowerCase();
      switch (checkType) {
        case 'personal':
          normalized.checkType = CheckType.Personal;
          break;
        case 'business':
          normalized.checkType = CheckType.Business;
          break;
        case 'cashier':
          normalized.checkType = CheckType.Cashier;
          break;
        case 'certified':
          normalized.checkType = CheckType.Certified;
          break;
        case 'traveler':
          normalized.checkType = CheckType.Traveler;
          break;
        case 'government':
          normalized.checkType = CheckType.Government;
          break;
        case 'payroll':
          normalized.checkType = CheckType.Payroll;
          break;
        case 'money order':
        case 'money_order':
          normalized.checkType = CheckType.MoneyOrder;
          break;
        default:
          normalized.checkType = CheckType.Other;
      }
    }

    return normalized;
  }

  /**
   * Process MICR line to extract additional information
   * 
   * @param check - The check data to update
   */
  private processMicrLine(check: Check): void {
    if (!check.micrLine) {
      return;
    }

    // Extract routing number if not already present
    if (!check.routingNumber) {
      const routingMatch = check.micrLine.match(/⑆(\d{9})⑆/);
      if (routingMatch && routingMatch[1]) {
        check.routingNumber = routingMatch[1];
      }
    }

    // Extract account number if not already present
    if (!check.accountNumber) {
      const accountMatch = check.micrLine.match(/⑈(\d+)⑈/);
      if (accountMatch && accountMatch[1]) {
        check.accountNumber = accountMatch[1];
      }
    }

    // Extract check number if not already present
    if (!check.checkNumber) {
      const checkNumberMatch = check.micrLine.match(/⑇(\d+)⑇/);
      if (checkNumberMatch && checkNumberMatch[1]) {
        check.checkNumber = checkNumberMatch[1];
      }
    }
  }
}