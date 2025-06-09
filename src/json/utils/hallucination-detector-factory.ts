/**
 * HallucinationDetectorFactory - Factory for creating appropriate hallucination detectors
 * 
 * This factory follows SOLID principles by providing a centralized way to obtain
 * the correct detector implementation based on document type, supporting the
 * Open/Closed Principle for adding new detector types.
 */

import { injectable, inject } from 'inversify';
import { TYPES } from '../../types/di-types';
import { HallucinationDetector, DocumentTypeDetector } from './hallucination-detector';
import { CheckHallucinationDetector } from './check-hallucination-detector';
import { ReceiptHallucinationDetector } from './receipt-hallucination-detector';
import { Check } from '../schemas/check';
import { Receipt } from '../schemas/receipt';

/**
 * Factory service for creating appropriate hallucination detectors
 * Implements the Factory Pattern to provide the correct detector based on document type
 */
@injectable()
export class HallucinationDetectorFactory {
  
  constructor(
    @inject(TYPES.CheckHallucinationDetector) private checkDetector: CheckHallucinationDetector,
    @inject(TYPES.ReceiptHallucinationDetector) private receiptDetector: ReceiptHallucinationDetector
  ) {}

  /**
   * Gets the appropriate detector for the given data
   * 
   * @param data - The extracted data to analyze
   * @returns HallucinationDetector - The appropriate detector implementation
   */
  getDetectorForData(data: any): HallucinationDetector<any> | null {
    const documentType = DocumentTypeDetector.getDocumentType(data);
    
    switch (documentType) {
      case 'check':
        return this.checkDetector;
      case 'receipt':
        return this.receiptDetector;
      default:
        console.warn(`Unknown document type detected, skipping hallucination detection`);
        return null;
    }
  }

  /**
   * Detects hallucinations in the provided data using the appropriate detector
   * 
   * @param data - The extracted data to validate
   */
  detectHallucinations(data: any): void {
    const detector = this.getDetectorForData(data);
    
    if (detector) {
      detector.detect(data);
    } else {
      console.warn('No appropriate hallucination detector found for data');
    }
  }

  /**
   * Gets a check-specific detector
   * 
   * @returns CheckHallucinationDetector
   */
  getCheckDetector(): HallucinationDetector<Check> {
    return this.checkDetector;
  }

  /**
   * Gets a receipt-specific detector
   * 
   * @returns ReceiptHallucinationDetector
   */
  getReceiptDetector(): HallucinationDetector<Receipt> {
    return this.receiptDetector;
  }
}