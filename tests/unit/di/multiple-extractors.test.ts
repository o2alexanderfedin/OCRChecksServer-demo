/**
 * Unit tests for DI container configuration with multiple JSON extractors
 */

import '../../../test-setup.ts';
import { Container } from 'inversify';
import { DIContainer } from '../../../src/di/container.ts';
import { TYPES } from '../../../src/types/di-types.ts';
import { JsonExtractor } from '../../../src/json/types.ts';
import { MistralJsonExtractorProvider } from '../../../src/json/mistral.ts';
import { CloudflareLlama33JsonExtractor, CloudflareAI } from '../../../src/json/cloudflare-llama33-extractor';

describe('DI Container Multiple Extractors Configuration', () => {
  let container: DIContainer;

  beforeEach(() => {
    // Set environment variable to control extractor selection
    process.env.JSON_EXTRACTOR_TYPE = 'mistral'; // default
    container = new DIContainer();
  });

  afterEach(() => {
    // Clean up environment variable
    delete process.env.JSON_EXTRACTOR_TYPE;
  });

  describe('extractor selection based on environment', () => {
    it('should bind MistralJsonExtractorProvider when JSON_EXTRACTOR_TYPE is mistral', () => {
      // Red phase: This test should fail initially
      process.env.JSON_EXTRACTOR_TYPE = 'mistral';
      
      container.register();
      const extractorContainer = container.getContainer();
      
      const extractor = extractorContainer.get<JsonExtractor>(TYPES.JsonExtractorProvider);
      
      expect(extractor).toBeInstanceOf(MistralJsonExtractorProvider);
    });

    it('should bind CloudflareLlama33JsonExtractor when JSON_EXTRACTOR_TYPE is cloudflare', () => {
      process.env.JSON_EXTRACTOR_TYPE = 'cloudflare';
      
      container.register();
      const extractorContainer = container.getContainer();
      
      const extractor = extractorContainer.get<JsonExtractor>(TYPES.JsonExtractorProvider);
      
      expect(extractor).toBeInstanceOf(CloudflareLlama33JsonExtractor);
    });

    it('should default to MistralJsonExtractorProvider when JSON_EXTRACTOR_TYPE is not set', () => {
      delete process.env.JSON_EXTRACTOR_TYPE;
      
      container.register();
      const extractorContainer = container.getContainer();
      
      const extractor = extractorContainer.get<JsonExtractor>(TYPES.JsonExtractorProvider);
      
      expect(extractor).toBeInstanceOf(MistralJsonExtractorProvider);
    });

    it('should default to MistralJsonExtractorProvider for unknown JSON_EXTRACTOR_TYPE', () => {
      process.env.JSON_EXTRACTOR_TYPE = 'unknown_type';
      
      container.register();
      const extractorContainer = container.getContainer();
      
      const extractor = extractorContainer.get<JsonExtractor>(TYPES.JsonExtractorProvider);
      
      expect(extractor).toBeInstanceOf(MistralJsonExtractorProvider);
    });
  });

  describe('CloudflareAI binding configuration', () => {
    it('should bind CloudflareAI when available in environment', () => {
      // Mock Cloudflare AI environment
      const mockCloudflareAI = {
        run: async () => ({ response: '{}' })
      };
      
      // Simulate Cloudflare Workers environment
      (globalThis as any).AI = mockCloudflareAI;
      
      container.register();
      const extractorContainer = container.getContainer();
      
      const cloudflareAI = extractorContainer.get<CloudflareAI>(TYPES.CloudflareAI);
      
      expect(cloudflareAI).toBeDefined();
      expect(typeof cloudflareAI.run).toBe('function');
    });

    it('should provide mock CloudflareAI when not in Cloudflare Workers environment', () => {
      // Remove any existing AI binding
      delete (globalThis as any).AI;
      
      container.register();
      const extractorContainer = container.getContainer();
      
      const cloudflareAI = extractorContainer.get<CloudflareAI>(TYPES.CloudflareAI);
      
      expect(cloudflareAI).toBeDefined();
      expect(typeof cloudflareAI.run).toBe('function');
    });
  });

  describe('backward compatibility', () => {
    it('should maintain existing MistralJsonExtractorProvider functionality', () => {
      process.env.JSON_EXTRACTOR_TYPE = 'mistral';
      
      container.register();
      const extractorContainer = container.getContainer();
      
      const extractor = extractorContainer.get<JsonExtractor>(TYPES.JsonExtractorProvider);
      
      expect(extractor).toBeInstanceOf(MistralJsonExtractorProvider);
      expect(typeof extractor.extract).toBe('function');
    });

    it('should ensure CloudflareLlama33JsonExtractor implements JsonExtractor interface', () => {
      process.env.JSON_EXTRACTOR_TYPE = 'cloudflare';
      
      container.register();
      const extractorContainer = container.getContainer();
      
      const extractor = extractorContainer.get<JsonExtractor>(TYPES.JsonExtractorProvider);
      
      expect(extractor).toBeInstanceOf(CloudflareLlama33JsonExtractor);
      expect(typeof extractor.extract).toBe('function');
    });
  });

  describe('dependency resolution', () => {
    it('should resolve all dependencies for MistralJsonExtractorProvider', () => {
      process.env.JSON_EXTRACTOR_TYPE = 'mistral';
      
      container.register();
      const extractorContainer = container.getContainer();
      
      // Should not throw when getting the extractor
      expect(() => {
        extractorContainer.get<JsonExtractor>(TYPES.JsonExtractorProvider);
      }).not.toThrow();
    });

    it('should resolve all dependencies for CloudflareLlama33JsonExtractor', () => {
      process.env.JSON_EXTRACTOR_TYPE = 'cloudflare';
      
      container.register();
      const extractorContainer = container.getContainer();
      
      // Should not throw when getting the extractor
      expect(() => {
        extractorContainer.get<JsonExtractor>(TYPES.JsonExtractorProvider);
      }).not.toThrow();
    });
  });
});