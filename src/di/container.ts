import 'reflect-metadata';
import { Container } from 'inversify';
import { IoE } from '../ocr/types';
import { MistralOCRProvider } from '../ocr/mistral';
import { MistralJsonExtractorProvider } from '../json/mistral';
import { ReceiptExtractor } from '../json/extractors/receipt-extractor';
import { ReceiptScanner } from '../processor/unified-processor';
import { Mistral } from '@mistralai/mistralai';

// Create symbols for dependency identifiers
export const TYPES = {
  IoE: Symbol.for('IoE'),
  MistralApiKey: Symbol.for('MistralApiKey'),
  MistralClient: Symbol.for('MistralClient'),
  OCRProvider: Symbol.for('OCRProvider'),
  JsonExtractorProvider: Symbol.for('JsonExtractorProvider'),
  ReceiptExtractor: Symbol.for('ReceiptExtractor'),
  ReceiptScanner: Symbol.for('ReceiptScanner')
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
      return new Mistral({ apiKey });
    }).inSingletonScope();
    
    // Register OCR provider
    this.container.bind(TYPES.OCRProvider).toDynamicValue((context) => {
      const io = context.container.get<IoE>(TYPES.IoE);
      const mistralApiKey = context.container.get<string>(TYPES.MistralApiKey);
      return new MistralOCRProvider(io, { apiKey: mistralApiKey });
    }).inSingletonScope();
    
    // Register JSON extractor provider
    this.container.bind(TYPES.JsonExtractorProvider).toDynamicValue((context) => {
      const io = context.container.get<IoE>(TYPES.IoE);
      const mistralClient = context.container.get<Mistral>(TYPES.MistralClient);
      return new MistralJsonExtractorProvider(io, mistralClient);
    }).inSingletonScope();
    
    // Register receipt extractor
    this.container.bind(TYPES.ReceiptExtractor).toDynamicValue((context) => {
      const jsonExtractor = context.container.get(TYPES.JsonExtractorProvider);
      return new ReceiptExtractor(jsonExtractor);
    }).inSingletonScope();
    
    // Register receipt scanner
    this.container.bind(TYPES.ReceiptScanner).toDynamicValue((context) => {
      const ocrProvider = context.container.get(TYPES.OCRProvider);
      const receiptExtractor = context.container.get(TYPES.ReceiptExtractor);
      return new ReceiptScanner(ocrProvider, receiptExtractor);
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
}

// Export a default container instance
export const container = new DIContainer();