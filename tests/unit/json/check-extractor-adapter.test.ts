/**
 * Unit tests for the legacy check extractor adapter
 */
import { CheckExtractor } from '../../../src/json/check-extractor';
import { JsonExtractor } from '../../../src/json/types';
import { Check } from '../../../src/json/schemas/check';
import type { Result } from 'functionalscript/types/result/module.f.js';

describe('CheckExtractor Legacy Adapter', () => {
  it('should wrap the implementation and provide the same functionality', async () => {
    // Arrange
    const mockJsonExtractor: JsonExtractor = {
      extract: async () => {
        return ['ok', {
          json: {
            checkNumber: '12345',
            date: '2025-01-01',
            payee: 'John Doe',
            amount: 100.50,
            confidence: 0.95
          } as Check,
          confidence: 0.95
        }] as const;
      }
    };
    
    const checkExtractor = new CheckExtractor(mockJsonExtractor);
    
    // Act
    const result = await checkExtractor.extractFromText('Check OCR text');
    
    // Assert
    expect(result[0]).toBe('ok');
    if (result[0] === 'ok') {
      expect(result[1].json.checkNumber).toBe('12345');
      expect(result[1].json.date).toBe('2025-01-01');
      expect(result[1].json.payee).toBe('John Doe');
      expect(result[1].json.amount).toBe(100.50);
      expect(result[1].confidence).toBe(0.95);
    }
  });

  it('should handle extraction errors', async () => {
    // Arrange
    const mockJsonExtractor: JsonExtractor = {
      extract: async () => {
        return ['error', new Error('Extraction failed')] as const;
      }
    };
    
    const checkExtractor = new CheckExtractor(mockJsonExtractor);
    
    // Act
    const result = await checkExtractor.extractFromText('Check OCR text');
    
    // Assert
    expect(result[0]).toBe('error');
    if (result[0] === 'error') {
      expect(result[1]).toBe('Extraction failed');
    }
  });
});