import { ReceiptScanner } from '../../../src/processor/unified-processor';
import { OCRProvider, Document, DocumentType, OCRResult } from '../../../src/ocr/types';
import { JsonExtractor, JsonExtractionRequest } from '../../../src/json/types';
import { ReceiptExtractor as IReceiptExtractor } from '../../../src/json/extractors/types';
import { ReceiptExtractor } from '../../../src/json/extractors/receipt-extractor';
import type { Result } from 'functionalscript/types/result/module.f.js';

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

describe('ReceiptScanner', () => {
  let ocrProvider: OCRProvider;
  let jsonExtractor: JsonExtractor;
  let receiptExtractor: IReceiptExtractor;
  let processor: ReceiptScanner;

  beforeEach(function(): void {
    ocrProvider = new MockOCRProvider();
    jsonExtractor = new MockJsonExtractor();
    receiptExtractor = new ReceiptExtractor(jsonExtractor);
    processor = new ReceiptScanner(ocrProvider, receiptExtractor);
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
    
    processor = new ReceiptScanner(failingOcrProvider, receiptExtractor);
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
    
    processor = new ReceiptScanner(ocrProvider, failingReceiptExtractor);
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
});