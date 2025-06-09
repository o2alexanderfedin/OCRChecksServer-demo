/**
 * Test suite for HallucinationDetectorFactory
 * Validates SOLID-compliant hallucination detection architecture
 */

// Using Jasmine global expect
import { HallucinationDetectorFactory } from '../../../../src/json/utils/hallucination-detector-factory';
import { CheckHallucinationDetector } from '../../../../src/json/utils/check-hallucination-detector';
import { ReceiptHallucinationDetector } from '../../../../src/json/utils/receipt-hallucination-detector';
import { DocumentTypeDetector } from '../../../../src/json/utils/hallucination-detector';

describe('HallucinationDetectorFactory', () => {
  let factory: HallucinationDetectorFactory;
  let mockCheckDetector: CheckHallucinationDetector;
  let mockReceiptDetector: ReceiptHallucinationDetector;

  beforeEach(() => {
    // Create mock detectors
    mockCheckDetector = jasmine.createSpyObj('CheckHallucinationDetector', ['detect']);
    mockReceiptDetector = jasmine.createSpyObj('ReceiptHallucinationDetector', ['detect']);

    // Create factory with mocked dependencies
    factory = new HallucinationDetectorFactory(mockCheckDetector, mockReceiptDetector);
  });

  describe('getDetectorForData', () => {
    it('should return check detector for check data', () => {
      const checkData = {
        checkNumber: '1234',
        payee: 'John Doe',
        amount: '100.00',
        confidence: 0.8
      };

      const detector = factory.getDetectorForData(checkData);
      expect(detector).toBe(mockCheckDetector);
    });

    it('should return receipt detector for receipt data', () => {
      const receiptData = {
        merchant: { name: 'Test Store' },
        totals: { total: '25.99' },
        timestamp: new Date('2024-03-15T14:30:00Z'),
        confidence: 0.9
      };

      const detector = factory.getDetectorForData(receiptData);
      expect(detector).toBe(mockReceiptDetector);
    });

    it('should return null for unknown document type', () => {
      const unknownData = {
        someField: 'value',
        confidence: 0.5
      };

      const detector = factory.getDetectorForData(unknownData);
      expect(detector).toBeNull();
    });

    it('should return null for empty data', () => {
      const detector = factory.getDetectorForData({});
      expect(detector).toBeNull();
    });
  });

  describe('detectHallucinations', () => {
    it('should call check detector for check data', () => {
      const checkData = {
        checkNumber: '1234',
        payee: 'John Doe',
        confidence: 0.8
      };

      factory.detectHallucinations(checkData);
      expect(mockCheckDetector.detect).toHaveBeenCalledWith(checkData);
      expect(mockReceiptDetector.detect).not.toHaveBeenCalled();
    });

    it('should call receipt detector for receipt data', () => {
      const receiptData = {
        merchant: { name: 'Test Store' },
        totals: { total: '25.99' },
        timestamp: new Date('2024-03-15T14:30:00Z'),
        confidence: 0.9
      };

      factory.detectHallucinations(receiptData);
      expect(mockReceiptDetector.detect).toHaveBeenCalledWith(receiptData);
      expect(mockCheckDetector.detect).not.toHaveBeenCalled();
    });

    it('should handle unknown document type gracefully', () => {
      const unknownData = { someField: 'value' };

      // Should not throw error
      expect(() => factory.detectHallucinations(unknownData)).not.toThrow();
      expect(mockCheckDetector.detect).not.toHaveBeenCalled();
      expect(mockReceiptDetector.detect).not.toHaveBeenCalled();
    });
  });

  describe('getCheckDetector', () => {
    it('should return the check detector instance', () => {
      const detector = factory.getCheckDetector();
      expect(detector).toBe(mockCheckDetector);
    });
  });

  describe('getReceiptDetector', () => {
    it('should return the receipt detector instance', () => {
      const detector = factory.getReceiptDetector();
      expect(detector).toBe(mockReceiptDetector);
    });
  });
});

describe('DocumentTypeDetector', () => {
  describe('isCheckData', () => {
    it('should detect check data with checkNumber', () => {
      const data = { checkNumber: '1234' };
      expect(DocumentTypeDetector.isCheckData(data)).toBe(true);
    });

    it('should detect check data with payee', () => {
      const data = { payee: 'John Doe' };
      expect(DocumentTypeDetector.isCheckData(data)).toBe(true);
    });

    it('should detect check data with banking fields', () => {
      const data = { routingNumber: '123456789', accountNumber: '987654321' };
      expect(DocumentTypeDetector.isCheckData(data)).toBe(true);
    });

    it('should not detect check data without check fields', () => {
      const data = { merchant: { name: 'Store' } };
      expect(DocumentTypeDetector.isCheckData(data)).toBe(false);
    });
  });

  describe('isReceiptData', () => {
    it('should detect receipt data with merchant', () => {
      const data = { merchant: { name: 'Test Store' } };
      expect(DocumentTypeDetector.isReceiptData(data)).toBe(true);
    });

    it('should detect receipt data with items', () => {
      const data = { items: [{ description: 'Item 1', totalPrice: '10.00' }] };
      expect(DocumentTypeDetector.isReceiptData(data)).toBe(true);
    });

    it('should detect receipt data with totals', () => {
      const data = { totals: { total: '25.99' } };
      expect(DocumentTypeDetector.isReceiptData(data)).toBe(true);
    });

    it('should not detect receipt data without receipt fields', () => {
      const data = { checkNumber: '1234' };
      expect(DocumentTypeDetector.isReceiptData(data)).toBe(false);
    });
  });

  describe('getDocumentType', () => {
    it('should return "check" for check data', () => {
      const data = { checkNumber: '1234', payee: 'John Doe' };
      expect(DocumentTypeDetector.getDocumentType(data)).toBe('check');
    });

    it('should return "receipt" for receipt data', () => {
      const data = { merchant: { name: 'Store' }, totals: { total: '25.99' } };
      expect(DocumentTypeDetector.getDocumentType(data)).toBe('receipt');
    });

    it('should prioritize check over receipt when both fields present', () => {
      const data = { 
        checkNumber: '1234',
        merchant: { name: 'Store' }
      };
      expect(DocumentTypeDetector.getDocumentType(data)).toBe('check');
    });

    it('should return "unknown" for unrecognized data', () => {
      const data = { someField: 'value' };
      expect(DocumentTypeDetector.getDocumentType(data)).toBe('unknown');
    });

    it('should return "unknown" for empty data', () => {
      expect(DocumentTypeDetector.getDocumentType({})).toBe('unknown');
    });
  });
});