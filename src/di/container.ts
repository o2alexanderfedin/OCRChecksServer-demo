import 'reflect-metadata';
import { Container } from 'inversify';
import { IoE } from '../ocr/types';
import { MistralOCRProvider } from '../ocr/mistral';
import { MistralJsonExtractorProvider } from '../json/mistral';
import { ReceiptExtractor } from '../json/extractors/receipt-extractor';
import { CheckExtractor } from '../json/extractors/check-extractor';
import { ReceiptScanner } from '../scanner/receipt-scanner';
import { CheckScanner } from '../scanner/check-scanner';
import { Mistral } from '@mistralai/mistralai';

// Create symbols for dependency identifiers
export const TYPES = {
  IoE: Symbol.for('IoE'),
  MistralApiKey: Symbol.for('MistralApiKey'),
  MistralClient: Symbol.for('MistralClient'),
  OCRProvider: Symbol.for('OCRProvider'),
  JsonExtractorProvider: Symbol.for('JsonExtractorProvider'),
  ReceiptExtractor: Symbol.for('ReceiptExtractor'),
  CheckExtractor: Symbol.for('CheckExtractor'),
  ReceiptScanner: Symbol.for('ReceiptScanner'),
  CheckScanner: Symbol.for('CheckScanner')
};

export class DIContainer {
  private container: Container;

  constructor() {
    this.container = new Container();
  }

  /**
   * Register all dependencies with default Mistral implementation
   * 
   * @param io - The IO interface for network operations
   * @param apiKey - Mistral API key
   */
  registerMistralDependencies(io: IoE, apiKey: string): DIContainer {
    // Register basic dependencies
    this.container.bind(TYPES.IoE).toConstantValue(io);
    this.container.bind(TYPES.MistralApiKey).toConstantValue(apiKey);
    
    // Register Mistral client
    this.container.bind(TYPES.MistralClient).toDynamicValue((_context) => {
      // Ensure API key is correctly set and provide more debugging information
      if (!apiKey) {
        console.error('Missing API key in container initialization');
        throw new Error('Mistral API key is required but was not provided');
      }
      
      console.log('Initializing Mistral client with API key (first 4 chars):', apiKey.substring(0, 4) + '...');
      
      // Create Mistral client with explicit apiKey property
      const client = new Mistral({
        apiKey: apiKey
      });
      
      // Verify the client has the API key set
      if (!(client as any).apiKey) {
        console.error('API key not properly attached to Mistral client');
        // Add the API key directly to the client instance for greater compatibility
        (client as any).apiKey = apiKey;
      }
      
      return client;
    }).inSingletonScope();
    
    // Register OCR provider
    this.container.bind(TYPES.OCRProvider).toDynamicValue((_context) => {
      const io = this.container.get<IoE>(TYPES.IoE);
      const mistralClient = this.container.get<Mistral>(TYPES.MistralClient);
      return new MistralOCRProvider(io, mistralClient);
    }).inSingletonScope();
    
    // Register JSON extractor provider
    this.container.bind(TYPES.JsonExtractorProvider).toDynamicValue((_context) => {
      const io = this.container.get<IoE>(TYPES.IoE);
      const mistralClient = this.container.get<Mistral>(TYPES.MistralClient);
      return new MistralJsonExtractorProvider(io, mistralClient);
    }).inSingletonScope();
    
    // Register receipt extractor
    this.container.bind(TYPES.ReceiptExtractor).toDynamicValue((_context) => {
      const jsonExtractor = this.container.get<MistralJsonExtractorProvider>(TYPES.JsonExtractorProvider);
      return new ReceiptExtractor(jsonExtractor);
    }).inSingletonScope();
    
    // Register check extractor
    this.container.bind(TYPES.CheckExtractor).toDynamicValue((_context) => {
      const jsonExtractor = this.container.get<MistralJsonExtractorProvider>(TYPES.JsonExtractorProvider);
      return new CheckExtractor(jsonExtractor);
    }).inSingletonScope();
    
    // Register receipt scanner
    this.container.bind(TYPES.ReceiptScanner).toDynamicValue((_context) => {
      const ocrProvider = this.container.get<MistralOCRProvider>(TYPES.OCRProvider);
      const receiptExtractor = this.container.get<ReceiptExtractor>(TYPES.ReceiptExtractor);
      return new ReceiptScanner(ocrProvider, receiptExtractor);
    }).inSingletonScope();
    
    // Register check scanner
    this.container.bind(TYPES.CheckScanner).toDynamicValue((_context) => {
      const ocrProvider = this.container.get<MistralOCRProvider>(TYPES.OCRProvider);
      const checkExtractor = this.container.get<CheckExtractor>(TYPES.CheckExtractor);
      return new CheckScanner(ocrProvider, checkExtractor);
    }).inSingletonScope();
    
    return this;
  }

  /**
   * Get an instance from the container
   * 
   * @param identifier - The symbol identifying the dependency
   * @returns The resolved instance
   */
  get<T>(identifier: symbol): T {
    return this.container.get<T>(identifier);
  }

  /**
   * Get a ReceiptScanner instance
   * 
   * @returns A configured ReceiptScanner instance
   */
  getReceiptScanner(): ReceiptScanner {
    return this.container.get<ReceiptScanner>(TYPES.ReceiptScanner);
  }
  
  /**
   * Get a CheckScanner instance
   * 
   * @returns A configured CheckScanner instance
   */
  getCheckScanner(): CheckScanner {
    return this.container.get<CheckScanner>(TYPES.CheckScanner);
  }
}

// Export a default container instance
export const container = new DIContainer();