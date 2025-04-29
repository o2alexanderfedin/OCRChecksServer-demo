import 'reflect-metadata';
import { DIContainer, TYPES } from '../../../src/di/container';
import { IoE } from '../../../src/ocr/types';
import { Mistral } from '@mistralai/mistralai';
import { MistralOCRProvider } from '../../../src/ocr/mistral';
import { MistralJsonExtractorProvider } from '../../../src/json/mistral';
import { ReceiptExtractor } from '../../../src/json/extractors/receipt-extractor';
import { ReceiptScanner } from '../../../src/processor/receipt-scanner';

describe('DIContainer', () => {
  // Mock IoE implementation as simple as possible
  const mockIoE = {
    fetch: async () => new Response(),
    atob: () => '',
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

  const testApiKey = 'test-api-key';

  it('should create a container with all dependencies registered', () => {
    // Create container and register dependencies
    const container = new DIContainer().registerMistralDependencies(mockIoE, testApiKey);
    
    // Verify that we can get the IoE instance
    const io = container.get<IoE>(TYPES.IoE);
    expect(io).toBeDefined();
    expect(io).toBe(mockIoE);
    
    // Verify that API key is registered correctly
    const apiKey = container.get<string>(TYPES.MistralApiKey);
    expect(apiKey).toBe(testApiKey);
    
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
    
    // Check receipt scanner
    const receiptScanner = container.get(TYPES.ReceiptScanner);
    expect(receiptScanner).toBeDefined();
    expect(receiptScanner instanceof ReceiptScanner).toBe(true);
  });

  it('should provide a convenience method to get ReceiptScanner', () => {
    // Create container and register dependencies
    const container = new DIContainer().registerMistralDependencies(mockIoE, testApiKey);
    
    // Get receipt scanner using convenience method
    const receiptScanner = container.getReceiptScanner();
    expect(receiptScanner).toBeDefined();
    expect(receiptScanner instanceof ReceiptScanner).toBe(true);
  });

  it('should maintain singleton instances', () => {
    // Create container and register dependencies
    const container = new DIContainer().registerMistralDependencies(mockIoE, testApiKey);
    
    // Get instances multiple times to check singleton behavior
    const mistralClient1 = container.get<Mistral>(TYPES.MistralClient);
    const mistralClient2 = container.get<Mistral>(TYPES.MistralClient);
    expect(mistralClient1).toBe(mistralClient2); // Should be the same instance
    
    const ocrProvider1 = container.get(TYPES.OCRProvider);
    const ocrProvider2 = container.get(TYPES.OCRProvider);
    expect(ocrProvider1).toBe(ocrProvider2); // Should be the same instance
  });
});