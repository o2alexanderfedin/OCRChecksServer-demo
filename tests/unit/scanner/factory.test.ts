/**
 * Unit tests for ScannerFactory
 */
import '../../../test-setup.ts';
import { ScannerFactory } from '../../../src/scanner/factory.ts';
import { IoE } from '../../../src/ocr/types.ts';
import { ReceiptScanner } from '../../../src/scanner/receipt-scanner.ts';
import { CheckScanner } from '../../../src/scanner/check-scanner.ts';
import { Container } from 'inversify';

// We'll skip testing with the actual DIContainer since it's complex to mock
// and already tested elsewhere. Instead we'll test the factory's behavior.
describe('ScannerFactory', () => {
  const mockIoE = {
    log: () => {},
    debug: () => {},
    warn: () => {},
    error: () => {},
    trace: () => {},
    fetch: async () => new Response(),
    atob: () => '',
    console: { log: () => {}, error: () => {} },
    fs: { writeFileSync: () => {}, readFileSync: () => '', existsSync: () => false, promises: {} },
    process: { argv: [], env: {}, exit: () => {}, cwd: () => '' },
    asyncImport: async () => ({ default: {} }),
    performance: { now: () => 0 },
    tryCatch: (fn: any) => { try { return ['ok', fn()]; } catch (e) { return ['error', e]; } },
    asyncTryCatch: async (fn: any) => { try { return ['ok', await fn()]; } catch (e) { return ['error', e]; } }
  } as IoE;
  const apiKey = 'valid-production-token-1234567890';
  
  it('should select correct scanner type in createScannerByType for check type', () => {
    // Act
    const result = ScannerFactory.createScannerByType(mockIoE, apiKey, 'check');
    
    // Assert
    expect(result).toBeDefined();
    expect(result.constructor.name).toBe('CheckScanner');
  });
  
  it('should select correct scanner type in createScannerByType for receipt type', () => {
    // Act
    const result = ScannerFactory.createScannerByType(mockIoE, apiKey, 'receipt');
    
    // Assert
    expect(result).toBeDefined();
    expect(result.constructor.name).toBe('ReceiptScanner');
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