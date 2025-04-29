import { IoE } from '../ocr/types';
import { MistralOCRProvider } from '../ocr/mistral';
import { MistralJsonExtractorProvider } from '../json/mistral';
import { MistralReceiptExtractor } from '../json/extractors/receipt-extractor';
import { UnifiedProcessor } from './unified-processor';
import { Mistral } from '@mistralai/mistralai';

/**
 * Factory for creating UnifiedProcessor instances
 * Follows the Factory pattern to encapsulate creation details
 */
export class ProcessorFactory {
  /**
   * Create a default unified processor using Mistral for both OCR and JSON extraction
   * 
   * @param io - The IO interface for network operations
   * @param apiKey - Mistral API key
   * @returns A UnifiedProcessor instance
   */
  static createMistralProcessor(io: IoE, apiKey: string): UnifiedProcessor {
    // Create Mistral client
    const mistralClient = new Mistral({
      apiKey,
    });
    
    // Create OCR provider
    const ocrProvider = new MistralOCRProvider(io, {
      apiKey,
    });
    
    // Create JSON extractor
    const jsonExtractor = new MistralJsonExtractorProvider(io, mistralClient);
    
    // Create receipt extractor
    const receiptExtractor = new MistralReceiptExtractor(jsonExtractor);
    
    // Create and return unified processor
    return new UnifiedProcessor(ocrProvider, receiptExtractor);
  }
}