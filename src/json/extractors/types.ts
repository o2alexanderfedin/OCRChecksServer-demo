import type { Result } from 'functionalscript/types/result/module.f.js';
import type { Receipt } from '../schemas/receipt';
import type { Check } from '../schemas/check';

/**
 * Interface for receipt data extractors
 * Follows the Interface Segregation Principle with a focused interface
 */
export interface ReceiptExtractor {
  /**
   * Extract structured receipt data from OCR text
   * @param ocrText - OCR text from a receipt image
   * @returns Promise of Result tuple with either extracted receipt data or error message
   */
  extractFromText(ocrText: string): Promise<Result<{ 
    /** Structured receipt data */
    json: Receipt, 
    /** Confidence score of the extraction (0-1) */
    confidence: number 
  }, string>>;
}

/**
 * Interface for check data extractors
 * Follows the Interface Segregation Principle with a focused interface
 */
export interface CheckExtractor {
  /**
   * Extract structured check data from OCR text
   * @param ocrText - OCR text from a check image
   * @returns Promise of Result tuple with either extracted check data or error message
   */
  extractFromText(ocrText: string): Promise<Result<{ 
    /** Structured check data */
    json: Check, 
    /** Confidence score of the extraction (0-1) */
    confidence: number 
  }, string>>;
}