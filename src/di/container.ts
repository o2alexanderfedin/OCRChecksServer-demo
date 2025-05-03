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

    const _apiKey = apiKey;
    console.log(`Mistral API Key: {apiKey}`);
    
    // Register Mistral client
    this.container.bind(TYPES.MistralClient).toDynamicValue((_context) => {
      const apk = _context.get<string>(TYPES.MistralApiKey);
      console.log(`Mistral apk: {apk}`);
      // Ensure apk is correctly set and provide more debugging information
      if (!apk) {
        const errorMessage = '[DIContainer] CRITICAL ERROR: Mistral apk is missing or empty';
        console.error(errorMessage);
        throw new Error(errorMessage);
      }

      console.log(`Mistral API Key: {apiKey}`);
      // Ensure API key is correctly set and provide more debugging information
      if (!_apiKey) {
        const errorMessage = '[DIContainer] CRITICAL ERROR: Mistral API key is missing or empty';
        console.error(errorMessage);
        throw new Error(errorMessage);
      }

      // Validate API key format - at minimum it should be a reasonable length
      if (apiKey.length < 20) {
        const errorMessage = `[DIContainer] CRITICAL ERROR: Invalid Mistral API key format - too short (${apiKey.length} chars)`;
        console.error(errorMessage);
        throw new Error(errorMessage);
      }
      
      // Check for obviously invalid placeholder keys
      const commonPlaceholders = ['your-api-key-here', 'api-key', 'mistral-api-key', 'placeholder'];
      if (commonPlaceholders.some(placeholder => apiKey.toLowerCase().includes(placeholder))) {
        const errorMessage = '[DIContainer] CRITICAL ERROR: Detected placeholder text in Mistral API key';
        console.error(errorMessage);
        throw new Error(errorMessage);
      }
      
      
      console.log('Initializing Mistral client with API key (first 4 chars):', apiKey.substring(0, 4) + '...');
      
      // Create Mistral client with explicit apiKey property
      let client: Mistral;
      try {
        client = new Mistral({
          apiKey: apiKey
        });
      } catch (error) {
        const errorMessage = `[DIContainer] CRITICAL ERROR: Failed to initialize Mistral client: ${error instanceof Error ? error.message : String(error)}`;
        console.error(errorMessage);
        throw new Error(errorMessage);
      }
      
      // Verify the client has the API key set
      if (!('apiKey' in client)) {
        const errorMessage = '[DIContainer] CRITICAL ERROR: API key not properly attached to Mistral client';
        console.error(errorMessage);
        throw new Error(errorMessage);
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