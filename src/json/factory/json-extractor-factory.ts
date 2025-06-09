/**
 * JSON Extractor Factory Implementation
 * 
 * Provides runtime selection between different JsonExtractor implementations
 * with availability checking and fallback support.
 */

import { injectable, inject } from 'inversify';
import { Container } from 'inversify';
import { IoE } from '../../ocr/types';
import { TYPES } from '../../types/di-types';
import { JsonExtractor } from '../types';
import { 
  JsonExtractorFactory as IJsonExtractorFactory,
  JsonExtractorType, 
  JsonExtractorFactoryConfig, 
  ExtractorAvailabilityResult,
  JsonExtractorFactoryOptions
} from './types';
import { MistralJsonExtractorProvider } from '../mistral';
import { CloudflareLlama33JsonExtractor } from '../cloudflare-llama33-extractor';
import { JsonExtractionConfidenceCalculator } from '../utils/confidence-calculator';
import { Mistral } from '@mistralai/mistralai';
import { CloudflareAI } from '../cloudflare-llama33-extractor';

/**
 * Factory for creating JsonExtractor instances based on runtime configuration
 */
@injectable()
export class JsonExtractorFactory implements IJsonExtractorFactory {
  private container?: Container;
  private availabilityCheckers = new Map<JsonExtractorType, () => Promise<ExtractorAvailabilityResult>>();

  constructor(
    @inject(TYPES.IoE) private io: IoE,
    options?: JsonExtractorFactoryOptions
  ) {
    if (options?.container) {
      this.container = options.container;
    }
    
    if (options?.availabilityCheckers) {
      this.availabilityCheckers = options.availabilityCheckers;
    } else {
      this.setupDefaultAvailabilityCheckers();
    }
  }

  /**
   * Create a JSON extractor instance based on configuration
   */
  async createExtractor(config: JsonExtractorFactoryConfig): Promise<JsonExtractor> {
    // Validate configuration
    if (!this.validateConfiguration(config)) {
      throw new Error(`Invalid configuration: unsupported extractor type ${config.extractorType}`);
    }

    // Check availability if requested
    if (config.validateAvailability) {
      const availability = await this.checkAvailability(config.extractorType);
      if (!availability.available) {
        if (config.fallbackType) {
          const fallbackAvailability = await this.checkAvailability(config.fallbackType);
          if (fallbackAvailability.available) {
            this.io.warn(`Primary extractor ${config.extractorType} unavailable, using fallback ${config.fallbackType}`, {
              reason: availability.reason
            });
            return this.createExtractorInstance(config.fallbackType, config);
          }
        }
        throw new Error(`Extractor ${config.extractorType} is not available: ${availability.reason}`);
      }
    }

    return this.createExtractorInstance(config.extractorType, config);
  }

  /**
   * Check if an extractor type is available
   */
  async checkAvailability(extractorType: JsonExtractorType): Promise<ExtractorAvailabilityResult> {
    const checker = this.availabilityCheckers.get(extractorType);
    if (!checker) {
      return {
        available: false,
        reason: `No availability checker configured for ${extractorType}`,
        configurationValid: false,
        dependenciesSatisfied: false
      };
    }

    try {
      return await checker();
    } catch (error) {
      return {
        available: false,
        reason: `Availability check failed: ${error instanceof Error ? error.message : String(error)}`,
        configurationValid: false,
        dependenciesSatisfied: false
      };
    }
  }

  /**
   * Get all available extractor types
   */
  async getAvailableTypes(): Promise<JsonExtractorType[]> {
    const availableTypes: JsonExtractorType[] = [];
    
    for (const type of Object.values(JsonExtractorType)) {
      const availability = await this.checkAvailability(type);
      if (availability.available) {
        availableTypes.push(type);
      }
    }
    
    return availableTypes;
  }

  /**
   * Validate factory configuration
   */
  validateConfiguration(config: JsonExtractorFactoryConfig): boolean {
    if (!config.extractorType) {
      return false;
    }
    
    return Object.values(JsonExtractorType).includes(config.extractorType);
  }

  /**
   * Create the actual extractor instance
   */
  private async createExtractorInstance(
    extractorType: JsonExtractorType, 
    config: JsonExtractorFactoryConfig
  ): Promise<JsonExtractor> {
    switch (extractorType) {
      case JsonExtractorType.MISTRAL:
        return this.createMistralExtractor(config);
        
      case JsonExtractorType.CLOUDFLARE:
        return this.createCloudflareExtractor(config);
        
      default:
        throw new Error(`Unsupported extractor type: ${extractorType}`);
    }
  }

  /**
   * Create Mistral extractor instance
   */
  private createMistralExtractor(config: JsonExtractorFactoryConfig): JsonExtractor {
    if (!this.container) {
      throw new Error('DI Container is required for Mistral extractor creation');
    }

    try {
      const mistralClient = this.container.get<Mistral>(TYPES.MistralClient);
      const confidenceCalculator = this.container.get<JsonExtractionConfidenceCalculator>(TYPES.JsonExtractionConfidenceCalculator);
      
      return new MistralJsonExtractorProvider(this.io, mistralClient, confidenceCalculator);
    } catch (error) {
      throw new Error(`Failed to create Mistral extractor: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create Cloudflare extractor instance
   */
  private createCloudflareExtractor(config: JsonExtractorFactoryConfig): JsonExtractor {
    if (!this.container) {
      throw new Error('DI Container is required for Cloudflare extractor creation');
    }

    try {
      const cloudflareAI = this.container.get<CloudflareAI>(TYPES.CloudflareAI);
      const confidenceCalculator = this.container.get<JsonExtractionConfidenceCalculator>(TYPES.JsonExtractionConfidenceCalculator);
      
      return new CloudflareLlama33JsonExtractor(this.io, cloudflareAI, confidenceCalculator);
    } catch (error) {
      throw new Error(`Failed to create Cloudflare extractor: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Set up default availability checkers for each extractor type
   */
  private setupDefaultAvailabilityCheckers(): void {
    // Mistral availability checker
    this.availabilityCheckers.set(JsonExtractorType.MISTRAL, async (): Promise<ExtractorAvailabilityResult> => {
      try {
        if (!this.container) {
          return {
            available: false,
            reason: 'DI Container not available',
            configurationValid: false,
            dependenciesSatisfied: false
          };
        }

        // Check if Mistral client can be resolved
        const mistralClient = this.container.get<Mistral>(TYPES.MistralClient);
        const confidenceCalculator = this.container.get<JsonExtractionConfidenceCalculator>(TYPES.JsonExtractionConfidenceCalculator);
        
        if (!mistralClient || !confidenceCalculator) {
          return {
            available: false,
            reason: 'Mistral dependencies not properly configured',
            configurationValid: false,
            dependenciesSatisfied: false
          };
        }

        return {
          available: true,
          configurationValid: true,
          dependenciesSatisfied: true
        };
      } catch (error) {
        return {
          available: false,
          reason: `Mistral configuration error: ${error instanceof Error ? error.message : String(error)}`,
          configurationValid: false,
          dependenciesSatisfied: false
        };
      }
    });

    // Cloudflare availability checker
    this.availabilityCheckers.set(JsonExtractorType.CLOUDFLARE, async (): Promise<ExtractorAvailabilityResult> => {
      try {
        if (!this.container) {
          return {
            available: false,
            reason: 'DI Container not available',
            configurationValid: false,
            dependenciesSatisfied: false
          };
        }

        // Check if Cloudflare AI binding is available
        const cloudflareAI = this.container.get<CloudflareAI>(TYPES.CloudflareAI);
        const confidenceCalculator = this.container.get<JsonExtractionConfidenceCalculator>(TYPES.JsonExtractionConfidenceCalculator);
        
        if (!cloudflareAI || !confidenceCalculator) {
          return {
            available: false,
            reason: 'Cloudflare dependencies not properly configured',
            configurationValid: false,
            dependenciesSatisfied: false
          };
        }

        // Check if we're in Cloudflare Workers environment or mock is available
        if (typeof (cloudflareAI as any).run !== 'function') {
          return {
            available: false,
            reason: 'Cloudflare AI interface not properly implemented',
            configurationValid: false,
            dependenciesSatisfied: false
          };
        }

        return {
          available: true,
          configurationValid: true,
          dependenciesSatisfied: true
        };
      } catch (error) {
        return {
          available: false,
          reason: `Cloudflare configuration error: ${error instanceof Error ? error.message : String(error)}`,
          configurationValid: false,
          dependenciesSatisfied: false
        };
      }
    });
  }
}