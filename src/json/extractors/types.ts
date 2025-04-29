import type { Result } from 'functionalscript/types/result/module.f.js';
import type { Receipt } from '../schemas/receipt';

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