/**
 * Legacy adapter file for backward compatibility
 * Implements the original ReceiptExtractor class by wrapping the new ReceiptExtractor
 */

import { ReceiptExtractor as ExtractorImplementation } from './extractors/receipt-extractor';
import { JsonExtractor } from './types';
import type { Result } from 'functionalscript/types/result/module.f.js';
import { Receipt } from './schemas/receipt';

// Define mutable versions of the Result type for compatibility with legacy code
type MutableResult<T, E> = ['ok', T] | ['error', E];

/**
 * @deprecated Use ReceiptExtractor from './extractors/receipt-extractor' instead
 */
export class ReceiptExtractor {
  private implementation: ExtractorImplementation;

  /**
   * Creates a new receipt extractor
   * 
   * @param jsonExtractor - The JSON extractor to use
   */
  constructor(jsonExtractor: JsonExtractor) {
    this.implementation = new ExtractorImplementation(jsonExtractor);
  }

  /**
   * Extracts receipt data from OCR text
   * 
   * @param ocrText - The OCR text from a receipt image
   * @returns A Result tuple with either an error or the extracted receipt data with confidence
   */
  async extractFromText(ocrText: string): Promise<MutableResult<{ json: Receipt, confidence: number }, string>> {
    const result = await this.implementation.extractFromText(ocrText);
    
    // Convert from readonly to mutable tuple
    const [kind, value] = result;
    if (kind === 'ok') {
      return ['ok', value];
    } else {
      return ['error', value];
    }
  }
}