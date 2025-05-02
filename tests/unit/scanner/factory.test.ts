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
  
  it('should correctly call createMistralReceiptScanner from createMistralScanner', () => {
    // Setup
    spyOn(ScannerFactory, 'createMistralReceiptScanner').and.returnValue({} as ReceiptScanner);
    
    // Act
    ScannerFactory.createMistralScanner(mockIoE, apiKey);
    
    // Assert
    expect(ScannerFactory.createMistralReceiptScanner).toHaveBeenCalledWith(mockIoE, apiKey);
  });
  
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
});