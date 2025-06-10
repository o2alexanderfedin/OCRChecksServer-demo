import { CheckExtractor } from '../../../../src/json/extractors/check-extractor';
import { JsonExtractor, JsonExtractionRequest } from '../../../../src/json/types.ts';
import { CheckExtractor as ICheckExtractor } from '../../../../src/json/extractors/types';
import { Check, CheckType, BankAccountType } from '../../../../src/json/schemas/check.ts';
import type { Result } from 'functionalscript/types/result/module.f.js';

// Mock implementations
class MockJsonExtractor implements JsonExtractor {
  async extract(_request: JsonExtractionRequest): Promise<Result<any, Error>> {
    return ['ok', {
      json: {
        checkNumber: 'A123456789',
        date: new Date('2025-05-01'),
        payee: 'John Smith',
        payer: 'Jane Doe',
        amount: '1234.56',
        memo: 'Consulting services',
        bankName: 'First National Bank',
        routingNumber: '123456789',
        accountNumber: '9876543210',
        checkType: 'personal',
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

describe('CheckExtractor', () => {
  let jsonExtractor: JsonExtractor;
  let checkExtractor: ICheckExtractor;

  beforeEach(function(): void {
    jsonExtractor = new MockJsonExtractor();
    
    // Note: Hallucination detection is now handled by the scanner layer
    
    checkExtractor = new CheckExtractor(jsonExtractor);
  });

  it('should extract check data from OCR text', async () => {
    // Arrange
    const ocrText = 'Check #A123456789\nPay to: John Smith\nAmount: $1,234.56\nDate: May 1, 2025';
    
    // Act
    const result = await checkExtractor.extractFromText(ocrText);
    
    // Assert
    expect(result[0]).toBe('ok');
    if (result[0] === 'ok') {
      expect(result[1].json).not.toBeUndefined();
      expect(result[1].json.checkNumber).toBe('A123456789');
      expect(result[1].json.payee).toBe('John Smith');
      expect(result[1].json.amount).toBe('1234.56');
      expect(result[1].json.date).toBeInstanceOf(Date);
      if (result[1].json.date instanceof Date) {
        expect(result[1].json.date.toISOString().substring(0, 10)).toBe('2025-05-01');
      }
      expect(result[1].json.bankName).toBe('First National Bank');
      expect(result[1].confidence).toBe(0.9);
    }
  });

  it('should handle extraction failures', async () => {
    // Arrange
    const failingExtractor = new FailingJsonExtractor();
    const extractor = new CheckExtractor(failingExtractor);
    const ocrText = 'Invalid text';
    
    // Act
    const result = await extractor.extractFromText(ocrText);
    
    // Assert
    expect(result[0]).toBe('error');
    if (result[0] === 'error') {
      expect(result[1]).toContain('Extraction failed');
    }
  });

  it('should normalize check data', async () => {
    // Arrange
    const jsonExtractor: JsonExtractor = {
      extract: async (_request: JsonExtractionRequest): Promise<Result<any, Error>> => {
        return ['ok', {
          json: {
            checkNumber: 'A123456789',
            date: '05/01/2025',  // Not in ISO format
            payee: 'John Smith',
            amount: '1234.56',
            routingNumber: '00123456789',  // Needs normalization
            accountType: 'checking',  // Lowercase
            confidence: 0.9
          },
          confidence: 0.9
        }] as const;
      }
    };
    
    const extractor = new CheckExtractor(jsonExtractor);
    const ocrText = 'Check #A123456789\nPay to: John Smith\nAmount: $1,234.56';
    
    // Act
    const result = await extractor.extractFromText(ocrText);
    
    // Assert
    expect(result[0]).toBe('ok');
    if (result[0] === 'ok') {
      // Check date is normalized to Date object
      expect(result[1].json.date).toBeInstanceOf(Date);
      
      // Check routing number is normalized to 9 digits
      expect(result[1].json.routingNumber).toBe('123456789');
      
      // Check account type is properly set to enum
      expect(result[1].json.accountType).toBe(BankAccountType.Checking);
    }
  });
  
  it('should extract MICR line information when available', async () => {
    // Arrange
    const jsonExtractor: JsonExtractor = {
      extract: async (_request: JsonExtractionRequest): Promise<Result<any, Error>> => {
        return ['ok', {
          json: {
            checkNumber: '1234',
            date: new Date('2025-05-01'),
            payee: 'John Smith',
            amount: '100',
            micrLine: '⑆123456789⑆ ⑈9876543210⑈ ⑇1234⑇',
            confidence: 0.9
          },
          confidence: 0.9
        }] as const;
      }
    };
    
    const extractor = new CheckExtractor(jsonExtractor);
    const ocrText = 'Check MICR line: ⑆123456789⑆ ⑈9876543210⑈ ⑇1234⑇';
    
    // Act
    const result = await extractor.extractFromText(ocrText);
    
    // Assert
    expect(result[0]).toBe('ok');
    if (result[0] === 'ok') {
      expect(result[1].json.micrLine).toBe('⑆123456789⑆ ⑈9876543210⑈ ⑇1234⑇');
      expect(result[1].json.routingNumber).toBe('123456789');
      expect(result[1].json.accountNumber).toBe('9876543210');
      expect(result[1].json.checkNumber).toBe('1234');
    }
  });
});