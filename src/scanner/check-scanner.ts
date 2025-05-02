import { OCRProvider, Document, OCRResult } from '../ocr/types';
import { DocumentScanner, ProcessingResult } from './types';
import type { Result } from 'functionalscript/types/result/module.f.js';
import { CheckExtractor as ICheckExtractor } from '../json/extractors/types';

/**
 * CheckScanner - Encapsulates OCR and JSON extraction in a single process for check documents
 * Follows Single Responsibility Principle by delegating OCR and extraction to specialized components
 * Follows Open/Closed Principle by allowing different implementations of OCR and extractors
 * Follows Liskov Substitution Principle by using interfaces
 * Follows Interface Segregation by using minimal interfaces
 * Follows Dependency Inversion by depending on abstractions
 */
export class CheckScanner implements DocumentScanner {
  private ocrProvider: OCRProvider;
  private checkExtractor: ICheckExtractor;

  /**
   * Creates a new CheckScanner
   * 
   * @param ocrProvider - The OCR provider to use
   * @param checkExtractor - The check extractor to use
   */
  constructor(
    ocrProvider: OCRProvider,
    checkExtractor: ICheckExtractor
  ) {
    this.ocrProvider = ocrProvider;
    this.checkExtractor = checkExtractor;
  }

  /**
   * Process a document through OCR and JSON extraction
   * 
   * @param document - The document to process
   * @returns A Result tuple with either a processing result or error message
   */
  async processDocument(document: Document): Promise<Result<ProcessingResult, string>> {
    // Step 1: Perform OCR on the document
    const ocrResult = await this.ocrProvider.processDocuments([document]);
    if (ocrResult[0] === 'error') {
      return ['error', `OCR processing failed: ${ocrResult[1].message}`];
    }

    // The OCR result is an array of results for each page/image
    // For simplicity, we'll use the first result if available
    if (!ocrResult[1][0] || ocrResult[1][0].length === 0) {
      return ['error', 'OCR processing returned empty results'];
    }
    
    const ocrData = ocrResult[1][0][0]; // First document, first result
    const ocrText = ocrData.text;
    const ocrConfidence = ocrData.confidence;

    // Step 2: Extract structured data from OCR text
    const extractionResult = await this.checkExtractor.extractFromText(ocrText);
    if (extractionResult[0] === 'error') {
      return ['error', `Data extraction failed: ${extractionResult[1]}`];
    }

    const extractedData = extractionResult[1];
    const extractionConfidence = extractedData.confidence;

    // Step 3: Calculate overall confidence
    const overallConfidence = this.calculateOverallConfidence(ocrConfidence, extractionConfidence);

    // Return combined result
    return ['ok', {
      json: extractedData.json,
      ocrConfidence,
      extractionConfidence,
      overallConfidence,
      rawText: ocrText
    }];
  }

  /**
   * Process multiple documents in batch
   * 
   * @param documents - Array of documents to process
   * @returns A Result tuple with either array of processing results or error message
   */
  async processDocuments(documents: Document[]): Promise<Result<ProcessingResult[], string>> {
    const results: ProcessingResult[] = [];
    let hasError = false;
    let errorMessage = "";

    // Process each document individually
    // This could be optimized for batch processing in the future
    for (const document of documents) {
      const result = await this.processDocument(document);
      if (result[0] === 'error') {
        hasError = true;
        errorMessage = result[1];
        break;
      }
      results.push(result[1]);
    }

    if (hasError) {
      return ['error', errorMessage];
    }

    return ['ok', results];
  }

  /**
   * Calculate overall confidence based on OCR and extraction confidence
   * 
   * @param ocrConfidence - OCR confidence score (0-1)
   * @param extractionConfidence - Extraction confidence score (0-1)
   * @returns Overall confidence score (0-1)
   */
  private calculateOverallConfidence(ocrConfidence: number, extractionConfidence: number): number {
    // Weight OCR confidence slightly higher (60%) than extraction confidence (40%)
    // This can be adjusted based on empirical data
    const weightedConfidence = (ocrConfidence * 0.6) + (extractionConfidence * 0.4);
    
    // Round to 2 decimal places
    return Math.round(weightedConfidence * 100) / 100;
  }
}