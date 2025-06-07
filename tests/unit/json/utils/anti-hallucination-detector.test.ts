/**
 * Unit tests for AntiHallucinationDetector utility
 */

import { AntiHallucinationDetector } from '../../../../src/json/utils/anti-hallucination-detector.js';
import { Check } from '../../../../src/json/schemas/check.js';
import { Receipt } from '../../../../src/json/schemas/receipt.js';

describe('AntiHallucinationDetector', () => {
  let detector: AntiHallucinationDetector;

  beforeEach(() => {
    detector = new AntiHallucinationDetector();
  });

  describe('detectCheckHallucinations', () => {
    it('should detect hallucinated check number', () => {
      // Red phase: This test should fail initially
      const check: Partial<Check> = {
        checkNumber: '1234',
        confidence: 0.8
      };

      detector.detectCheckHallucinations(check as Check);

      expect(check.isValidInput).toBe(false);
      expect(check.confidence).toBeLessThanOrEqual(0.3);
    });

    it('should detect hallucinated payee', () => {
      const check: Partial<Check> = {
        payee: 'John Doe',
        confidence: 0.8
      };

      detector.detectCheckHallucinations(check as Check);

      expect(check.isValidInput).toBe(false);
      expect(check.confidence).toBeLessThanOrEqual(0.3);
    });

    it('should detect multiple suspicious patterns', () => {
      const check: Partial<Check> = {
        checkNumber: '1234',
        payee: 'John Doe',
        amount: '100',
        confidence: 0.8
      };

      detector.detectCheckHallucinations(check as Check);

      expect(check.isValidInput).toBe(false);
      expect(check.confidence).toBeLessThanOrEqual(0.3);
    });

    it('should not flag valid check data', () => {
      const check: Partial<Check> = {
        checkNumber: '2567',
        payee: 'Valid Payee Corp',
        amount: '1234.56',
        confidence: 0.8
      };

      detector.detectCheckHallucinations(check as Check);

      expect(check.isValidInput).not.toBe(false);
      expect(check.confidence).toBe(0.8);
    });

    it('should handle date string conversion', () => {
      const check: Partial<Check> = {
        checkNumber: '1234',
        date: '2023-10-05',
        confidence: 0.8
      };

      detector.detectCheckHallucinations(check as Check);

      expect(check.isValidInput).toBe(false);
    });

    it('should handle Date object conversion', () => {
      const check: Partial<Check> = {
        checkNumber: '1234',
        date: new Date('2023-10-05'),
        confidence: 0.8
      };

      detector.detectCheckHallucinations(check as Check);

      expect(check.isValidInput).toBe(false);
    });
  });

  describe('detectReceiptHallucinations', () => {
    it('should detect suspicious merchant name', () => {
      const receipt: Partial<Receipt> = {
        merchant: { name: 'Store' },
        confidence: 0.8
      };

      detector.detectReceiptHallucinations(receipt as Receipt);

      expect(receipt.isValidInput).toBe(false);
      expect(receipt.confidence).toBeLessThanOrEqual(0.3);
    });

    it('should detect suspicious total', () => {
      const receipt: Partial<Receipt> = {
        totals: { total: '15.99' },
        confidence: 0.8
      };

      detector.detectReceiptHallucinations(receipt as Receipt);

      expect(receipt.isValidInput).toBe(false);
      expect(receipt.confidence).toBeLessThanOrEqual(0.3);
    });

    it('should detect rich output with minimal input', () => {
      const receipt: Partial<Receipt> = {
        merchant: { name: 'Valid Store' },
        totals: { total: '25.50' },
        items: [], // minimal input
        confidence: 0.8
      };

      detector.detectReceiptHallucinations(receipt as Receipt);

      expect(receipt.isValidInput).toBe(false);
    });

    it('should not flag valid receipt data', () => {
      const receipt: Partial<Receipt> = {
        merchant: { 
          name: 'Valid Store Corp',
          address: '123 Main St'
        },
        totals: { total: '1234.56' },
        items: [
          { description: 'Item 1', totalPrice: '10.00' },
          { description: 'Item 2', totalPrice: '15.50' }
        ],
        confidence: 0.8
      };

      detector.detectReceiptHallucinations(receipt as Receipt);

      expect(receipt.isValidInput).not.toBe(false);
      expect(receipt.confidence).toBe(0.8);
    });
  });

  describe('constructor injection', () => {
    it('should be injectable', () => {
      // Test that the class can be instantiated (DI requirement)
      expect(detector).toBeInstanceOf(AntiHallucinationDetector);
    });
  });
});