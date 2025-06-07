/**
 * Unit tests for CloudflareLlama33JsonExtractor
 */

import { CloudflareLlama33JsonExtractor } from '../../../src/json/cloudflare-llama33-extractor.js';
import { JsonExtractionRequest } from '../../../src/json/types.js';
import { AntiHallucinationDetector } from '../../../src/json/utils/anti-hallucination-detector.js';
import { JsonExtractionConfidenceCalculator } from '../../../src/json/utils/confidence-calculator.js';
import type { IoE } from '../../../src/ocr/types.js';

// Mock implementations
class MockIoE implements IoE {
  readonly fetch = async (url: string, options: RequestInit): Promise<Response> => {
    return new Response();
  };
  
  readonly atob = (data: string): string => {
    return Buffer.from(data, 'base64').toString();
  };
  
  readonly log = (message: string): void => {
    console.log(message);
  };
  
  readonly debug = (message: string, data?: unknown): void => {
    console.log(message, data);
  };
  
  readonly warn = (message: string, data?: unknown): void => {
    console.warn(message, data);
  };
  
  readonly error = (message: string, error?: unknown): void => {
    console.error(message, error);
  };
  
  readonly trace = (source: string, methodName: string, args?: unknown): void => {
    console.log(`[${source}:${methodName}]`, args);
  };
}

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
  let antiHallucinationDetector: AntiHallucinationDetector;
  let confidenceCalculator: JsonExtractionConfidenceCalculator;
  let extractor: CloudflareLlama33JsonExtractor;

  beforeEach(() => {
    io = new MockIoE();
    cloudflareAI = new MockCloudflareAI();
    antiHallucinationDetector = new AntiHallucinationDetector();
    confidenceCalculator = new JsonExtractionConfidenceCalculator();
    extractor = new CloudflareLlama33JsonExtractor(
      io,
      cloudflareAI as any,
      antiHallucinationDetector,
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
        io,
        new MockFailingCloudflareAI() as any,
        antiHallucinationDetector,
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

    it('should use anti-hallucination detection', async () => {
      // Create a spy to verify the method is called
      const detectSpy = spyOn(antiHallucinationDetector, 'detectCheckHallucinations');

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
          antiHallucinationDetector,
          confidenceCalculator
        );
      }).toThrow('CloudflareAI binding is required');
    });
  });
});