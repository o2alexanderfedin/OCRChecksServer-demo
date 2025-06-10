/**
 * JSON Extractor Factory Types
 * 
 * Defines the types and interfaces for the JSON extractor factory pattern,
 * enabling runtime selection between different JsonExtractor implementations.
 */

import type { JsonExtractor } from '../types.ts';

/**
 * Available JSON extractor types
 */
export enum JsonExtractorType {
  /** Mistral API-based extractor */
  MISTRAL = 'mistral',
  /** Cloudflare Workers AI-based extractor */
  CLOUDFLARE = 'cloudflare'
}

/**
 * Configuration for JSON extractor factory
 */
export interface JsonExtractorFactoryConfig {
  /** Preferred extractor type */
  extractorType: JsonExtractorType;
  /** Fallback extractor type if preferred is unavailable */
  fallbackType?: JsonExtractorType;
  /** Whether to validate extractor availability before creation */
  validateAvailability?: boolean;
  /** Additional configuration options */
  options?: {
    /** Timeout for extractor operations (ms) */
    timeout?: number;
    /** Maximum retry attempts */
    maxRetries?: number;
    /** Enable debug logging */
    enableLogging?: boolean;
  };
}

/**
 * Result of extractor availability check
 */
export interface ExtractorAvailabilityResult {
  /** Whether the extractor is available */
  available: boolean;
  /** Reason if not available */
  reason?: string;
  /** Configuration requirements met */
  configurationValid: boolean;
  /** Dependencies satisfied */
  dependenciesSatisfied: boolean;
}

/**
 * Interface for JSON extractor factory
 */
export interface JsonExtractorFactory {
  /**
   * Create a JSON extractor instance based on configuration
   * @param config Factory configuration
   * @returns Promise of JsonExtractor instance
   */
  createExtractor(config: JsonExtractorFactoryConfig): Promise<JsonExtractor>;

  /**
   * Check if an extractor type is available
   * @param extractorType Type to check
   * @returns Availability result
   */
  checkAvailability(extractorType: JsonExtractorType): Promise<ExtractorAvailabilityResult>;

  /**
   * Get all available extractor types
   * @returns Array of available extractor types
   */
  getAvailableTypes(): Promise<JsonExtractorType[]>;

  /**
   * Validate factory configuration
   * @param config Configuration to validate
   * @returns True if configuration is valid
   */
  validateConfiguration(config: JsonExtractorFactoryConfig): boolean;
}

/**
 * Factory creation options
 */
export interface JsonExtractorFactoryOptions {
  /** Dependency injection container reference */
  container?: unknown;
  /** Override environment-based configuration */
  environmentOverride?: boolean;
  /** Custom availability checkers */
  availabilityCheckers?: Map<JsonExtractorType, () => Promise<ExtractorAvailabilityResult>>;
}