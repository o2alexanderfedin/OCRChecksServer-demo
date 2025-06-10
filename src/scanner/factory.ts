import { IoE } from '../ocr/types.ts';
import { ReceiptScanner } from './receipt-scanner.ts';
import { CheckScanner } from './check-scanner.ts';
import { DIContainer } from '../di/container.ts';
import { TYPES } from '../types/di-types.ts';
import { DocumentScanner } from './types.ts';
import { CloudflareAI } from '../json/cloudflare-llama33-extractor.ts';

/**
 * Factory for creating document scanner instances
 * Uses dependency injection container to manage dependencies
 */
export class ScannerFactory {
  /**
   * Create a DI container populated with IO and Mistral API key
   * 
   * @param io - The IO interface for network operations
   * @param apiKey - Mistral API key
   * @param caller - caller of the method
   * @returns A DIContainer instance
   */
  public static createDIContainer(io: IoE, apiKey: string, caller?: string, extractorType?: string, aiBinding?: CloudflareAI): DIContainer {
    console.log(`[ScannerFactory::${caller ?? "createDIContainer"}] Mistral API key: ${apiKey ? apiKey.substring(0, 4) + '...' : 'undefined'}`);
    console.log(`[ScannerFactory::${caller ?? "createDIContainer"}] Extractor type: ${extractorType || 'mistral (default)'}`);
    console.log(`[ScannerFactory::${caller ?? "createDIContainer"}] AI binding: ${aiBinding ? 'Available' : 'Not provided'}`);

    // Create DI container with all dependencies registered
    const container = new DIContainer().registerDependencies(io, apiKey, caller ?? 'createDIContainer', extractorType, aiBinding);
    
    // Get and return a fully configured DIContainer
    return container;
  }

  /**
   * Create a receipt scanner using Mistral for both OCR and JSON extraction
   * 
   * @param io - The IO interface for network operations
   * @param apiKey - Mistral API key
   * @returns A ReceiptScanner instance
   */
  public static createMistralReceiptScanner(io: IoE, apiKey: string, extractorType?: string, aiBinding?: CloudflareAI): ReceiptScanner {
    // Create DI container with all dependencies registered
    const container = this.createDIContainer(io, apiKey, "createMistralReceiptScanner", extractorType, aiBinding);
    
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
  public static createMistralCheckScanner(io: IoE, apiKey: string, extractorType?: string, aiBinding?: CloudflareAI): CheckScanner {
    // Create DI container with all dependencies registered
    const container = this.createDIContainer(io, apiKey, "createMistralCheckScanner", extractorType, aiBinding);
    
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
  public static createScannerByType(io: IoE, apiKey: string, documentType: 'check' | 'receipt', extractorType?: string, aiBinding?: CloudflareAI): DocumentScanner {
    if (documentType === 'check') {
      return this.createMistralCheckScanner(io, apiKey, extractorType, aiBinding);
    } else {
      return this.createMistralReceiptScanner(io, apiKey, extractorType, aiBinding);
    }
  }
}