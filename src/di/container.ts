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
import { RetryConfig } from '@mistralai/mistralai/lib/retries.js';
// Import config as a static file
// Optimized for Cloudflare Worker environment which has a 30-second execution limit
const mistralClientConfig = {
  retryConfig: {
    strategy: "backoff",
    backoff: {
      initialInterval: 500,     // Reduced to allow more retry attempts within the timeframe
      maxInterval: 10000,       // Keep max interval the same
      exponent: 1.8,            // Increased for more aggressive backoff
      maxElapsedTime: 25000     // Reduced to ensure we stay under Cloudflare's 30s limit
    },
    retryConnectionErrors: true
  },
  timeoutMs: 15000              // Reduced timeout to prevent single request from consuming too much time
};

/**
 * Symbols for dependency identifiers - used for type-safe dependency injection
 */
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

/**
 * Dependency Injection Container for managing application dependencies
 * Handles the creation and lifetime of service objects
 */
export class DIContainer {
  protected readonly container: Container;

  constructor() {
    this.container = new Container();
  }

  /**
   * Register all dependencies with Mistral implementation
   * 
   * @param io - The IO interface for network operations
   * @param apiKey - Mistral API key
   * @returns The container instance for method chaining
   */
  registerMistralDependencies(io: IoE, apiKey: string): DIContainer {
    // Register basic dependencies
    this.container.bind(TYPES.IoE).toConstantValue(io);
    this.container.bind(TYPES.MistralApiKey).toConstantValue(apiKey);

    this.registerMistralClient();
    this.registerProviders();
    this.registerExtractors();
    this.registerScanners();
    
    return this;
  }

  /**
   * Register Mistral client with validation
   * @protected
   */
  protected registerMistralClient(): void {
    this.container.bind(TYPES.MistralClient).toDynamicValue((context) => {
      const apiKey = context.get<string>(TYPES.MistralApiKey);
      const io = context.get<IoE>(TYPES.IoE);
      
      // Validate API key is present and valid
      this.validateApiKey(apiKey);
      
      // Create Mistral client with validated API key and configuration from JSON
      try {
        // Log client configuration (without sensitive values)
        io.debug('Initializing Mistral client with configuration:', {
          retryStrategy: mistralClientConfig.retryConfig.strategy,
          retryBackoffSettings: mistralClientConfig.retryConfig.backoff,
          retryConnectionErrors: mistralClientConfig.retryConfig.retryConnectionErrors,
          timeoutMs: mistralClientConfig.timeoutMs
        });
        
        // Always use the real Mistral client - this ensures proper structure 
        // for validation in provider constructors, while being simple to test
        // Use type assertion to handle the string literal type expected by the SDK
        const typedRetryConfig: RetryConfig = {
          ...mistralClientConfig.retryConfig,
          strategy: mistralClientConfig.retryConfig.strategy as 'backoff' | 'none'
        };
        
        return new Mistral({ 
          apiKey,
          retryConfig: typedRetryConfig,
          timeoutMs: mistralClientConfig.timeoutMs
        });
      } catch (error) {
        const errorMessage = `[DIContainer] CRITICAL ERROR: Failed to initialize Mistral client: ${error instanceof Error ? error.message : String(error)}`;
        io.error(errorMessage);
        throw new Error(errorMessage);
      }
    }).inSingletonScope();
  }

  /**
   * Register OCR and JSON extractor providers
   * @protected
   */
  protected registerProviders(): void {
    // Register OCR provider
    this.container.bind(TYPES.OCRProvider).toDynamicValue((context) => {
      const io = context.get<IoE>(TYPES.IoE);
      const mistralClient = context.get<Mistral>(TYPES.MistralClient);
      return new MistralOCRProvider(io, mistralClient);
    }).inSingletonScope();
    
    // Register JSON extractor provider
    this.container.bind(TYPES.JsonExtractorProvider).toDynamicValue((context) => {
      const io = context.get<IoE>(TYPES.IoE);
      const mistralClient = context.get<Mistral>(TYPES.MistralClient);
      return new MistralJsonExtractorProvider(io, mistralClient);
    }).inSingletonScope();
  }

  /**
   * Register receipt and check extractors
   * @protected
   */
  protected registerExtractors(): void {
    // Register receipt extractor
    this.container.bind(TYPES.ReceiptExtractor).toDynamicValue((context) => {
      const jsonExtractor = context.get<MistralJsonExtractorProvider>(TYPES.JsonExtractorProvider);
      return new ReceiptExtractor(jsonExtractor);
    }).inSingletonScope();
    
    // Register check extractor
    this.container.bind(TYPES.CheckExtractor).toDynamicValue((context) => {
      const jsonExtractor = context.get<MistralJsonExtractorProvider>(TYPES.JsonExtractorProvider);
      return new CheckExtractor(jsonExtractor);
    }).inSingletonScope();
  }

  /**
   * Register receipt and check scanners
   * @protected
   */
  protected registerScanners(): void {
    // Register receipt scanner
    this.container.bind(TYPES.ReceiptScanner).toDynamicValue((context) => {
      const ocrProvider = context.get<MistralOCRProvider>(TYPES.OCRProvider);
      const receiptExtractor = context.get<ReceiptExtractor>(TYPES.ReceiptExtractor);
      return new ReceiptScanner(ocrProvider, receiptExtractor);
    }).inSingletonScope();
    
    // Register check scanner
    this.container.bind(TYPES.CheckScanner).toDynamicValue((context) => {
      const ocrProvider = context.get<MistralOCRProvider>(TYPES.OCRProvider);
      const checkExtractor = context.get<CheckExtractor>(TYPES.CheckExtractor);
      return new CheckScanner(ocrProvider, checkExtractor);
    }).inSingletonScope();
  }

  /**
   * Validate that an API key is present and in the correct format
   * 
   * @param apiKey - The API key to validate
   * @protected
   */
  protected validateApiKey(apiKey: string): void {
    // Log partial key for debugging (first 4 chars only)
    const maskedKey = apiKey ? `${apiKey.substring(0, 4)}...` : 'undefined';
    console.log(`Validating Mistral API key: ${maskedKey}`);
    
    // Ensure API key is present
    if (!apiKey) {
      throw new Error('[DIContainer] CRITICAL ERROR: Mistral API key is missing or empty');
    }

    // Validate API key length
    if (apiKey.length < 20) {
      throw new Error(`[DIContainer] CRITICAL ERROR: Invalid Mistral API key format - too short (${apiKey.length} chars)`);
    }
    
    // Check for obviously invalid placeholder keys
    const commonPlaceholders = ['your-api-key-here', 'api-key', 'mistral-api-key', 'placeholder'];
    if (commonPlaceholders.some(placeholder => apiKey.toLowerCase().includes(placeholder))) {
      throw new Error('[DIContainer] CRITICAL ERROR: Detected placeholder text in Mistral API key');
    }
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