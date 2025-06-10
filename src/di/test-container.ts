import { DIContainer } from './container.ts';
import { TYPES } from '../types/di-types.ts';
import { Mistral } from '@mistralai/mistralai.js';
import { IoE } from '../ocr/types.ts';
import { registerValidators } from '../validators.ts';

/**
 * Creates a mock Mistral client that passes instanceof checks
 * while providing customizable test responses
 * 
 * @param options Configuration options
 * @returns A Mistral instance with mocked behavior
 */
export function createMockMistral(options: {
  apiKey: string;
  io: IoE;
  mockOcrProcess?: (params: unknown) => Promise<unknown>;
  mockChatComplete?: (params: unknown) => Promise<unknown>;
}): Mistral {
  const { apiKey, io, mockOcrProcess, mockChatComplete } = options;
  
  // Create a real Mistral instance that will pass instanceof checks
  const mistralInstance = new Mistral({ apiKey });
  
  // Default OCR process implementation
  const defaultOcrProcess = async (): Promise<unknown> => ({
    model: 'mistral-ocr-latest',
    pages: [
      {
        index: 0,
        markdown: 'Mock OCR result text for testing purposes. This text simulates OCR output.',
        dimensions: { width: 800, height: 600, dpi: 300 }
      }
    ],
    usageInfo: { pagesProcessed: 1 }
  });
  
  // Default chat complete implementation
  const defaultChatComplete = async (params: unknown): Promise<unknown> => {
    // Extract specific data parameters from the request to provide targeted mocks
    const content = (params as { messages?: { content?: string }[] })?.messages?.[1]?.content || '';
    
    io.debug(`Mock Mistral API received request with message: ${content.substring(0, 100)}...`);
    
    // If extracting check data (checks for specific content in our test file)
    if (content.includes('check') || content.includes('Check Number: A123456789')) {
      io.debug(`Returning mock check data response`);
      return {
        id: 'mock-chat-id',
        choices: [
          {
            message: { 
              content: JSON.stringify({
                checkNumber: 'A123456789',
                date: '2024-05-15',
                payee: 'John Smith', 
                amount: 1234.56,
                memo: 'Consulting services',
                bankName: 'First National Bank',
                routingNumber: '123456789',
                accountNumber: '9876543210'
              })
            },
            finishReason: 'stop'
          }
        ]
      };
    }
    
    // If we're extracting utility bill data with customer details
    // Check for content pattern in our test file
    if (content.includes('UTILITY BILL') || content.includes('Customer Name: James Wilson')) {
      io.debug(`Returning mock utility bill customer data response`);
      return {
        id: 'mock-chat-id',
        choices: [
          {
            message: { 
              content: JSON.stringify({
                customerName: 'James Wilson',
                accountNumber: '987654321',
                serviceAddress: '123 Main St, Anytown, USA',
                billingDate: '2024-04-01',
                dueDate: '2024-04-15',
                charges: {
                  electricity: 85.45,
                  water: 32.18,
                  sewer: 28.50,
                  trash: 24.99,
                  tax: 10.67
                },
                totalAmountDue: 181.79,
                previousBalance: 175.32,
                payments: -175.32,
                currentCharges: 181.79
              })
            },
            finishReason: 'stop'
          }
        ]
      };
    }
    
    // If we're extracting OCR output with invoice data
    if (content.includes('PLEASE DETACH HERE') || content.includes('Invoice Number: 022756875')) {
      io.debug(`Returning mock invoice data response`);
      return {
        id: 'mock-chat-id',
        choices: [
          {
            message: { 
              content: JSON.stringify({
                invoiceNumber: '022756875',
                invoiceDate: '2024-03-14',
                amountDue: 3399.21,
                dueDate: '2024-04-01',
                charges: [
                  {
                    utility: 'Cold Water',
                    provider: 'Water Company',
                    startDate: '2024-02-05',
                    endDate: '2024-03-05',
                    meterStart: 12400,
                    meterEnd: 12880,
                    totalUsage: '480 Gal',
                    costPerUnit: 0.0107,
                    total: 5.15
                  },
                  {
                    utility: 'Hot Water',
                    provider: 'San Jose Water Company',
                    startDate: '2024-02-05',
                    endDate: '2024-03-05',
                    meterStart: 9110,
                    meterEnd: 9860,
                    totalUsage: '750 Gal',
                    costPerUnit: 0.0107,
                    total: 8.04
                  }
                ]
              })
            },
            finishReason: 'stop'
          }
        ]
      };
    }
    
    // Default response (fallback)
    return {
      id: 'mock-chat-id',
      choices: [
        {
          message: { 
            content: JSON.stringify({
              checkNumber: 'DEFAULT12345',
              date: '2024-05-03',
              payee: 'Default Test Payee',
              amount: 123.45,
              memo: 'Default memo',
              customerName: 'Default Customer',
              accountNumber: '12345678',
              totalAmountDue: 123.45,
              invoiceNumber: '12345',
              amountDue: 123.45,
              dueDate: '2024-05-30'
            })
          },
          finishReason: 'stop'
        }
      ]
    };
  };
  
  // Use Object.defineProperty to add mock implementations while preserving instanceof
  Object.defineProperty(mistralInstance, 'ocr', {
    get: function() {
      io.debug('Using mock OCR implementation');
      
      return {
        process: async (params: unknown): Promise<unknown> => {
          io.debug('Mock Mistral.ocr.process called with:', params);
          const processImpl = mockOcrProcess || defaultOcrProcess;
          return processImpl(params);
        }
      };
    },
    configurable: true
  });
  
  Object.defineProperty(mistralInstance, 'chat', {
    get: function() {
      io.debug('Using mock chat implementation');
      
      return {
        complete: async (params: unknown): Promise<unknown> => {
          io.debug('Mock Mistral.chat.complete called with params');
          const completeImpl = mockChatComplete || defaultChatComplete;
          return completeImpl(params);
        }
      };
    },
    configurable: true
  });
  
  io.debug('Created mock Mistral client that passes instanceof checks');
  return mistralInstance;
}

/**
 * Test-specific DI container that mocks only the Mistral client
 * while using real implementations for all other dependencies
 */
export class TestDIContainer extends DIContainer {
  /**
   * Override the Mistral client registration to provide a test mock
   * that passes instanceof checks but doesn't make real API calls
   */
  protected override registerMistralClient(): void {
    this.container.bind(TYPES.MistralClient).toDynamicValue((context) => {
      const apiKey = context.get<string>(TYPES.MistralApiKey);
      const io = context.get<IoE>(TYPES.IoE);
      
      // Validate the API key as the real container would
      this.validateApiKey(apiKey);
      
      // Create a mock Mistral client that passes instanceof checks
      return createMockMistral({
        apiKey,
        io
      });
    }).inSingletonScope();
  }
  
  /**
   * Register all dependencies with test mocks, with relaxed validation for tests
   * Overrides the base implementation to ensure test-specific behavior
   * 
   * @param io - The IO interface for network operations
   * @param apiKey - Mistral API key
   * @param caller - caller of the method
   * @returns The container instance for method chaining
   * @throws Error if io or apiKey is not provided
   */
  override registerDependencies(io: IoE, apiKey: string, caller?: string): TestDIContainer {
    // For tests, perform basic validation but with more relaxed requirements
    if (!io) {
      throw new Error(`[DIContainer.${caller ?? 'registerDependencies'}] CRITICAL ERROR: IO interface is missing or undefined`);
    }
    
    if (!apiKey) {
      throw new Error(`[DIContainer.${caller ?? 'registerDependencies'}] CRITICAL ERROR: Mistral API key is missing or empty`);
    }
    
    // For tests, we accept any non-empty API key
    
    // Register basic dependencies
    this.container.bind(TYPES.IoE).toConstantValue(io);
    this.container.bind(TYPES.MistralApiKey).toConstantValue(apiKey);

    // Register all validators
    registerValidators(this.container);
    this.registerValidationMiddleware();
    
    // Register the standard components
    this.registerMistralClient();
    this.registerProviders();
    this.registerUtilities();
    this.registerExtractors();
    this.registerScanners();
    
    return this;
  }
  
  /**
   * Register all dependencies but using a mock Mistral client
   * 
   * @param io - The IO interface for network operations
   * @param apiKey - Mistral API key
   * @param caller - caller of the method
   * @param mockOptions - Optional customizations for the mock client
   * @returns The container instance for method chaining
   * @throws Error if io or apiKey is not provided
   */
  registerTestDependencies(
    io: IoE, 
    apiKey: string, 
    caller?: string,
    mockOptions?: {
      ocrProcess?: (params: unknown) => Promise<unknown>;
      chatComplete?: (params: unknown) => Promise<unknown>;
    }
  ): TestDIContainer {
    // First register dependencies with our overridden method
    this.registerDependencies(io, apiKey, caller);
    
    // Override MistralClient with our test-specific mock implementation 
    if (this.container.isBound(TYPES.MistralClient)) {
      this.container.unbind(TYPES.MistralClient);
    }
    this.container.bind(TYPES.MistralClient).toDynamicValue(() => {
      // Create a mock Mistral instance with custom implementations
      return createMockMistral({
        apiKey,
        io,
        mockOcrProcess: mockOptions?.ocrProcess,
        mockChatComplete: mockOptions?.chatComplete
      });
    }).inSingletonScope();
    
    return this;
  }
  

  /**
   * Creates a TestDIContainer with a mock Mistral client for testing purposes
   * 
   * @param io - The IO interface for logs
   * @param apiKey - API key to use (will be validated)
   * @param mockOptions - Optional customizations for the mock client
   * @returns The container instance for method chaining
   */
  static createForTests(
    io: IoE, 
    apiKey: string = 'test_valid_api_key_123456789012345678901234567890',
    mockOptions?: {
      ocrProcess?: (params: unknown) => Promise<unknown>;
      chatComplete?: (params: unknown) => Promise<unknown>;
    }
  ): TestDIContainer {
    const container = new TestDIContainer();
    
    // Use the registerTestDependencies method to set up the container
    container.registerTestDependencies(io, apiKey, 'createForTests', mockOptions);
    
    return container;
  }
}