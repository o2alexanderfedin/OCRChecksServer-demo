/**
 * Test suite for ReceiptHallucinationDetector
 * Validates receipt-specific hallucination detection following SOLID principles
 */

// Using Jasmine global expect
import { ReceiptHallucinationDetector } from '../../../../src/json/utils/receipt-hallucination-detector.ts';
import { Receipt } from '../../../../src/json/schemas/receipt.ts';

describe('ReceiptHallucinationDetector', () => {
  let detector: ReceiptHallucinationDetector;

  beforeEach(() => {
    detector = new ReceiptHallucinationDetector();
  });

  describe('detect', () => {
    it('should mark receipt as valid when no suspicious patterns found', () => {
      const receipt: Receipt = {
        merchant: { 
          name: 'Target Corporation',
          address: '1234 Commerce Street, Anytown, ST 12345'
        },
        totals: { total: '45.67' },
        timestamp: new Date('2024-03-15T14:30:00Z'),
        receiptNumber: 'TXN789012',
        items: [
          { description: 'Organic Bananas', quantity: 2, totalPrice: '3.98' },
          { description: 'Bread Loaf', quantity: 1, totalPrice: '2.49' }
        ],
        confidence: 0.9
      };

      detector.detect(receipt);

      expect(receipt.isValidInput).toBe(true);
      expect(receipt.confidence).toBe(0.9); // Should remain unchanged
    });

    it('should detect suspicious merchant name', () => {
      const receipt: Receipt = {
        merchant: { name: 'Store' }, // Suspicious
        totals: { total: '25.99' },
        timestamp: new Date('2024-03-15T14:30:00Z'),
        confidence: 0.8
      };

      detector.detect(receipt);

      expect(receipt.isValidInput).toBe(false); // Multiple suspicious patterns detected
      expect(receipt.confidence).toBe(0.3); // Confidence reduced due to suspicion
    });

    it('should detect multiple suspicious patterns and mark as invalid', () => {
      const receipt: Receipt = {
        merchant: { name: 'Market' }, // Suspicious
        totals: { total: '10' }, // Suspicious amount
        receiptNumber: '123', // Suspicious receipt number
        timestamp: new Date('2024-03-15T14:30:00Z'),
        confidence: 0.9
      };

      detector.detect(receipt);

      expect(receipt.isValidInput).toBe(false);
      expect(receipt.confidence).toBe(0.3); // Reduced confidence
    });

    it('should detect empty merchant with total as suspicious', () => {
      const receipt: Receipt = {
        merchant: { name: '' },
        totals: { total: '25.00' }, // Has total but no merchant
        timestamp: new Date('2024-03-15T14:30:00Z'),
        confidence: 0.8
      };

      detector.detect(receipt);

      expect(receipt.isValidInput).toBe(false); // Multiple suspicious patterns detected
    });

    it('should detect suspicious total amounts', () => {
      const receipt: Receipt = {
        merchant: { name: 'Shop' }, // Suspicious
        totals: { total: '15.99' }, // Suspicious amount
        timestamp: new Date('2024-03-15T14:30:00Z'),
        confidence: 0.7
      };

      detector.detect(receipt);

      expect(receipt.isValidInput).toBe(false);
      expect(receipt.confidence).toBe(0.3);
    });

    it('should detect suspicious currency without merchant context', () => {
      const receipt: Receipt = {
        merchant: { name: 'Store' }, // Suspicious merchant
        currency: 'USD', // Generic currency with suspicious merchant
        totals: { total: '20.00' },
        timestamp: new Date('2024-03-15T14:30:00Z'),
        confidence: 0.8
      };

      detector.detect(receipt);

      expect(receipt.isValidInput).toBe(false);
      expect(receipt.confidence).toBe(0.3);
    });

    it('should detect suspicious receipt numbers', () => {
      const receipt: Receipt = {
        merchant: { name: 'Restaurant' }, // Suspicious
        receiptNumber: '1234', // Suspicious
        totals: { total: '30.00' },
        timestamp: new Date('2024-03-15T14:30:00Z'),
        confidence: 0.9
      };

      detector.detect(receipt);

      expect(receipt.isValidInput).toBe(false);
      expect(receipt.confidence).toBe(0.3);
    });

    it('should detect suspicious merchant addresses', () => {
      const receipt: Receipt = {
        merchant: { 
          name: 'Supermarket', // Suspicious
          address: '123 Main St' // Suspicious address
        },
        totals: { total: '35.00' },
        timestamp: new Date('2024-03-15T14:30:00Z'),
        confidence: 0.8
      };

      detector.detect(receipt);

      expect(receipt.isValidInput).toBe(false);
      expect(receipt.confidence).toBe(0.3);
    });

    it('should detect suspicious item descriptions', () => {
      const receipt: Receipt = {
        merchant: { name: 'ABC Store' }, // Suspicious
        items: [
          { description: 'Item', totalPrice: '10.00' } // Suspicious item description
        ],
        totals: { total: '10.00' },
        timestamp: new Date('2024-03-15T14:30:00Z'),
        confidence: 0.8
      };

      detector.detect(receipt);

      expect(receipt.isValidInput).toBe(false);
      expect(receipt.confidence).toBe(0.3);
    });

    it('should detect suspicious item count with high total', () => {
      const receipt: Receipt = {
        merchant: { name: 'Market' }, // Suspicious
        items: [{ description: 'Single Item', totalPrice: '25.00' }], // 1 item with $25+ total
        totals: { total: '25.00' },
        timestamp: new Date('2024-03-15T14:30:00Z'),
        confidence: 0.8
      };

      detector.detect(receipt);

      expect(receipt.isValidInput).toBe(false);
      expect(receipt.confidence).toBe(0.3);
    });

    it('should detect highly suspicious combination', () => {
      const receipt: Receipt = {
        merchant: { name: 'Store' }, // Exact match triggers bonus suspicion
        totals: { total: '10' },
        items: [{ description: 'Item', totalPrice: '10.00' }],
        timestamp: new Date('2024-03-15T14:30:00Z'),
        confidence: 0.9
      };

      detector.detect(receipt);

      expect(receipt.isValidInput).toBe(false);
      expect(receipt.confidence).toBe(0.3);
    });

    it('should detect minimal input with rich output', () => {
      const receipt: Receipt = {
        merchant: { name: 'XYZ Market' }, // Suspicious
        totals: { total: '15.00' },
        // Missing address, phone, items = minimal input
        timestamp: new Date('2024-03-15T14:30:00Z'),
        confidence: 0.8
      };

      detector.detect(receipt);

      expect(receipt.isValidInput).toBe(false);
      expect(receipt.confidence).toBe(0.3);
    });

    it('should detect missing timestamp with other data', () => {
      const receipt: Receipt = {
        merchant: { name: 'Shop' }, // Suspicious
        totals: { total: '20.00' },
        // Missing timestamp is suspicious when other data present
        timestamp: new Date('2024-03-15T14:30:00Z'),
        confidence: 0.8
      };

      detector.detect(receipt);

      expect(receipt.isValidInput).toBe(false);
      expect(receipt.confidence).toBe(0.3);
    });

    it('should preserve existing isValidInput false', () => {
      const receipt: Receipt = {
        merchant: { name: 'Legitimate Store' },
        totals: { total: '55.67' },
        isValidInput: false, // Already marked as invalid
        timestamp: new Date('2024-03-15T14:30:00Z'),
        confidence: 0.8
      };

      detector.detect(receipt);

      expect(receipt.isValidInput).toBe(false); // Should remain false
      expect(receipt.confidence).toBe(0.3); // Reduced due to suspicious patterns
    });

    it('should handle missing confidence gracefully', () => {
      const receipt: Receipt = {
        merchant: { name: 'Store' }, // Suspicious
        totals: { total: '10' }, // Suspicious
        timestamp: new Date('2024-03-15T14:30:00Z'),
        confidence: 0.9
      };

      // Remove confidence to test fallback
      delete (receipt as any).confidence;
      (receipt as any).confidence = undefined;

      detector.detect(receipt);

      expect(receipt.isValidInput).toBe(false);
      expect(receipt.confidence).toBe(0); // Should use Math.min(0, 0.3) = 0
    });

    it('should handle partial suspicious patterns in merchant name', () => {
      const receipt: Receipt = {
        merchant: { name: 'Best Store in Town' }, // Contains "Store" but more specific
        totals: { total: '45.99' },
        timestamp: new Date('2024-03-15T14:30:00Z'),
        confidence: 0.8
      };

      detector.detect(receipt);

      expect(receipt.isValidInput).toBe(false); // Multiple suspicious patterns detected
      expect(receipt.confidence).toBe(0.3); // Confidence reduced due to suspicion
    });

    it('should handle legitimate receipts with valid data', () => {
      const receipt: Receipt = {
        merchant: { 
          name: 'Walmart Supercenter',
          address: '1234 Commerce Street, Anytown, CA 12345',
          phone: '(555) 123-4567'
        },
        receiptNumber: 'WMT789012345',
        timestamp: new Date('2024-03-15T10:30:00Z'),
        totals: { total: '87.43' },
        items: [
          { description: 'Bananas 2 lbs', totalPrice: '3.48' },
          { description: 'Milk 1 Gallon', totalPrice: '4.99' },
          { description: 'Bread Wonder White', totalPrice: '2.78' }
        ],
        confidence: 0.95
      };

      detector.detect(receipt);

      expect(receipt.isValidInput).toBe(true);
      expect(receipt.confidence).toBe(0.95); // Should remain unchanged
    });

    it('should detect zero items with positive total as suspicious', () => {
      const receipt: Receipt = {
        merchant: { name: 'ABC Store' }, // Suspicious
        items: [], // Zero items but has total
        totals: { total: '25.00' },
        timestamp: new Date('2024-03-15T14:30:00Z'),
        confidence: 0.8
      };

      detector.detect(receipt);

      expect(receipt.isValidInput).toBe(false);
      expect(receipt.confidence).toBe(0.3);
    });
  });
});