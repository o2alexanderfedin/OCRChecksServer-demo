/**
 * Mistral API validators
 */
import { z } from 'zod';
import { injectable, inject } from 'inversify';
import { AbstractValidator, StringValidator, NumberValidator } from './base';
import { IDomainValidator, ApiKey, Url, TYPES, ValidationConfig } from './types';

/**
 * Interface for API key validators
 */
export interface IApiKeyValidator extends IDomainValidator<ApiKey> {
  // Any additional methods specific to API key validation
}

/**
 * Validator for API keys
 */
@injectable()
export class ApiKeyValidator extends StringValidator implements IApiKeyValidator {
  private readonly minLength: number;
  private readonly forbiddenPatterns: RegExp[];
  
  // Dependencies are injected via constructor
  constructor(
    @inject(TYPES.ValidationConfig) config: ValidationConfig
  ) {
    super();
    this.minLength = config.apiKeyMinLength || 20;
    this.forbiddenPatterns = (config.forbiddenPatterns || ["placeholder", "api-key"])
      .map(p => new RegExp(p, "i"));
    
    // Create the schema using Zod
    // Schema is readonly to prevent modification after initialization
    this.schema = z.string()
      .min(this.minLength, `API key must be at least ${this.minLength} characters long`)
      .superRefine((key, ctx) => {
        if (this.containsForbiddenPattern(key)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "API key appears to be a placeholder value",
            path: [],
            params: { 
              forbiddenPatterns: this.forbiddenPatterns.map(p => p.toString())
            }
          });
          return z.NEVER;
        }
        
        // Environment-specific validation
        if (key.includes("test") && process.env.NODE_ENV === "production") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Test API keys cannot be used in production",
            path: [],
            params: { 
              environment: process.env.NODE_ENV,
              isTestKey: true
            }
          });
          return z.NEVER;
        }
      });
  }
  
  /**
   * Checks if the key contains any forbidden patterns
   */
  private containsForbiddenPattern(key: string): boolean {
    return this.forbiddenPatterns.some(pattern => pattern.test(key));
  }
  
  /**
   * Validates an API key string and returns it if valid
   * 
   * @param key - The API key to validate
   * @returns The validated API key
   * @throws ValidationError<string> if validation fails
   */
  public override assertValid(key: string): ApiKey {
    // Use the parent's implementation that uses the schema
    // All validation logic is now in the schema with superRefine
    const validKey = super.assertValid(key);
    
    // Return as ApiKey type (branded type for better type safety)
    return validKey as ApiKey;
  }
}

/**
 * URL validator class
 */
@injectable()
export class UrlValidator extends StringValidator implements IDomainValidator<Url> {
  constructor() {
    super();
    this.schema = z.string()
      .url("Invalid URL format")
      .superRefine((url, ctx) => {
        // HTTPS requirement for production
        if (process.env.NODE_ENV === "production" && !url.startsWith("https://")) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Only HTTPS URLs are allowed in production",
            path: [],
            params: { requireHttps: true }
          });
          return z.NEVER;
        }
      });
  }
  
  /**
   * Validates a URL string and returns it if valid
   */
  public override assertValid(url: string): Url {
    const validUrl = super.assertValid(url);
    return validUrl as Url;
  }
}

/**
 * Mistral configuration type
 */
export interface MistralConfig {
  apiKey: ApiKey;
  baseUrl?: Url;
  timeout?: number;
  retryConfig?: {
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
  };
}

/**
 * Interface for Mistral configuration validator
 */
export interface IMistralConfigValidator extends IDomainValidator<MistralConfig> {
  // Any additional methods specific to Mistral config validation
}

/**
 * Validator for MistralConfig objects
 */
@injectable()
export class MistralConfigValidator extends AbstractValidator<MistralConfig> implements IMistralConfigValidator {
  // Dependencies are injected through constructor
  constructor(
    @inject(TYPES.ApiKeyValidator) private readonly apiKeyValidator: IApiKeyValidator,
    @inject(TYPES.UrlValidator) private readonly urlValidator: IDomainValidator<Url>,
    @inject(TYPES.NumberValidator) private readonly timeoutValidator: IDomainValidator<number>
  ) {
    super();
    
    // Create the schema using Zod and the component validators
    // Schema is readonly to prevent modification after initialization
    this.schema = z.object({
      apiKey: z.string().superRefine((key, ctx) => {
        // Use the component validator but propagate any errors
        try {
          this.apiKeyValidator.assertValid(key);
        } catch (e) {
          this.propagateValidationError(e, ctx, 'apiKey');
          return z.NEVER; // Signal validation fail to Zod
        }
      }),
      baseUrl: z.string().url().optional().superRefine((url, ctx) => {
        if (!url) return;
        try {
          this.urlValidator.assertValid(url);
        } catch (e) {
          this.propagateValidationError(e, ctx, 'baseUrl');
          return z.NEVER; // Signal validation fail to Zod
        }
      }),
      timeout: z.number().positive().optional().superRefine((timeout, ctx) => {
        if (timeout === undefined) return;
        try {
          this.timeoutValidator.assertValid(timeout);
        } catch (e) {
          this.propagateValidationError(e, ctx, 'timeout');
          return z.NEVER; // Signal validation fail to Zod
        }
        
        // Additional timeout validation
        if (timeout > 60000) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Timeout exceeds maximum allowed value of 60000ms",
            path: [],
            params: { maxTimeout: 60000 }
          });
          return z.NEVER;
        }
      }),
      retryConfig: z.object({
        maxRetries: z.number().int().min(0),
        initialDelay: z.number().positive(),
        maxDelay: z.number().positive()
      }).optional().superRefine((retryConfig, ctx) => {
        if (!retryConfig) return;
        
        // Cross-field validation
        if (retryConfig.maxDelay < retryConfig.initialDelay) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "maxDelay must be greater than or equal to initialDelay",
            path: []
          });
          return z.NEVER;
        }
      })
    });
  }
}