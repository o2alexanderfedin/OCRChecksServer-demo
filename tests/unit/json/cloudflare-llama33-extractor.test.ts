/**
 * Unit tests for CloudflareLlama33JsonExtractor
 */

import { CloudflareLlama33JsonExtractor } from '../../../src/json/cloudflare-llama33-extractor.js';
import { JsonExtractionRequest } from '../../../src/json/types.js';
import { HallucinationDetectorFactory } from '../../../src/json/utils/hallucination-detector-factory.js';
import { CheckHallucinationDetector } from '../../../src/json/utils/check-hallucination-detector.js';
import { ReceiptHallucinationDetector } from '../../../src/json/utils/receipt-hallucination-detector.js';
import { JsonExtractionConfidenceCalculator } from '../../../src/json/utils/confidence-calculator.js';
import type { IoE } from '../../../src/ocr/types.js';

// Mock implementations
const mockIoE: IoE = {
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
} as IoE;

class MockCloudflareAI {
  async run(model: string, inputs: any): Promise<any> {
    // Mock Cloudflare AI response for llama-3.3-70b-instruct-fp8-fast
    if (model === '@cf/meta/llama-3.3-70b-instruct-fp8-fast') {
      return {
        response: JSON.stringify({
          checkNumber: 'A123456789',
          payee: 'John Smith',
          amount: '1234.56',
          confidence: 0.9,
          isValidInput: true
        })
      };
    }
    throw new Error('Unknown model');
  }
}

class MockFailingCloudflareAI {
  async run(model: string, inputs: any): Promise<any> {
    throw new Error('AI model execution failed');
  }
}

describe('CloudflareLlama33JsonExtractor', () => {
  let io: IoE;
  let cloudflareAI: MockCloudflareAI;
  let hallucinationDetectorFactory: HallucinationDetectorFactory;
  let confidenceCalculator: JsonExtractionConfidenceCalculator;
  let extractor: CloudflareLlama33JsonExtractor;

  beforeEach(() => {
    io = mockIoE;
    cloudflareAI = new MockCloudflareAI();
    // Create mock detectors
    const checkDetector = new CheckHallucinationDetector();
    const receiptDetector = new ReceiptHallucinationDetector();
    hallucinationDetectorFactory = new HallucinationDetectorFactory(checkDetector, receiptDetector);
    
    confidenceCalculator = new JsonExtractionConfidenceCalculator();
    extractor = new CloudflareLlama33JsonExtractor(
      io,
      cloudflareAI as any,
      hallucinationDetectorFactory,
      confidenceCalculator
    );
  });

  describe('extract', () => {
    it('should extract JSON data successfully', async () => {
      // Red phase: This test should fail initially
      const request: JsonExtractionRequest = {
        markdown: 'Check #A123456789\nPay to: John Smith\nAmount: $1,234.56',
        schema: {
          name: 'Check',
          schemaDefinition: {
            type: 'object',
            properties: {
              checkNumber: { type: 'string' },
              payee: { type: 'string' },
              amount: { type: 'string' },
              confidence: { type: 'number' },
              isValidInput: { type: 'boolean' }
            }
          }
        }
      };

      const result = await extractor.extract(request);

      expect(result[0]).toBe('ok');
      if (result[0] === 'ok') {
        expect(result[1].json).toBeDefined();
        expect(result[1].json.checkNumber).toBe('A123456789');
        expect(result[1].json.payee).toBe('John Smith');
        expect(result[1].json.amount).toBe('1234.56');
        expect(result[1].confidence).toBeGreaterThan(0);
        expect(result[1].confidence).toBeLessThanOrEqual(1);
      }
    });

    it('should handle AI execution failures', async () => {
      const failingExtractor = new CloudflareLlama33JsonExtractor(
        mockIoE,
        new MockFailingCloudflareAI() as any,
        hallucinationDetectorFactory,
        confidenceCalculator
      );

      const request: JsonExtractionRequest = {
        markdown: 'Some text',
        schema: {
          name: 'Test',
          schemaDefinition: { type: 'object' }
        }
      };

      const result = await failingExtractor.extract(request);

      expect(result[0]).toBe('error');
      if (result[0] === 'error') {
        expect(result[1]).toBeInstanceOf(Error);
        expect(result[1].message).toContain('AI model execution failed');
      }
    });

    it('should handle requests without schema', async () => {
      const request: JsonExtractionRequest = {
        markdown: 'Check #A123456789\nPay to: John Smith\nAmount: $1,234.56'
      };

      const result = await extractor.extract(request);

      expect(result[0]).toBe('ok');
      if (result[0] === 'ok') {
        expect(result[1].json).toBeDefined();
        expect(result[1].confidence).toBeGreaterThan(0);
      }
    });

    it('should use SOLID-compliant hallucination detection', async () => {
      // Create a spy to verify the factory method is called
      const detectSpy = spyOn(hallucinationDetectorFactory, 'detectHallucinations');

      const request: JsonExtractionRequest = {
        markdown: 'Check #A123456789\nPay to: John Smith\nAmount: $1,234.56',
        schema: {
          name: 'Check',
          schemaDefinition: { type: 'object' }
        }
      };

      await extractor.extract(request);

      // Should have called anti-hallucination detection
      expect(detectSpy).toHaveBeenCalled();
    });

    it('should use confidence calculator', async () => {
      // Create a spy to verify the method is called
      const calculateSpy = spyOn(confidenceCalculator, 'calculateConfidence');

      const request: JsonExtractionRequest = {
        markdown: 'Check #A123456789\nPay to: John Smith\nAmount: $1,234.56',
        schema: {
          name: 'Check',
          schemaDefinition: { type: 'object' }
        }
      };

      await extractor.extract(request);

      // Should have called confidence calculation
      expect(calculateSpy).toHaveBeenCalled();
    });

    it('should construct proper prompt for Cloudflare AI', async () => {
      // Create a spy to verify the AI is called with proper parameters
      const runSpy = spyOn(cloudflareAI, 'run');

      const request: JsonExtractionRequest = {
        markdown: 'Check #A123456789\nPay to: John Smith\nAmount: $1,234.56',
        schema: {
          name: 'Check',
          schemaDefinition: {
            type: 'object',
            properties: {
              checkNumber: { type: 'string' }
            }
          }
        }
      };

      await extractor.extract(request);

      expect(runSpy).toHaveBeenCalledWith(
        '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
        jasmine.objectContaining({
          messages: jasmine.arrayContaining([
            jasmine.objectContaining({
              role: 'system',
              content: jasmine.stringContaining('JSON extraction professional')
            }),
            jasmine.objectContaining({
              role: 'user',
              content: jasmine.stringContaining(request.markdown)
            })
          ])
        })
      );
    });
  });

  describe('constructor injection', () => {
    it('should be injectable with all dependencies', () => {
      expect(extractor).toBeInstanceOf(CloudflareLlama33JsonExtractor);
    });

    it('should throw error for invalid CloudflareAI binding', () => {
      expect(() => {
        new CloudflareLlama33JsonExtractor(
          io,
          null as any,
          hallucinationDetectorFactory,
          confidenceCalculator
        );
      }).toThrow('CloudflareAI binding is required');
    });
  });
});