import 'reflect-metadata';
import { DIContainer, TYPES } from '../../../src/di/container';
import { IoE } from '../../../src/ocr/types';
import { Mistral } from '@mistralai/mistralai';
import { MistralOCRProvider } from '../../../src/ocr/mistral';
import { MistralJsonExtractorProvider } from '../../../src/json/mistral';
import { ReceiptExtractor } from '../../../src/json/extractors/receipt-extractor';
import { CheckExtractor } from '../../../src/json/extractors/check-extractor';
import { ReceiptScanner } from '../../../src/scanner/receipt-scanner';
import { CheckScanner } from '../../../src/scanner/check-scanner';

describe('DIContainer', () => {
  // Mock IoE implementation as simple as possible
  const mockIoE = {
    fetch: async () => new Response(),
    atob: () => '',
    log: () => {},
    debug: () => {},
    warn: () => {},
    error: () => {},
    trace: () => {},
    console: {
      log: () => {},
      error: () => {}
    },
    fs: {
      writeFileSync: () => {},
      readFileSync: () => '',
      existsSync: () => false,
      promises: {
        readFile: async () => '',
        writeFile: async () => {},
        readdir: async () => [],
        rm: async () => {},
        mkdir: async () => undefined,
        copyFile: async () => {}
      }
    },
    process: {
      argv: [],
      env: {},
      exit: () => { throw new Error('exit called'); },
      cwd: () => ''
    },
    asyncImport: async () => ({ default: {} }),
    performance: {
      now: () => 0
    },
    tryCatch: <T>(fn: () => T) => {
      try {
        return ['ok', fn()] as const;
      } catch (error) {
        return ['error', error] as const;
      }
    },
    asyncTryCatch: async <T>(fn: () => Promise<T>) => {
      try {
        return ['ok', await fn()] as const;
      } catch (error) {
        return ['error', error] as const;
      }
    }
  };

  // Valid API key for successful tests (at least 20 chars without placeholder text)
  const validApiKey = "test_valid_api_key_123456789012345678901234567890";

  describe('Basic functionality', () => {
    it('should create a container with all dependencies registered', () => {
      // Create container and register dependencies
      const container = new DIContainer().registerMistralDependencies(mockIoE, validApiKey);
      
      // Verify that we can get the IoE instance
      const io = container.get<IoE>(TYPES.IoE);
      expect(io).toBeDefined();
      expect(io).toBe(mockIoE);
      
      // Verify that API key is registered correctly
      const apiKey = container.get<string>(TYPES.MistralApiKey);
      expect(apiKey).toBe(validApiKey);
      
      // Check that Mistral client is created correctly
      const mistralClient = container.get<Mistral>(TYPES.MistralClient);
      expect(mistralClient).toBeDefined();
      expect(mistralClient instanceof Mistral).toBe(true);
      
      // Check OCR provider
      const ocrProvider = container.get(TYPES.OCRProvider);
      expect(ocrProvider).toBeDefined();
      expect(ocrProvider instanceof MistralOCRProvider).toBe(true);
      
      // Check JSON extractor provider
      const jsonExtractor = container.get(TYPES.JsonExtractorProvider);
      expect(jsonExtractor).toBeDefined();
      expect(jsonExtractor instanceof MistralJsonExtractorProvider).toBe(true);
      
      // Check receipt extractor
      const receiptExtractor = container.get(TYPES.ReceiptExtractor);
      expect(receiptExtractor).toBeDefined();
      expect(receiptExtractor instanceof ReceiptExtractor).toBe(true);
      
      // Check check extractor
      const checkExtractor = container.get(TYPES.CheckExtractor);
      expect(checkExtractor).toBeDefined();
      expect(checkExtractor instanceof CheckExtractor).toBe(true);
      
      // Check receipt scanner
      const receiptScanner = container.get(TYPES.ReceiptScanner);
      expect(receiptScanner).toBeDefined();
      expect(receiptScanner instanceof ReceiptScanner).toBe(true);
      
      // Check check scanner
      const checkScanner = container.get(TYPES.CheckScanner);
      expect(checkScanner).toBeDefined();
      expect(checkScanner instanceof CheckScanner).toBe(true);
    });

    it('should provide convenience methods to get scanners', () => {
      // Create container and register dependencies
      const container = new DIContainer().registerMistralDependencies(mockIoE, validApiKey);
      
      // Get receipt scanner using convenience method
      const receiptScanner = container.getReceiptScanner();
      expect(receiptScanner).toBeDefined();
      expect(receiptScanner instanceof ReceiptScanner).toBe(true);
      
      // Get check scanner using convenience method
      const checkScanner = container.getCheckScanner();
      expect(checkScanner).toBeDefined();
      expect(checkScanner instanceof CheckScanner).toBe(true);
    });

    it('should maintain singleton instances', () => {
      // Create container and register dependencies
      const container = new DIContainer().registerMistralDependencies(mockIoE, validApiKey);
      
      // Get instances multiple times to check singleton behavior
      const mistralClient1 = container.get<Mistral>(TYPES.MistralClient);
      const mistralClient2 = container.get<Mistral>(TYPES.MistralClient);
      expect(mistralClient1).toBe(mistralClient2); // Should be the same instance
      
      const ocrProvider1 = container.get(TYPES.OCRProvider);
      const ocrProvider2 = container.get(TYPES.OCRProvider);
      expect(ocrProvider1).toBe(ocrProvider2); // Should be the same instance
      
      const receiptScanner1 = container.getReceiptScanner();
      const receiptScanner2 = container.getReceiptScanner();
      expect(receiptScanner1).toBe(receiptScanner2); // Should be the same instance
      
      const checkScanner1 = container.getCheckScanner();
      const checkScanner2 = container.getCheckScanner();
      expect(checkScanner1).toBe(checkScanner2); // Should be the same instance
    });
  });

  describe('API Key validation', () => {
    it('should throw an error for empty API key', () => {
      // Arrange
      const emptyApiKey = '';
      const container = new DIContainer();
      
      // Act & Assert
      expect(() => {
        container.registerMistralDependencies(mockIoE, emptyApiKey);
        container.get<Mistral>(TYPES.MistralClient); // This triggers the validation
      }).toThrow(/CRITICAL ERROR: Mistral API key is missing or empty/);
    });
    
    it('should throw an error for short API key', () => {
      // Arrange
      const shortApiKey = 'tooshort';
      const container = new DIContainer();
      
      // Act & Assert
      expect(() => {
        container.registerMistralDependencies(mockIoE, shortApiKey);
        container.get<Mistral>(TYPES.MistralClient); // This triggers the validation
      }).toThrow(/CRITICAL ERROR: Invalid Mistral API key format - too short/);
    });
    
    it('should throw an error for placeholder API keys', () => {
      // Arrange - Test keys with placeholder text
      const placeholderKeys = [
        'your-api-key-here-1234567890abcdef',
        'test_api-key_12345678901234567890',
        'mistral-api-key-1234567890abcdefg',
        'placeholder-key-1234567890abcdefg',
      ];
      
      // Act & Assert - Test each placeholder key
      placeholderKeys.forEach(placeholderKey => {
        const container = new DIContainer();
        expect(() => {
          container.registerMistralDependencies(mockIoE, placeholderKey);
          container.get<Mistral>(TYPES.MistralClient); // This triggers the validation
        }).toThrow(/CRITICAL ERROR: Detected placeholder text in Mistral API key/);
      });
    });
  });
  
  describe('Dependency resolution', () => {
    // Create a container with dependencies for this test suite
    let container: DIContainer;
    
    beforeEach(() => {
      container = new DIContainer().registerMistralDependencies(mockIoE, validApiKey);
    });
    
    it('should correctly resolve OCR provider with its dependencies', () => {
      // Get the OCR provider
      const ocrProvider = container.get<MistralOCRProvider>(TYPES.OCRProvider);
      
      // Check the instance type
      expect(ocrProvider).toBeDefined();
      expect(ocrProvider instanceof MistralOCRProvider).toBe(true);
      
      // Note: We can't easily test that internal dependencies like mistralClient 
      // and io are correctly injected without exposing them, but the instance
      // creation would fail if they weren't properly resolved
    });
    
    it('should correctly resolve the receipt scanner with its dependencies', () => {
      // Get the receipt scanner
      const receiptScanner = container.getReceiptScanner();
      
      // Check the instance type
      expect(receiptScanner).toBeDefined();
      expect(receiptScanner instanceof ReceiptScanner).toBe(true);
      
      // Note: We can't easily test that internal dependencies like ocrProvider
      // and receiptExtractor are correctly injected without exposing them
    });
    
    it('should correctly resolve the check scanner with its dependencies', () => {
      // Get the check scanner
      const checkScanner = container.getCheckScanner();
      
      // Check the instance type
      expect(checkScanner).toBeDefined();
      expect(checkScanner instanceof CheckScanner).toBe(true);
      
      // Note: We can't easily test that internal dependencies like ocrProvider
      // and checkExtractor are correctly injected without exposing them
    });
  });
});