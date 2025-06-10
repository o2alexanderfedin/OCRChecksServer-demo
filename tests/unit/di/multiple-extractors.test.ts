/**
 * Unit tests for DI container configuration with multiple JSON extractors
 */

import '../../../test-setup.ts';
import { Container } from 'inversify';
import { DIContainer } from '../../../src/di/container.ts';
import { TYPES } from '../../../src/types/di-types.ts';
import { JsonExtractor } from '../../../src/json/types.ts';
import { MistralJsonExtractorProvider } from '../../../src/json/mistral.ts';

describe('DI Container Multiple Extractors Configuration', () => {
  let container: DIContainer;
  const mockIoE = {
    log: () => {},
    debug: () => {},
    warn: () => {},
    error: () => {},
    trace: () => {},
    fetch: async () => new Response(),
    atob: () => '',
    console: { log: () => {}, error: () => {} },
    fs: { writeFileSync: () => {}, readFileSync: () => '', existsSync: () => false, promises: {} },
    process: { argv: [], env: {}, exit: () => {}, cwd: () => '' },
    asyncImport: async () => ({ default: {} }),
    performance: { now: () => 0 },
    tryCatch: (fn: any) => { try { return ['ok', fn()]; } catch (e) { return ['error', e]; } },
    asyncTryCatch: async (fn: any) => { try { return ['ok', await fn()]; } catch (e) { return ['error', e]; } }
  } as any;

  beforeEach(() => {
    container = new DIContainer();
  });

  it('should bind MistralJsonExtractorProvider by default', () => {
    // Register dependencies with a valid API key
    container.registerDependencies(mockIoE, 'valid-production-token-1234567890');
    const extractorContainer = container.getContainer();
    
    const extractor = extractorContainer.get<JsonExtractor>(TYPES.JsonExtractorProvider);
    
    expect(extractor).toBeInstanceOf(MistralJsonExtractorProvider);
  });

  it('should create container with all dependencies', () => {
    // Register dependencies with a valid API key
    container.registerDependencies(mockIoE, 'valid-production-token-1234567890');
    const extractorContainer = container.getContainer();
    
    // Should be able to get various services
    expect(extractorContainer.get(TYPES.IoE)).toBeDefined();
    expect(extractorContainer.get(TYPES.MistralApiKey)).toBe('valid-production-token-1234567890');
    expect(extractorContainer.get(TYPES.JsonExtractorProvider)).toBeDefined();
  });

  it('should handle container initialization', () => {
    // Should be able to create container without errors
    expect(container).toBeDefined();
    expect(typeof container.registerDependencies).toBe('function');
    expect(typeof container.getContainer).toBe('function');
  });
});