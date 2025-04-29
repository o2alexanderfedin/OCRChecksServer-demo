import { IoE } from '../ocr/types';
import { ReceiptScanner } from './receipt-scanner';
import { DIContainer, TYPES } from '../di/container';

/**
 * Factory for creating ReceiptScanner instances
 * Uses dependency injection container to manage dependencies
 */
export class ScannerFactory {
  /**
   * Create a default receipt scanner using Mistral for both OCR and JSON extraction
   * 
   * @param io - The IO interface for network operations
   * @param apiKey - Mistral API key
   * @returns A ReceiptScanner instance
   */
  static createMistralScanner(io: IoE, apiKey: string): ReceiptScanner {
    // Create DI container with all dependencies registered
    const container = new DIContainer().registerMistralDependencies(io, apiKey);
    
    // Get and return a fully configured ReceiptScanner
    return container.get<ReceiptScanner>(TYPES.ReceiptScanner);
  }
}