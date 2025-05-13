import { IoE } from '../ocr/types';
import { ReceiptScanner } from './receipt-scanner';
import { CheckScanner } from './check-scanner';
import { DIContainer } from '../di/container';
import { TYPES } from '../types/di-types';
import { DocumentScanner } from './types';

/**
 * Factory for creating document scanner instances
 * Uses dependency injection container to manage dependencies
 */
export class ScannerFactory {
  /**
   * Create a receipt scanner using Mistral for both OCR and JSON extraction
   * 
   * @param io - The IO interface for network operations
   * @param apiKey - Mistral API key
   * @returns A ReceiptScanner instance
   */
  static createMistralReceiptScanner(io: IoE, apiKey: string): ReceiptScanner {
    console.log(`[ScannerFactory::createMistralReceiptScanner] Mistral API key: ${apiKey ? apiKey.substring(0, 4) + '...' : 'undefined'}`);

    // Create DI container with all dependencies registered
    const container = new DIContainer().registerMistralDependencies(io, apiKey);
    
    // Get and return a fully configured ReceiptScanner
    return container.get<ReceiptScanner>(TYPES.ReceiptScanner);
  }
  
  /**
   * Create a check scanner using Mistral for both OCR and JSON extraction
   * 
   * @param io - The IO interface for network operations
   * @param apiKey - Mistral API key
   * @returns A CheckScanner instance
   */
  static createMistralCheckScanner(io: IoE, apiKey: string): CheckScanner {
    console.log(`[ScannerFactory::createMistralCheckScanner] Mistral API key: ${apiKey ? apiKey.substring(0, 4) + '...' : 'undefined'}`);

    // Create DI container with all dependencies registered
    const container = new DIContainer().registerMistralDependencies(io, apiKey);
    
    // Get and return a fully configured CheckScanner
    return container.get<CheckScanner>(TYPES.CheckScanner);
  }
  
  /**
   * Creates an appropriate document scanner based on document type
   * 
   * @param io - The IO interface for network operations
   * @param apiKey - Mistral API key
   * @param documentType - The type of document to process ('check' or 'receipt')
   * @returns A DocumentScanner instance
   */
  static createScannerByType(io: IoE, apiKey: string, documentType: 'check' | 'receipt'): DocumentScanner {
    if (documentType === 'check') {
      return this.createMistralCheckScanner(io, apiKey);
    } else {
      return this.createMistralReceiptScanner(io, apiKey);
    }
  }
}