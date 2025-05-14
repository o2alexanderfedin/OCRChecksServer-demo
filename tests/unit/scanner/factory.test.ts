/**
 * Unit tests for ScannerFactory
 */
import { ScannerFactory } from '../../../src/scanner/factory';
import { IoE } from '../../../src/ocr/types';
import { ReceiptScanner } from '../../../src/scanner/receipt-scanner';
import { CheckScanner } from '../../../src/scanner/check-scanner';
import { Container } from 'inversify';

// We'll skip testing with the actual DIContainer since it's complex to mock
// and already tested elsewhere. Instead we'll test the factory's behavior.
describe('ScannerFactory', () => {
  const mockIoE = {} as IoE;
  const apiKey = 'test-api-key';
  
  it('should select correct scanner type in createScannerByType for check type', () => {
    // Setup
    spyOn(ScannerFactory, 'createMistralCheckScanner').and.returnValue({} as CheckScanner);
    
    // Act
    ScannerFactory.createScannerByType(mockIoE, apiKey, 'check');
    
    // Assert
    expect(ScannerFactory.createMistralCheckScanner).toHaveBeenCalledWith(mockIoE, apiKey);
  });
  
  it('should select correct scanner type in createScannerByType for receipt type', () => {
    // Setup
    spyOn(ScannerFactory, 'createMistralReceiptScanner').and.returnValue({} as ReceiptScanner);
    
    // Act
    ScannerFactory.createScannerByType(mockIoE, apiKey, 'receipt');
    
    // Assert
    expect(ScannerFactory.createMistralReceiptScanner).toHaveBeenCalledWith(mockIoE, apiKey);
  });

  describe('createDIContainer validation', () => {
    it('should throw an error when io is missing', () => {
      // Act & Assert
      expect(() => {
        ScannerFactory.createDIContainer(null as unknown as IoE, apiKey);
      }).toThrowError(/CRITICAL ERROR: IO interface is missing or undefined/);
    });

    it('should throw an error when apiKey is missing', () => {
      // Act & Assert
      expect(() => {
        ScannerFactory.createDIContainer(mockIoE, '');
      }).toThrowError(/CRITICAL ERROR: Mistral API key is missing or empty/);
    });

    it('should throw an error when apiKey is too short', () => {
      // Act & Assert
      expect(() => {
        ScannerFactory.createDIContainer(mockIoE, 'short');
      }).toThrowError(/CRITICAL ERROR: Mistral API key is too short/);
    });
  });
});