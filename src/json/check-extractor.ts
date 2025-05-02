/**
 * Legacy adapter file for backward compatibility
 * Implements the original CheckExtractor class by wrapping the new CheckExtractor
 */

import { CheckExtractor as ExtractorImplementation } from './extractors/check-extractor';
import { JsonExtractor } from './types';
import type { Result } from 'functionalscript/types/result/module.f.js';
import { Check } from './schemas/check';

// Define mutable versions of the Result type for compatibility with legacy code
type MutableResult<T, E> = ['ok', T] | ['error', E];

/**
 * @deprecated Use CheckExtractor from './extractors/check-extractor' instead
 */
export class CheckExtractor {
  private implementation: ExtractorImplementation;

  /**
   * Creates a new check extractor
   * 
   * @param jsonExtractor - The JSON extractor to use
   */
  constructor(jsonExtractor: JsonExtractor) {
    this.implementation = new ExtractorImplementation(jsonExtractor);
  }

  /**
   * Extracts check data from OCR text
   * 
   * @param ocrText - The OCR text from a check image
   * @returns A Result tuple with either an error or the extracted check data with confidence
   */
  async extractFromText(ocrText: string): Promise<MutableResult<{ json: Check, confidence: number }, string>> {
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