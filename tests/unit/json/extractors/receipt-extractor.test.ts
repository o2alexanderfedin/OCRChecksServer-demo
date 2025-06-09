import { ReceiptExtractor } from '../../../../src/json/extractors/receipt-extractor';
import { JsonExtractor, JsonExtractionRequest } from '../../../../src/json/types';
import { ReceiptExtractor as IReceiptExtractor } from '../../../../src/json/extractors/types';
import type { Result } from 'functionalscript/types/result/module.f.js';

// Mock implementations
class MockJsonExtractor implements JsonExtractor {
  async extract(_request: JsonExtractionRequest): Promise<Result<any, Error>> {
    return ['ok', {
      json: {
        merchant: {
          name: 'Test Store'
        },
        timestamp: new Date('2023-01-01T12:00:00Z'),
        totals: {
          total: '42.99'
        },
        currency: 'USD',
        confidence: 0.9
      },
      confidence: 0.9
    }] as const;
  }
}

// Failing mock
class FailingJsonExtractor implements JsonExtractor {
  async extract(_request: JsonExtractionRequest): Promise<Result<any, Error>> {
    return ['error', new Error('Extraction failed')] as const;
  }
}

describe('ReceiptExtractor', () => {
  let jsonExtractor: JsonExtractor;
  let receiptExtractor: IReceiptExtractor;

  beforeEach(function(): void {
    jsonExtractor = new MockJsonExtractor();
    
    // Note: Hallucination detection is now handled by the scanner layer
    
    receiptExtractor = new ReceiptExtractor(jsonExtractor);
  });

  it('should extract receipt data from OCR text', async () => {
    // Arrange
    const ocrText = 'Test Store\nTotal: $42.99\nDate: 2023-01-01';
    
    // Act
    const result = await receiptExtractor.extractFromText(ocrText);
    
    // Assert
    expect(result[0]).toBe('ok');
    if (result[0] === 'ok') {
      // Replace custom matcher with standard ones
      expect(result[1].json).not.toBeUndefined();
      expect(result[1].json.merchant.name).toBe('Test Store');
      expect(result[1].json.totals.total).toBe('42.99');
      expect(result[1].json.currency).toBe('USD');
      expect(result[1].confidence).toBe(0.9);
    }
  });

  it('should handle extraction failures', async () => {
    // Arrange
    const failingExtractor = new FailingJsonExtractor();
    const extractor = new ReceiptExtractor(failingExtractor);
    const ocrText = 'Invalid text';
    
    // Act
    const result = await extractor.extractFromText(ocrText);
    
    // Assert
    expect(result[0]).toBe('error');
    if (result[0] === 'error') {
      expect(result[1]).toContain('Extraction failed');
    }
  });

  it('should normalize receipt data', async () => {
    // Arrange
    const jsonExtractor: JsonExtractor = {
      extract: async (_request: JsonExtractionRequest): Promise<Result<any, Error>> => {
        return ['ok', {
          json: {
            merchant: {
              name: 'Test Store'
            },
            timestamp: '2023-01-01',  // String to be converted to Date
            totals: {
              total: '42.99'
            },
            currency: 'usd',  // Lowercase
            confidence: 0.9
          },
          confidence: 0.9
        }] as const;
      }
    };
    
    const extractor = new ReceiptExtractor(jsonExtractor);
    const ocrText = 'Test Store\nTotal: $42.99\nDate: 2023-01-01';
    
    // Act
    const result = await extractor.extractFromText(ocrText);
    
    // Assert
    expect(result[0]).toBe('ok');
    if (result[0] === 'ok') {
      // Check currency is uppercase
      expect(result[1].json.currency).toBe('USD');
      
      // Check timestamp is a Date object
      expect(result[1].json.timestamp).toBeInstanceOf(Date);
    }
  });
});