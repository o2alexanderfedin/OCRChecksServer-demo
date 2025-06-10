/**
 * Unit tests for JsonExtractorFactory
 * Tests factory pattern implementation for runtime extractor selection
 */

import { JsonExtractorFactory } from '../../../../src/json/factory/json-extractor-factory';
import { JsonExtractorType, JsonExtractorFactoryConfig, ExtractorAvailabilityResult } from '../../../../src/json/factory/types.ts';
import { JsonExtractor } from '../../../../src/json/types.ts';
import { DIContainer } from '../../../../src/di/container.ts';
import { TYPES } from '../../../../src/types/di-types.ts';
import { IoE } from '../../../../src/ocr/types.ts';

// Mock IO implementation for testing
const createMockIO = (): IoE => ({
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
} as IoE);

describe('JsonExtractorFactory', () => {
  let factory: JsonExtractorFactory;
  let mockIO: IoE;
  let container: DIContainer;

  beforeEach(() => {
    mockIO = createMockIO();
    container = new DIContainer();
    container.registerDependencies(mockIO, 'test_api_key_123456789012345678901234567890', 'test');
    
    factory = new JsonExtractorFactory(mockIO, {
      container: container.getContainer()
    });
  });

  describe('createExtractor', () => {
    it('should create Mistral extractor when configured', async () => {
      const config: JsonExtractorFactoryConfig = {
        extractorType: JsonExtractorType.MISTRAL
      };

      const extractor = await factory.createExtractor(config);
      expect(extractor).toBeDefined();
      expect(extractor.constructor.name).toBe('MistralJsonExtractorProvider');
    });

    it('should create Cloudflare extractor when configured', async () => {
      const config: JsonExtractorFactoryConfig = {
        extractorType: JsonExtractorType.CLOUDFLARE
      };

      const extractor = await factory.createExtractor(config);
      expect(extractor).toBeDefined();
      expect(extractor.constructor.name).toBe('CloudflareLlama33JsonExtractor');
    });

    it('should throw error for unknown extractor type', async () => {
      const config: JsonExtractorFactoryConfig = {
        extractorType: 'unknown' as JsonExtractorType
      };

      try {
        await factory.createExtractor(config);
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.message).toContain('Invalid configuration');
      }
    });

    it('should handle configuration with options', async () => {
      const config: JsonExtractorFactoryConfig = {
        extractorType: JsonExtractorType.MISTRAL,
        fallbackType: JsonExtractorType.CLOUDFLARE,
        validateAvailability: false, // Skip validation for this test
        options: {
          timeout: 30000,
          maxRetries: 3,
          enableLogging: true
        }
      };

      const extractor = await factory.createExtractor(config);
      expect(extractor).toBeDefined();
      expect(extractor.constructor.name).toBe('MistralJsonExtractorProvider');
    });
  });

  describe('checkAvailability', () => {
    it('should return available result for Mistral', async () => {
      const result = await factory.checkAvailability(JsonExtractorType.MISTRAL);
      
      expect(result.available).toBe(true);
      expect(result.configurationValid).toBe(true);
      expect(result.dependenciesSatisfied).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should return available result for Cloudflare', async () => {
      const result = await factory.checkAvailability(JsonExtractorType.CLOUDFLARE);
      
      expect(result.available).toBe(true);
      expect(result.configurationValid).toBe(true);
      expect(result.dependenciesSatisfied).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should return unavailable result for factory without container', async () => {
      const factoryWithoutContainer = new JsonExtractorFactory(mockIO);
      
      const result = await factoryWithoutContainer.checkAvailability(JsonExtractorType.MISTRAL);
      
      expect(result.available).toBe(false);
      expect(result.reason).toBe('DI Container not available');
      expect(result.configurationValid).toBe(false);
      expect(result.dependenciesSatisfied).toBe(false);
    });
  });

  describe('getAvailableTypes', () => {
    it('should return all available extractor types', async () => {
      const types = await factory.getAvailableTypes();
      
      expect(types).toContain(JsonExtractorType.MISTRAL);
      expect(types).toContain(JsonExtractorType.CLOUDFLARE);
      expect(types.length).toBe(2);
    });

    it('should return empty array when factory has no container', async () => {
      const factoryWithoutContainer = new JsonExtractorFactory(mockIO);
      
      const types = await factoryWithoutContainer.getAvailableTypes();
      expect(types.length).toBe(0);
    });
  });

  describe('validateConfiguration', () => {
    it('should validate valid Mistral configuration', () => {
      const config: JsonExtractorFactoryConfig = {
        extractorType: JsonExtractorType.MISTRAL
      };

      const result = factory.validateConfiguration(config);
      expect(result).toBe(true);
    });

    it('should validate valid Cloudflare configuration', () => {
      const config: JsonExtractorFactoryConfig = {
        extractorType: JsonExtractorType.CLOUDFLARE
      };

      const result = factory.validateConfiguration(config);
      expect(result).toBe(true);
    });

    it('should reject configuration with invalid extractor type', () => {
      const config: JsonExtractorFactoryConfig = {
        extractorType: 'invalid' as JsonExtractorType
      };

      const result = factory.validateConfiguration(config);
      expect(result).toBe(false);
    });

    it('should validate configuration with all optional fields', () => {
      const config: JsonExtractorFactoryConfig = {
        extractorType: JsonExtractorType.MISTRAL,
        fallbackType: JsonExtractorType.CLOUDFLARE,
        validateAvailability: true,
        options: {
          timeout: 25000,
          maxRetries: 2,
          enableLogging: false
        }
      };

      const result = factory.validateConfiguration(config);
      expect(result).toBe(true);
    });
  });

  describe('JsonExtractorType enum', () => {
    it('should have correct string values', () => {
      expect(JsonExtractorType.MISTRAL).toBe('mistral');
      expect(JsonExtractorType.CLOUDFLARE).toBe('cloudflare');
    });

    it('should be enumerable', () => {
      const values = Object.values(JsonExtractorType);
      expect(values).toContain(JsonExtractorType.MISTRAL);
      expect(values).toContain(JsonExtractorType.CLOUDFLARE);
      expect(values.length).toBe(2);
    });
  });
});