import { CheckScanner } from '../../../src/scanner/check-scanner';
import { OCRProvider, Document, DocumentType, OCRResult } from '../../../src/ocr/types';
import { JsonExtractor, JsonExtractionRequest } from '../../../src/json/types';
import { CheckExtractor as ICheckExtractor } from '../../../src/json/extractors/types';
import { CheckExtractor } from '../../../src/json/extractors/check-extractor';
import { CheckHallucinationDetector } from '../../../src/json/utils/check-hallucination-detector';
import type { Result } from 'functionalscript/types/result/module.f.js';
import type { Check } from '../../../src/json/schemas/check';
import { IScannerInputValidator, ScannerInput } from '../../../src/validators';
import 'reflect-metadata';

// Mock implementations
class MockOCRProvider implements OCRProvider {
  async processDocuments(documents: Document[]): Promise<Result<OCRResult[][], Error>> {
    return ['ok', documents.map(() => [
      {
        text: 'MOCK OCR CHECK TEXT',
        confidence: 0.95,
        pageNumber: 1
      }
    ])] as const;
  }
}

class MockJsonExtractor implements JsonExtractor {
  async extract(_request: JsonExtractionRequest): Promise<Result<any, Error>> {
    return ['ok', {
      json: {
        checkNumber: 'A123456789',
        date: new Date('2025-05-01'),
        payee: 'John Smith',
        amount: '1234.56',
        bankName: 'Test Bank',
        confidence: 0.9
      },
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

describe('CheckScanner', () => {
  let ocrProvider: OCRProvider;
  let jsonExtractor: JsonExtractor;
  let checkExtractor: ICheckExtractor;
  let inputValidator: IScannerInputValidator;
  let hallucinationDetector: CheckHallucinationDetector;
  let scanner: CheckScanner;

  beforeEach(function(): void {
    ocrProvider = new MockOCRProvider();
    jsonExtractor = new MockJsonExtractor();
    
    // Create hallucination detector for scanner-based detection
    hallucinationDetector = new CheckHallucinationDetector();
    
    checkExtractor = new CheckExtractor(jsonExtractor);
    inputValidator = new MockScannerInputValidator();
    scanner = new CheckScanner(ocrProvider, checkExtractor, inputValidator, hallucinationDetector);
  });

  it('should process document and extract structured check data', async () => {
    // Arrange
    const document: Document = {
      content: new ArrayBuffer(10),
      type: DocumentType.Image
    };
    
    // Act
    const result = await scanner.processDocument(document);
    
    // Assert
    expect(result[0]).toBe('ok');
    if (result[0] === 'ok') {
      expect(result[1].json).not.toBeUndefined();
      const checkData = result[1].json as Check;
      expect(checkData.checkNumber).toBe('A123456789');
      expect(checkData.payee).toBe('John Smith');
      expect(checkData.amount).toBe('1234.56');
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
    
    scanner = new CheckScanner(failingOcrProvider, checkExtractor, inputValidator, hallucinationDetector);
    const document: Document = {
      content: new ArrayBuffer(10),
      type: DocumentType.Image
    };
    
    // Act
    const result = await scanner.processDocument(document);
    
    // Assert
    expect(result[0]).toBe('error');
    if (result[0] === 'error') {
      expect(result[1]).toContain('OCR failed');
    }
  });

  it('should handle JSON extraction failure', async () => {
    // Arrange
    const failingCheckExtractor = {
      extractFromText: async (): Promise<Result<any, string>> => {
        return ['error', 'Extraction failed'] as const;
      }
    };
    
    scanner = new CheckScanner(ocrProvider, failingCheckExtractor, inputValidator, hallucinationDetector);
    const document: Document = {
      content: new ArrayBuffer(10),
      type: DocumentType.Image
    };
    
    // Act
    const result = await scanner.processDocument(document);
    
    // Assert
    expect(result[0]).toBe('error');
    if (result[0] === 'error') {
      expect(result[1]).toContain('Extraction failed');
    }
  });
  
  it('should process multiple documents', async () => {
    // Arrange
    const documents: Document[] = [
      {
        content: new ArrayBuffer(10),
        type: DocumentType.Image
      },
      {
        content: new ArrayBuffer(10),
        type: DocumentType.Image
      }
    ];
    
    // Act
    const result = await scanner.processDocuments(documents);
    
    // Assert
    expect(result[0]).toBe('ok');
    if (result[0] === 'ok') {
      expect(result[1].length).toBe(2);
      const checkData0 = result[1][0].json as Check;
      const checkData1 = result[1][1].json as Check;
      expect(checkData0.checkNumber).toBe('A123456789');
      expect(checkData1.checkNumber).toBe('A123456789');
    }
  });
  
  it('should calculate overall confidence correctly', async () => {
    // Arrange
    const document: Document = {
      content: new ArrayBuffer(10),
      type: DocumentType.Image
    };
    
    // OCR confidence is 0.95, extraction confidence is 0.9
    // Expected overall: (0.95 * 0.6) + (0.9 * 0.4) = 0.57 + 0.36 = 0.93
    
    // Act
    const result = await scanner.processDocument(document);
    
    // Assert
    expect(result[0]).toBe('ok');
    if (result[0] === 'ok') {
      expect(result[1].ocrConfidence).toBe(0.95);
      expect(result[1].extractionConfidence).toBe(0.9);
      expect(result[1].overallConfidence).toBe(0.93);
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
    
    scanner = new CheckScanner(ocrProvider, checkExtractor, failingValidator, hallucinationDetector);
    const document: Document = {
      content: new ArrayBuffer(10),
      type: DocumentType.Image
    };
    
    // Act
    const result = await scanner.processDocument(document);
    
    // Assert
    expect(result[0]).toBe('error');
    if (result[0] === 'error') {
      expect(result[1]).toContain('Validation failed');
      expect(result[1]).toContain('Invalid document format');
    }
  });
});