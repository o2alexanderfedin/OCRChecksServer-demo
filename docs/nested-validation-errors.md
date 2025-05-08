# Handling Nested Validation Errors

## Problem Statement

When composing validators, it's essential to properly propagate and preserve detailed error information from nested validators. The initial implementation using simple `.refine()` callbacks discards detailed error information from nested validators, exposing only a generic error message to users of the parent validator.

This document describes improved approaches to ensure that all validation context, including specific error messages, field paths, and validation codes, is preserved when validating complex nested structures.

## Approaches for Handling Nested Validation Errors

### 1. Using Zod's `superRefine` with Error Context

```typescript
this.schema = z.object({
  apiKey: z.string().superRefine((key, ctx) => {
    try {
      // Try validating with the nested validator
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
  // ... other fields
});
```

### 2. Manual Validation with Error Collection

```typescript
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
  
  // ... validate other fields
  
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
```

## Benefits of Proper Nested Error Handling

1. **Detailed Error Messages**: Users receive specific reasons for validation failures
2. **Accurate Error Paths**: Error paths include the full property path (e.g., `apiKey.minLength`)
3. **Error Aggregation**: Multiple errors from different fields can be collected and presented together
4. **Preserved Context**: Original error codes and invalid values are maintained
5. **Improved Debugging**: Makes identifying and fixing validation issues much easier

## Error Structure Design

To support proper nested error handling, the validation error structure should:

1. Include a list of specific issues rather than a single message
2. Use property paths (arrays of path segments) to indicate error locations
3. Support attaching the original invalid value for context
4. Include error type/code information for programmatic handling

```typescript
interface ValidationIssue {
  /** The error message */
  readonly message: string;
  
  /** Path to the invalid property */
  readonly path: string[];
  
  /** Error code (from Zod) */
  readonly code: string;
  
  /** The specific invalid value */
  readonly invalidValue?: any;
}

class ValidationError<T> extends Error {
  /** The validation issues in detail */
  public readonly issues: ValidationIssue[];
  
  /** The original value that failed validation */
  public readonly originalValue: T;
  
  // ... constructor and methods
}
```

## Error Formatting and Display

Properly structured validation errors can be formatted for display in different contexts:

### Command Line Error Display

```
Error: Configuration validation failed

Issues:
- apiKey.length: API key must be at least 20 characters long
- baseUrl: Invalid URL format
- retryConfig.maxDelay: maxDelay must be greater than or equal to initialDelay
```

### API Error Response

```json
{
  "error": "Validation error",
  "issues": [
    {
      "path": ["apiKey"],
      "message": "API key must be at least 20 characters long",
      "code": "min_length"
    },
    {
      "path": ["baseUrl"],
      "message": "Invalid URL format",
      "code": "invalid_url"
    },
    {
      "path": ["retryConfig", "maxDelay"],
      "message": "maxDelay must be greater than or equal to initialDelay",
      "code": "invalid_relationship"
    }
  ]
}
```

### UI Error Display

UIs can map error paths to form fields and display contextual error messages:

- For the field `apiKey`: "API key must be at least 20 characters long"
- For the field `baseUrl`: "Invalid URL format"
- For the field `retryConfig.maxDelay`: "maxDelay must be greater than or equal to initialDelay"

## Conclusion

Proper handling of nested validation errors is crucial for creating a good developer and user experience. By propagating and preserving detailed error information from nested validators, we can provide clear, specific guidance on what needs to be fixed, improving the usability of the validation system.

The recommended approach using `superRefine` with try/catch provides the most comprehensive solution for propagating error information from nested validators through the validation chain, preserving full error context and providing detailed feedback to users.