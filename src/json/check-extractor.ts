/**
 * Legacy adapter file for backward compatibility
 * DO NOT USE THIS CLASS DIRECTLY - IT WILL BE REMOVED IN A FUTURE VERSION
 * 
 * MIGRATION INSTRUCTIONS:
 * Replace:
 *   import { CheckExtractor } from '../json/check-extractor';
 * With:
 *   import { CheckExtractor } from '../json/extractors/check-extractor';
 * 
 * The new implementation provides identical functionality but with readonly Result tuples.
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
    
    // Print a deprecation warning when this class is instantiated
    console.warn(
      'WARNING: CheckExtractor from "src/json/check-extractor.ts" is deprecated.\n' +
      'Use CheckExtractor from "src/json/extractors/check-extractor.ts" instead.\n' +
      'This adapter will be removed in a future version.'
    );
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