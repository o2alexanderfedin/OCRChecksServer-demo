import { z } from 'zod';
import { inject, injectable } from 'inversify';
import { TYPES } from './types';

/**
 * Improved MistralConfigValidator that properly captures and propagates nested validation errors
 */
@injectable()
export class MistralConfigValidator implements IMistralConfigValidator {
  protected readonly schema: z.ZodSchema<MistralConfig>;
  
  constructor(
    @inject(TYPES.ApiKeyValidator) private readonly apiKeyValidator: IApiKeyValidator,
    @inject(TYPES.UrlValidator) private readonly urlValidator: IDomainValidator<Url>,
    @inject(TYPES.NumberValidator) private readonly timeoutValidator: IDomainValidator<number>
  ) {
    // Create schema with custom error map to capture nested errors
    this.schema = z.object({
      apiKey: z.string().superRefine((key, ctx) => {
        // Instead of just returning boolean true/false, capture actual errors
        const validationError = this.apiKeyValidator.validate(key);
        if (validationError) {
          // Add each issue from the nested validator with proper path
          validationError.issues.forEach(issue => {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: issue.message,
              path: ['apiKey', ...(issue.path || [])], // Ensure proper error path nesting
              params: { 
                originalCode: issue.code,
                originalValue: issue.invalidValue
              }
            });
          });
          return z.NEVER; // Signal validation fail to Zod
        }
      }),
      
      baseUrl: z.string().url().optional().superRefine((url, ctx) => {
        if (!url) return; // Skip validation for undefined URLs
        
        const validationError = this.urlValidator.validate(url);
        if (validationError) {
          validationError.issues.forEach(issue => {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: issue.message,
              path: ['baseUrl', ...(issue.path || [])],
              params: { 
                originalCode: issue.code,
                originalValue: issue.invalidValue
              }
            });
          });
          return z.NEVER;
        }
      }),
      
      timeout: z.number().positive().optional().superRefine((timeout, ctx) => {
        if (timeout === undefined) return;
        
        const validationError = this.timeoutValidator.validate(timeout);
        if (validationError) {
          validationError.issues.forEach(issue => {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: issue.message,
              path: ['timeout', ...(issue.path || [])],
              params: { 
                originalCode: issue.code,
                originalValue: issue.invalidValue
              }
            });
          });
          return z.NEVER;
        }
        
        // Additional custom validation directly in the schema
        if (timeout > 60000) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Timeout exceeds maximum allowed value of 60000ms",
            path: ['timeout']
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
        
        // Example of cross-field validation
        if (retryConfig.maxDelay < retryConfig.initialDelay) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "maxDelay must be greater than or equal to initialDelay",
            path: ['retryConfig']
          });
          return z.NEVER;
        }
      })
    });
  }
  
  /**
   * Validates a MistralConfig object and returns it if valid
   * 
   * @param config - The config to validate
   * @returns The validated config
   * @throws ValidationError<MistralConfig> if validation fails
   */
  public assertValid(config: MistralConfig): MistralConfig {
    const result = this.schema.safeParse(config);
    
    if (result.success) {
      return result.data;
    } else {
      throw this.createErrorFromZodError(result.error, config);
    }
  }
  
  /**
   * Validates a value of type MistralConfig and returns a validation error if invalid
   * 
   * @param config - The config to validate
   * @returns ValidationError<MistralConfig> if validation fails, undefined if valid
   */
  public validate(config: MistralConfig): ValidationError<MistralConfig> | undefined {
    const result = this.schema.safeParse(config);
    
    if (result.success) {
      return undefined;
    } else {
      return this.createErrorFromZodError(result.error, config);
    }
  }
  
  /**
   * Creates a ValidationError instance from a Zod error
   */
  protected createErrorFromZodError(error: z.ZodError, value: MistralConfig): ValidationError<MistralConfig> {
    return new ValidationError<MistralConfig>(
      "Configuration validation failed",
      error.issues.map(issue => ({
        message: issue.message,
        path: issue.path,
        code: issue.code,
        invalidValue: issue.path.length > 0 
          ? this.getNestedProperty(value, issue.path) 
          : value
      })),
      value
    );
  }
  
  /**
   * Gets a nested property from an object using a path array
   */
  private getNestedProperty(obj: any, path: (string | number)[]): any {
    return path.reduce((acc, key) => 
      acc && typeof acc === 'object' ? acc[key] : undefined, 
      obj
    );
  }
}

/**
 * Enhanced validator for better error aggregation
 */
@injectable()
export class EnhancedMistralConfigValidator extends MistralConfigValidator {
  /**
   * Demonstrates an alternative approach using manual validation
   * instead of relying solely on Zod schema validation
   */
  public override assertValid(config: MistralConfig): MistralConfig {
    // Collect all validation errors instead of failing fast
    const issues: ValidationIssue[] = [];
    
    // Validate API key
    if (!config.apiKey) {
      issues.push({
        message: "API key is required",
        path: ["apiKey"],
        code: "required",
        invalidValue: undefined
      });
    } else {
      const apiKeyError = this.apiKeyValidator.validate(config.apiKey);
      if (apiKeyError) {
        // Preserve all nested errors with proper path prefixing
        issues.push(...apiKeyError.issues.map(issue => ({
          message: issue.message,
          path: ["apiKey", ...(issue.path || [])],
          code: issue.code,
          invalidValue: issue.invalidValue
        })));
      }
    }
    
    // Validate base URL if provided
    if (config.baseUrl) {
      const urlError = this.urlValidator.validate(config.baseUrl);
      if (urlError) {
        issues.push(...urlError.issues.map(issue => ({
          message: issue.message,
          path: ["baseUrl", ...(issue.path || [])],
          code: issue.code,
          invalidValue: issue.invalidValue
        })));
      }
    }
    
    // Validate timeout if provided
    if (config.timeout !== undefined) {
      // Basic validation with NumberValidator
      const timeoutError = this.timeoutValidator.validate(config.timeout);
      if (timeoutError) {
        issues.push(...timeoutError.issues.map(issue => ({
          message: issue.message,
          path: ["timeout", ...(issue.path || [])],
          code: issue.code,
          invalidValue: issue.invalidValue
        })));
      }
      
      // Additional custom validation
      if (config.timeout > 60000) {
        issues.push({
          message: "Timeout exceeds maximum allowed value of 60000ms",
          path: ["timeout"],
          code: "max_timeout",
          invalidValue: config.timeout
        });
      }
    }
    
    // Validate retry config if provided
    if (config.retryConfig) {
      const retryConfig = config.retryConfig;
      
      // Validate individual fields
      if (retryConfig.maxRetries < 0) {
        issues.push({
          message: "maxRetries must be a non-negative number",
          path: ["retryConfig", "maxRetries"],
          code: "min_value",
          invalidValue: retryConfig.maxRetries
        });
      }
      
      if (retryConfig.initialDelay <= 0) {
        issues.push({
          message: "initialDelay must be a positive number",
          path: ["retryConfig", "initialDelay"],
          code: "positive_value",
          invalidValue: retryConfig.initialDelay
        });
      }
      
      if (retryConfig.maxDelay <= 0) {
        issues.push({
          message: "maxDelay must be a positive number",
          path: ["retryConfig", "maxDelay"],
          code: "positive_value",
          invalidValue: retryConfig.maxDelay
        });
      }
      
      // Cross-field validation
      if (retryConfig.maxDelay < retryConfig.initialDelay) {
        issues.push({
          message: "maxDelay must be greater than or equal to initialDelay",
          path: ["retryConfig"],
          code: "invalid_relationship",
          invalidValue: retryConfig
        });
      }
    }
    
    // If any issues were found, throw validation error with all collected issues
    if (issues.length > 0) {
      throw new ValidationError<MistralConfig>(
        "Configuration validation failed",
        issues,
        config
      );
    }
    
    // Return the validated config
    return config;
  }
}