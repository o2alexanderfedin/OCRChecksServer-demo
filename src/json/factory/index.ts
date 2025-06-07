/**
 * JSON Extractor Factory Module
 * 
 * Exports factory pattern for runtime selection of JsonExtractor implementations.
 */

export { JsonExtractorFactory } from './json-extractor-factory';
export type { 
  JsonExtractorFactory as IJsonExtractorFactory,
  JsonExtractorType,
  JsonExtractorFactoryConfig,
  ExtractorAvailabilityResult,
  JsonExtractorFactoryOptions
} from './types';