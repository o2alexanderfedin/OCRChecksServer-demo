/**
 * Test suite for CheckHallucinationDetector
 * Validates check-specific hallucination detection following SOLID principles
 */

// Using Jasmine global expect
import { CheckHallucinationDetector } from '../../../../src/json/utils/check-hallucination-detector.ts';
import { Check } from '../../../../src/json/schemas/check.ts';

describe('CheckHallucinationDetector', () => {
  let detector: CheckHallucinationDetector;

  beforeEach(() => {
    detector = new CheckHallucinationDetector();
  });

  describe('detect', () => {
    it('should mark check as valid when no suspicious patterns found', () => {
      const check: Check = {
        checkNumber: '7890',
        payee: 'Acme Corporation',
        payer: 'Alice Johnson',
        amount: '250.00',
        date: new Date('2024-03-15'),
        bankName: 'Acme Credit Union',
        confidence: 0.9
      };

      detector.detect(check);

      expect(check.isValidInput).toBe(true);
      expect(check.confidence).toBe(0.9); // Should remain unchanged
    });

    it('should detect suspicious check number', () => {
      const check: Check = {
        checkNumber: '1234', // Suspicious
        payee: 'Acme Corporation',
        confidence: 0.9
      };

      detector.detect(check);

      expect(check.isValidInput).toBe(true); // Only one suspicious pattern
      expect(check.confidence).toBe(0.9); // Should remain unchanged
    });

    it('should detect multiple suspicious patterns and mark as invalid', () => {
      const check: Check = {
        checkNumber: '1234', // Suspicious
        payee: 'John Doe', // Suspicious
        amount: '100', // Suspicious
        confidence: 0.9
      };

      detector.detect(check);

      expect(check.isValidInput).toBe(false);
      expect(check.confidence).toBe(0.3); // Reduced confidence
    });

    it('should detect suspicious payee names', () => {
      const check: Check = {
        checkNumber: '7890',
        payee: 'Jane Doe', // Suspicious
        payer: 'John Smith', // Suspicious 
        confidence: 0.8
      };

      detector.detect(check);

      expect(check.isValidInput).toBe(false); // Two suspicious patterns
      expect(check.confidence).toBe(0.3);
    });

    it('should detect suspicious amounts', () => {
      const check: Check = {
        checkNumber: '5678', // Suspicious
        amount: '500', // Suspicious
        confidence: 0.7
      };

      detector.detect(check);

      expect(check.isValidInput).toBe(false);
      expect(check.confidence).toBe(0.3);
    });

    it('should detect suspicious dates', () => {
      const check: Check = {
        checkNumber: '0000', // Suspicious
        date: '2023-10-05', // Suspicious date pattern
        confidence: 0.8
      };

      detector.detect(check);

      expect(check.isValidInput).toBe(false);
      expect(check.confidence).toBe(0.3);
    });

    it('should detect suspicious bank names', () => {
      const check: Check = {
        checkNumber: '1234', // Suspicious
        bankName: 'First Bank', // Suspicious
        confidence: 0.9
      };

      detector.detect(check);

      expect(check.isValidInput).toBe(false);
      expect(check.confidence).toBe(0.3);
    });

    it('should detect suspicious routing numbers', () => {
      const check: Check = {
        payee: 'John Doe', // Suspicious
        routingNumber: '123456789', // Suspicious
        confidence: 0.8
      };

      detector.detect(check);

      expect(check.isValidInput).toBe(false);
      expect(check.confidence).toBe(0.3);
    });

    it('should detect highly suspicious combination', () => {
      const check: Check = {
        checkNumber: '1234', // Exact match triggers bonus suspicion
        payee: 'John Doe',
        amount: '100',
        confidence: 0.9
      };

      detector.detect(check);

      expect(check.isValidInput).toBe(false);
      expect(check.confidence).toBe(0.3);
    });

    it('should detect amount without payee/payer as suspicious', () => {
      const check: Check = {
        amount: '100.00',
        bankName: 'Bank', // Suspicious
        confidence: 0.8
      };

      detector.detect(check);

      expect(check.isValidInput).toBe(false);
      expect(check.confidence).toBe(0.3);
    });

    it('should handle Date objects correctly', () => {
      const check: Check = {
        checkNumber: '1234', // Suspicious
        date: new Date('2023-10-05'), // Suspicious date
        confidence: 0.8
      };

      detector.detect(check);

      expect(check.isValidInput).toBe(false);
      expect(check.confidence).toBe(0.3);
    });

    it('should preserve existing isValidInput false', () => {
      const check: Check = {
        checkNumber: '7890', // Not suspicious
        payee: 'Legitimate Company',
        isValidInput: false, // Already marked as invalid
        confidence: 0.8
      };

      detector.detect(check);

      expect(check.isValidInput).toBe(false); // Should remain false
      expect(check.confidence).toBe(0.8); // Should not be reduced further
    });

    it('should handle missing confidence gracefully', () => {
      const check: Check = {
        checkNumber: '1234', // Suspicious
        payee: 'John Doe', // Suspicious
        confidence: 0.9
      };

      // Remove confidence to test fallback
      delete (check as any).confidence;
      (check as any).confidence = undefined;

      detector.detect(check);

      expect(check.isValidInput).toBe(false);
      expect(check.confidence).toBe(0); // Should use Math.min(0, 0.3) = 0
    });

    it('should handle partial suspicious patterns', () => {
      const check: Check = {
        payee: 'Company with John Doe in name', // Contains suspicious pattern
        confidence: 0.8
      };

      detector.detect(check);

      expect(check.isValidInput).toBe(true); // Only one suspicious pattern
      expect(check.confidence).toBe(0.8);
    });

    it('should detect multiple bank-related suspicious patterns', () => {
      const check: Check = {
        bankName: 'Bank', // Suspicious
        routingNumber: '000000000', // Suspicious
        confidence: 0.9
      };

      detector.detect(check);

      expect(check.isValidInput).toBe(false);
      expect(check.confidence).toBe(0.3);
    });
  });
});