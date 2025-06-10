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
};

// Mock CloudflareAI that works
class MockWorkingCloudflareAI {
  async run(input: any) {
    return {
      response: JSON.stringify({
        data: 'extracted',
        confidence: 0.8
      })
    };
  }
}

// Mock CloudflareAI that fails
class MockFailingCloudflareAI {
  async run(input: any) {
    throw new Error('AI model execution failed');
  }
}

const mockConfidenceCalculator = new JsonExtractionConfidenceCalculator();

describe('CloudflareLlama33JsonExtractor', () => {
  let extractor: CloudflareLlama33JsonExtractor;
  let workingAI: MockWorkingCloudflareAI;
  let failingAI: MockFailingCloudflareAI;

  beforeEach(() => {
    workingAI = new MockWorkingCloudflareAI();
    failingAI = new MockFailingCloudflareAI();
  });

  it('should create instance with working AI', () => {
    extractor = new CloudflareLlama33JsonExtractor(mockIoE, workingAI as any, mockConfidenceCalculator);
    expect(extractor).toBeInstanceOf(CloudflareLlama33JsonExtractor);
  });

  it('should handle AI execution failures gracefully', async () => {
    extractor = new CloudflareLlama33JsonExtractor(mockIoE, failingAI as any, mockConfidenceCalculator);
    
    const request: JsonExtractionRequest = {
      markdown: 'Some text',
      schema: { type: 'object' }
    };

    const result = await extractor.extract(request);
    
    expect(result[0]).toBe('error');
    if (result[0] === 'error') {
      expect(result[1].message).toContain('AI model execution failed');
    }
  });

  it('should extract JSON data successfully with working AI', async () => {
    extractor = new CloudflareLlama33JsonExtractor(mockIoE, workingAI as any, mockConfidenceCalculator);
    
    const request: JsonExtractionRequest = {
      markdown: 'Some text',
      schema: { type: 'object' }
    };

    const result = await extractor.extract(request);
    
    expect(result[0]).toBe('ok');
    if (result[0] === 'ok') {
      expect(result[1].json).toBeDefined();
      expect(result[1].confidence).toBeGreaterThan(0);
    }
  });
});