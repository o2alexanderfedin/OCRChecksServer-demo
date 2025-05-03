import type { Document } from '../ocr/types';
import type { Result } from 'functionalscript/types/result/module.f.js';
import type { Receipt } from '../json/schemas/receipt';

/**
 * Result of the unified processing
 */
export type ProcessingResult = {
  /** Extracted JSON data */
  json: Receipt | Record<string, unknown>;
  /** Confidence score of OCR (0-1) */
  ocrConfidence: number;
  /** Confidence score of extraction (0-1) */
  extractionConfidence: number;
  /** Overall confidence score (0-1) */
  overallConfidence: number;
  /** Raw OCR text */
  rawText?: string;
};

/**
 * Interface for document scanners
 */
export interface DocumentScanner {
  /**
   * Process a document and extract structured data
   * @param document Document to process
   * @returns Result with either ProcessingResult or error message
   */
  processDocument(document: Document): Promise<Result<ProcessingResult, string>>;
  
  /**
   * Process multiple documents in batch
   * @param documents Array of documents to process
   * @returns Result with array of ProcessingResults or error message
   */
  processDocuments(documents: Document[]): Promise<Result<ProcessingResult[], string>>;
}