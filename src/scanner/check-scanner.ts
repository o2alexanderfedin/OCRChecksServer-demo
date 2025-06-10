import { OCRProvider, Document } from '../ocr/types';
import { DocumentScanner, ProcessingResult } from './types';
import type { Result } from 'functionalscript/types/result/module.f.js';
import { CheckExtractor as ICheckExtractor } from '../json/extractors/types';
import { injectable, inject, named } from 'inversify';
import { TYPES as VALIDATOR_TYPES, IScannerInputValidator, ScannerInput } from '../validators';
import { TYPES } from '../types/di-types';
import { CheckHallucinationDetector } from '../json/utils/check-hallucination-detector';

/**
 * CheckScanner - Encapsulates OCR and JSON extraction in a single process for check documents
 * Follows Single Responsibility Principle by delegating OCR and extraction to specialized components
 * Follows Open/Closed Principle by allowing different implementations of OCR and extractors
 * Follows Liskov Substitution Principle by using interfaces
 * Follows Interface Segregation by using minimal interfaces
 * Follows Dependency Inversion by depending on abstractions
 */
@injectable()
export class CheckScanner implements DocumentScanner {
  private ocrProvider: OCRProvider;
  private checkExtractor: ICheckExtractor;
  private inputValidator: IScannerInputValidator;
  private hallucinationDetector: CheckHallucinationDetector;

  /**
   * Creates a new CheckScanner
   * 
   * @param ocrProvider - The OCR provider to use
   * @param checkExtractor - The check extractor to use
   * @param inputValidator - Validator for scanner inputs
   */
  constructor(
    @inject(TYPES.OCRProvider) ocrProvider: OCRProvider,
    @inject(TYPES.CheckExtractor) checkExtractor: ICheckExtractor,
    @inject(VALIDATOR_TYPES.ScannerInputValidator) @named('check') inputValidator: IScannerInputValidator,
    @inject(TYPES.CheckHallucinationDetector) hallucinationDetector: CheckHallucinationDetector
  ) {
    this.ocrProvider = ocrProvider;
    this.checkExtractor = checkExtractor;
    this.inputValidator = inputValidator;
    this.hallucinationDetector = hallucinationDetector;
  }

  /**
   * Process a document through OCR and JSON extraction
   * 
   * @param document - The document to process
   * @returns A Result tuple with either a processing result or error message
   */
  async processDocument(document: Document): Promise<Result<ProcessingResult, string>> {
    const scannerRequestId = `scanner_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const scannerStartTime = Date.now();
    
    console.log(`[${scannerRequestId}] ===== CHECK SCANNER PROCESSING START =====`);
    console.log(`[${scannerRequestId}] Scanner started at: ${new Date().toISOString()}`);
    console.log(`[${scannerRequestId}] Document type: ${document.type}, name: ${document.name}`);
    console.log(`[${scannerRequestId}] Document content size: ${document.content.byteLength} bytes`);
    
    let ocrText: string;
    let ocrConfidence: number;
    
    try {
      console.log(`[${scannerRequestId}] Step 1: Validating input document`);
      // Validate input document
      const validatedInput: ScannerInput = this.inputValidator.assertValid({
        file: document.content,
        mimeType: document.mimeType,
        options: document.options
      });
      console.log(`[${scannerRequestId}] Input validation successful`);
      
      console.log(`[${scannerRequestId}] Step 2: Starting OCR processing - POTENTIAL HANG POINT`);
      console.log(`[${scannerRequestId}] About to call ocrProvider.processDocuments() at ${new Date().toISOString()}`);
      
      // Step 1: Perform OCR on the document
      const ocrResult = await this.ocrProvider.processDocuments([{
        ...document,
        content: validatedInput.file,
        mimeType: validatedInput.mimeType || document.mimeType,
        options: validatedInput.options || document.options
      }]);
      
      console.log(`[${scannerRequestId}] Step 3: OCR processing completed`);
      console.log(`[${scannerRequestId}] OCR result type: ${ocrResult[0]}`);
      console.log(`[${scannerRequestId}] Time since scanner start: ${Date.now() - scannerStartTime}ms`);
      
      if (ocrResult[0] === 'error') {
        console.log(`[${scannerRequestId}] OCR ERROR: ${ocrResult[1].message}`);
        return ['error', `OCR processing failed: ${ocrResult[1].message}`];
      }

      console.log(`[${scannerRequestId}] Step 4: Processing OCR results`);
      // The OCR result is an array of results for each page/image
      // For simplicity, we'll use the first result if available
      if (!ocrResult[1][0] || ocrResult[1][0].length === 0) {
        console.log(`[${scannerRequestId}] OCR ERROR: Empty results`);
        return ['error', 'OCR processing returned empty results'];
      }
      
      const ocrData = ocrResult[1][0][0]; // First document, first result
      ocrText = ocrData.text;
      ocrConfidence = ocrData.confidence;
      console.log(`[${scannerRequestId}] OCR text length: ${ocrText.length} characters`);
      console.log(`[${scannerRequestId}] OCR confidence: ${ocrConfidence}`);
      console.log(`[${scannerRequestId}] OCR text sample: ${ocrText.substring(0, 100)}...`);
    } catch (error) {
      console.log(`[${scannerRequestId}] VALIDATION ERROR: ${error}`);
      // Handle validation errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      return ['error', `Validation failed: ${errorMessage}`];
    }

    console.log(`[${scannerRequestId}] Step 5: Starting JSON extraction - POTENTIAL HANG POINT`);
    console.log(`[${scannerRequestId}] About to call checkExtractor.extractFromText() at ${new Date().toISOString()}`);
    
    // Step 2: Extract structured data from OCR text
    const extractionResult = await this.checkExtractor.extractFromText(ocrText);
    
    console.log(`[${scannerRequestId}] Step 6: JSON extraction completed`);
    console.log(`[${scannerRequestId}] Extraction result type: ${extractionResult[0]}`);
    console.log(`[${scannerRequestId}] Time since scanner start: ${Date.now() - scannerStartTime}ms`);
    
    if (extractionResult[0] === 'error') {
      console.log(`[${scannerRequestId}] EXTRACTION ERROR: ${extractionResult[1]}`);
      return ['error', `Data extraction failed: ${extractionResult[1]}`];
    }

    const extractedData = extractionResult[1];
    console.log(`[${scannerRequestId}] Extracted data keys: ${Object.keys(extractedData.json || {}).join(', ')}`);

    console.log(`[${scannerRequestId}] Step 7: Starting hallucination detection`);
    // Step 3: Apply check-specific hallucination detection
    this.hallucinationDetector.detect(extractedData.json);

    // Step 4: Calculate overall confidence using potentially updated confidence
    const finalExtractionConfidence = extractedData.json.confidence || extractedData.confidence;
    const overallConfidence = this.calculateOverallConfidence(ocrConfidence, finalExtractionConfidence);

    // Return combined result
    return ['ok', {
      json: extractedData.json,
      ocrConfidence,
      extractionConfidence: finalExtractionConfidence,
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