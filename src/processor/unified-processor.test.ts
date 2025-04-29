import { ReceiptScanner } from './unified-processor';
import { OCRProvider, Document, DocumentType } from '../ocr/types';
import { JsonExtractor } from '../json/types';
import { ReceiptExtractor as IReceiptExtractor } from '../json/extractors/types';
import { ReceiptExtractor } from '../json/extractors/receipt-extractor';

// Mock implementations
class MockOCRProvider implements OCRProvider {
  async processDocuments(documents: Document[]) {
    return ['ok', documents.map(() => ({
      text: 'MOCK OCR TEXT',
      confidence: 0.95
    }))];
  }
}

class MockJsonExtractor implements JsonExtractor {
  async extract() {
    return ['ok', {
      json: { mock: 'data' },
      confidence: 0.9
    }];
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
      expect(result[1]).toHaveProperty('json');
      expect(result[1]).toHaveProperty('ocrConfidence');
      expect(result[1]).toHaveProperty('extractionConfidence');
      expect(result[1]).toHaveProperty('overallConfidence');
    }
  });

  it('should handle OCR failure', async () => {
    // Arrange
    const failingOcrProvider: OCRProvider = {
      processDocuments: async () => ['error', new Error('OCR failed')]
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
      extractFromText: async () => ['error', 'Extraction failed']
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