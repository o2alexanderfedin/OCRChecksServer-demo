import { ReceiptScanner } from '../../../src/scanner/receipt-scanner';
import 'reflect-metadata';
import { OCRProvider, Document, DocumentType, OCRResult } from '../../../src/ocr/types';
import { JsonExtractor, JsonExtractionRequest } from '../../../src/json/types';
import { ReceiptExtractor as IReceiptExtractor } from '../../../src/json/extractors/types';
import { ReceiptExtractor } from '../../../src/json/extractors/receipt-extractor';
import { HallucinationDetectorFactory } from '../../../src/json/utils/hallucination-detector-factory';
import { CheckHallucinationDetector } from '../../../src/json/utils/check-hallucination-detector';
import { ReceiptHallucinationDetector } from '../../../src/json/utils/receipt-hallucination-detector';
import type { Result } from 'functionalscript/types/result/module.f.js';
import { IScannerInputValidator, ScannerInput } from '../../../src/validators';

// Mock implementations
class MockOCRProvider implements OCRProvider {
  async processDocuments(documents: Document[]): Promise<Result<OCRResult[][], Error>> {
    return ['ok', documents.map(() => [
      {
        text: 'MOCK OCR TEXT',
        confidence: 0.95,
        pageNumber: 1
      }
    ])] as const;
  }
}

class MockJsonExtractor implements JsonExtractor {
  async extract(_request: JsonExtractionRequest): Promise<Result<any, Error>> {
    return ['ok', {
      json: { mock: 'data' },
      confidence: 0.9
    }] as const;
  }
}

class MockScannerInputValidator implements IScannerInputValidator {
  assertValid(value: ScannerInput): ScannerInput {
    // Just pass through for testing
    return value;
  }
  
  validate(value: ScannerInput) {
    return undefined; // No validation errors
  }
}

describe('ReceiptScanner', () => {
  let ocrProvider: OCRProvider;
  let jsonExtractor: JsonExtractor;
  let receiptExtractor: IReceiptExtractor;
  let inputValidator: IScannerInputValidator;
  let hallucinationDetectorFactory: HallucinationDetectorFactory;
  let processor: ReceiptScanner;

  beforeEach(function(): void {
    ocrProvider = new MockOCRProvider();
    jsonExtractor = new MockJsonExtractor();
    
    // Create SOLID-compliant detector factory
    const checkDetector = new CheckHallucinationDetector();
    const receiptDetector = new ReceiptHallucinationDetector();
    hallucinationDetectorFactory = new HallucinationDetectorFactory(checkDetector, receiptDetector);
    
    receiptExtractor = new ReceiptExtractor(jsonExtractor, hallucinationDetectorFactory);
    inputValidator = new MockScannerInputValidator();
    processor = new ReceiptScanner(ocrProvider, receiptExtractor, inputValidator);
  });

  it('should process document and extract structured data', async () => {
    // Arrange
    const document: Document = {
      content: new ArrayBuffer(10),
      type: DocumentType.Image
    };
    
    // Act
    const result = await processor.processDocument(document);
    
    // Assert
    expect(result[0]).toBe('ok');
    if (result[0] === 'ok') {
      // Replace custom matcher with standard ones
      expect(result[1].json).not.toBeUndefined();
      expect(result[1].ocrConfidence).not.toBeUndefined();
      expect(result[1].extractionConfidence).not.toBeUndefined();
      expect(result[1].overallConfidence).not.toBeUndefined();
    }
  });

  it('should handle OCR failure', async () => {
    // Arrange
    const failingOcrProvider: OCRProvider = {
      processDocuments: async (): Promise<Result<OCRResult[][], Error>> => {
        return ['error', new Error('OCR failed')] as const;
      }
    };
    
    processor = new ReceiptScanner(failingOcrProvider, receiptExtractor, inputValidator);
    const document: Document = {
      content: new ArrayBuffer(10),
      type: DocumentType.Image
    };
    
    // Act
    const result = await processor.processDocument(document);
    
    // Assert
    expect(result[0]).toBe('error');
    if (result[0] === 'error') {
      expect(result[1]).toContain('OCR failed');
    }
  });

  it('should handle JSON extraction failure', async () => {
    // Arrange
    const failingReceiptExtractor = {
      extractFromText: async (): Promise<Result<any, string>> => {
        return ['error', 'Extraction failed'] as const;
      }
    };
    
    processor = new ReceiptScanner(ocrProvider, failingReceiptExtractor, inputValidator);
    const document: Document = {
      content: new ArrayBuffer(10),
      type: DocumentType.Image
    };
    
    // Act
    const result = await processor.processDocument(document);
    
    // Assert
    expect(result[0]).toBe('error');
    if (result[0] === 'error') {
      expect(result[1]).toContain('Extraction failed');
    }
  });

  it('should handle validation failure', async () => {
    // Arrange
    const validationError = new Error('Invalid document format');
    const failingValidator: IScannerInputValidator = {
      assertValid: () => {
        throw validationError;
      },
      validate: () => {
        throw validationError;
      }
    };
    
    processor = new ReceiptScanner(ocrProvider, receiptExtractor, failingValidator);
    const document: Document = {
      content: new ArrayBuffer(10),
      type: DocumentType.Image
    };
    
    // Act
    const result = await processor.processDocument(document);
    
    // Assert
    expect(result[0]).toBe('error');
    if (result[0] === 'error') {
      expect(result[1]).toContain('Validation failed');
      expect(result[1]).toContain('Invalid document format');
    }
  });
});