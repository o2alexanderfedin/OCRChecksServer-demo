/**
 * Legacy adapter file for backward compatibility
 * Implements the original ReceiptExtractor class by wrapping the new MistralReceiptExtractor
 */

import { MistralReceiptExtractor } from './extractors/receipt-extractor';
import { JsonExtractor } from './types';
import type { Result } from 'functionalscript/types/result/module.f.js';
import { Receipt } from './schemas/receipt';

/**
 * @deprecated Use MistralReceiptExtractor from './extractors/receipt-extractor' instead
 */
export class ReceiptExtractor {
  private implementation: MistralReceiptExtractor;

  /**
   * Creates a new receipt extractor
   * 
   * @param jsonExtractor - The JSON extractor to use
   */
  constructor(jsonExtractor: JsonExtractor) {
    this.implementation = new MistralReceiptExtractor(jsonExtractor);
  }

  /**
   * Extracts receipt data from OCR text
   * 
   * @param ocrText - The OCR text from a receipt image
   * @returns A Result tuple with either an error or the extracted receipt data with confidence
   */
  async extractFromText(ocrText: string): Promise<['ok', { json: Receipt, confidence: number }] | ['error', string]> {
    return this.implementation.extractFromText(ocrText);
  }
}