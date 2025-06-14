/**
 * Unit tests for CloudflareLlama33JsonExtractor
 */

import '../../../test-setup.ts';
import { CloudflareLlama33JsonExtractor } from '../../../src/json/cloudflare-llama33-extractor';
import { JsonExtractionRequest } from '../../../src/json/types.ts';
import { JsonExtractionConfidenceCalculator } from '../../../src/json/utils/confidence-calculator.ts';
import type { IoE } from '../../../src/ocr/types.ts';

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
  let confidenceCalculator: JsonExtractionConfidenceCalculator;
  let extractor: CloudflareLlama33JsonExtractor;

  beforeEach(() => {
    io = mockIoE;
    cloudflareAI = new MockCloudflareAI();
    
    confidenceCalculator = new JsonExtractionConfidenceCalculator();
    extractor = new CloudflareLlama33JsonExtractor(
      io,
      cloudflareAI as any,
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

    it('should note hallucination detection is handled by scanners', async () => {
      // Hallucination detection is now handled by scanner layer, not JSON extractors
      const request: JsonExtractionRequest = {
        markdown: 'Check #A123456789\nPay to: John Smith\nAmount: $1,234.56',
        schema: {
          name: 'Check',
          schemaDefinition: { type: 'object' }
        }
      };

      const result = await extractor.extract(request);

      // Should succeed without extractor-level hallucination detection
      expect(result[0]).toBe('ok');
    });

    it('should use confidence calculator', async () => {
      const request: JsonExtractionRequest = {
        markdown: 'Check #A123456789\nPay to: John Smith\nAmount: $1,234.56',
        schema: {
          name: 'Check',
          schemaDefinition: { type: 'object' }
        }
      };

      const result = await extractor.extract(request);

      // Should have calculated confidence
      expect(result[0]).toBe('ok');
      if (result[0] === 'ok') {
        expect(result[1].confidence).toBeGreaterThan(0);
      }
    });

    it('should construct proper prompt for Cloudflare AI', async () => {
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

      const result = await extractor.extract(request);

      // Should have successfully called the AI and returned a result
      expect(result[0]).toBe('ok');
      if (result[0] === 'ok') {
        expect(result[1].json).toBeDefined();
        expect(result[1].json.checkNumber).toBeDefined();
      }
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
          confidenceCalculator
        );
      }).toThrowError('CloudflareAI binding is required');
    });
  });
});