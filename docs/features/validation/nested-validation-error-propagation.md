# Proper Error Propagation in Nested Validators

When composing validators, it's crucial to properly propagate error information from nested validators up to their parent validators. This document explains how to maintain detailed error context through the validation chain.

## The Problem

Consider this common pattern using Zod's `refine`:

```typescript
apiKey: z.string().refine(key => {
  try {
    this.apiKeyValidator.assertValid(key);
    return true;
  } catch (e) {
    return false;
  }
}, "Invalid API key format")
```

**Issues with this approach:**
1. The detailed error information from `apiKeyValidator` is completely lost
2. Only a generic error message is shown to users
3. Information about which specific validation rule failed is discarded
4. Path information to the specific property that failed is lost
5. Error codes and other metadata are not preserved

## Solution: Error Propagation with `superRefine`

Zod's `superRefine` method provides access to the validation context, which allows us to propagate detailed error information:

```typescript
apiKey: z.string().superRefine((key, ctx) => {
  try {
    this.apiKeyValidator.assertValid(key);
  } catch (e) {
    if (e instanceof ValidationError) {
      // Propagate each validation issue with proper path nesting
      e.issues.forEach(issue => {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: issue.message,
          path: [...(issue.path || [])], // Preserve the original path
          params: { 
            originalCode: issue.code,
            originalValue: issue.invalidValue,
            nestedValidatorName: 'apiKeyValidator'
          }
        });
      });
    } else {
      // For unexpected errors, add a generic issue
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: e instanceof Error ? e.message : 'Unknown error',
        path: [],
        params: { unexpectedError: true }
      });
    }
    return z.NEVER; // Signal validation fail to Zod
  }
})
```

## Complete MistralConfigValidator with Proper Error Propagation

Here's a comprehensive example that implements proper error propagation throughout:

```typescript
@injectable()
export class MistralConfigValidator implements IMistralConfigValidator {
  protected readonly schema: z.ZodSchema<MistralConfig>;
  
  constructor(
    @inject(TYPES.ApiKeyValidator) private readonly apiKeyValidator: IApiKeyValidator,
    @inject(TYPES.UrlValidator) private readonly urlValidator: IDomainValidator<Url>,
    @inject(TYPES.NumberValidator) private readonly timeoutValidator: IDomainValidator<number>
  ) {
    this.schema = z.object({
      apiKey: z.string().superRefine((key, ctx) => {
        try {
          this.apiKeyValidator.assertValid(key);
        } catch (e) {
          this.propagateValidationError(e, ctx, 'apiKey');
          return z.NEVER;
        }
      }),
      
      baseUrl: z.string().url().optional().superRefine((url, ctx) => {
        if (!url) return;
        
        try {
          this.urlValidator.assertValid(url);
        } catch (e) {
          this.propagateValidationError(e, ctx, 'baseUrl');
          return z.NEVER;
        }
      }),
      
      timeout: z.number().positive().optional().superRefine((timeout, ctx) => {
        if (timeout === undefined) return;
        
        try {
          this.timeoutValidator.assertValid(timeout);
        } catch (e) {
          this.propagateValidationError(e, ctx, 'timeout');
          return z.NEVER;
        }
        
        // Additional custom validation 
        if (timeout > 60000) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Timeout exceeds maximum allowed value of 60000ms",
            path: []
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
  
  /**
   * Helper method to propagate validation errors from nested validators
   */
  private propagateValidationError(error: unknown, ctx: z.RefinementCtx, fieldName: string): void {
    if (error instanceof ValidationError) {
      // Propagate each validation issue with proper path nesting
      error.issues.forEach(issue => {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: issue.message,
          path: [...(issue.path || [])], // Preserve the nested path
          params: { 
            originalCode: issue.code,
            originalValue: issue.invalidValue,
            nestedValidatorName: fieldName
          }
        });
      });
    } else {
      // For unexpected errors, add a generic issue
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: error instanceof Error ? error.message : 'Unknown error',
        path: [],
        params: { unexpectedError: true }
      });
    }
  }
  
  public assertValid(config: MistralConfig): MistralConfig {
    const result = this.schema.safeParse(config);
    
    if (result.success) {
      return result.data;
    } else {
      throw this.createErrorFromZodError(result.error, config);
    }
  }
  
  public validate(config: MistralConfig): ValidationError<MistralConfig> | undefined {
    const result = this.schema.safeParse(config);
    
    if (result.success) {
      return undefined;
    } else {
      return this.createErrorFromZodError(result.error, config);
    }
  }
  
  protected createErrorFromZodError(error: z.ZodError, value: MistralConfig): ValidationError<MistralConfig> {
    return new ValidationError<MistralConfig>(
      "Configuration validation failed",
      error.issues.map(issue => ({
        message: issue.message,
        path: issue.path,
        code: issue.code,
        invalidValue: issue.path.length > 0 
          ? this.getNestedProperty(value, issue.path) 
          : value,
        // Include any additional metadata from nested validators
        metadata: issue.params
      })),
      value
    );
  }
  
  private getNestedProperty(obj: any, path: (string | number)[]): any {
    return path.reduce((acc, key) => 
      acc && typeof acc === 'object' ? acc[key] : undefined, 
      obj
    );
  }
}
```

## Example Error Output

With proper error propagation, users will see detailed validation errors like this:

```
Error: Configuration validation failed

Issues:
- apiKey.length: API key must be at least 20 characters long (constraint: min=20)
- apiKey.pattern: API key contains forbidden pattern "placeholder"
- baseUrl: Invalid URL format, expected protocol to be https
- retryConfig.maxDelay: maxDelay must be greater than or equal to initialDelay
```

Instead of the generic:

```
Error: Configuration validation failed

Issues:
- apiKey: Invalid API key format
- baseUrl: Invalid URL format
- retryConfig: Invalid configuration
```

## Benefits of Proper Error Propagation

1. **Clear Error Messages**: Users see exactly what's wrong with each field
2. **Precise Field References**: Errors point to specific nested properties
3. **Preserved Metadata**: Error codes, constraints, and other metadata are maintained
4. **Better Debugging**: Makes finding and fixing issues much faster
5. **Self-Documenting Validation**: Error messages implicitly document the validation rules

## Implementation Requirements

To implement proper error propagation:

1. Use `superRefine` instead of `refine` for nested validations
2. Create a structured ValidationError type that preserves all error details
3. When catching validation errors, extract and propagate all issues
4. Maintain path information by properly nesting paths when propagating
5. Include additional context metadata where helpful

This approach ensures that users get the most helpful, detailed information when validation fails, making your API more developer-friendly and easier to use correctly.