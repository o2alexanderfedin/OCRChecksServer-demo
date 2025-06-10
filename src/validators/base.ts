/**
 * Abstract base validator implementation
 */
import { z } from 'zod';
import { injectable, unmanaged } from 'inversify';
import { IDomainValidator, ValidationError } from './types.ts';

/**
 * Abstract base class for validators
 */
export abstract class AbstractValidator<T> implements IDomainValidator<T> {
  /**
   * The Zod schema for this validator
   * Readonly to prevent modification after initialization
   */
  protected schema!: z.ZodSchema<T>;
  
  /**
   * Validates a value of type T and returns it if valid
   * 
   * @param value - The value to validate
   * @returns The validated value
   * @throws ValidationError<T> if validation fails
   */
  public assertValid(value: T): T {
    const result = this.schema.safeParse(value);
    
    if (result.success) {
      return result.data;
    } else {
      throw this.createError(result.error.issues, value);
    }
  }
  
  /**
   * Validates a value of type T and returns a validation error if invalid
   * 
   * @param value - The value to validate
   * @returns ValidationError<T> if validation fails, undefined if valid
   */
  public validate(value: T): ValidationError<T> | undefined {
    const result = this.schema.safeParse(value);
    
    if (result.success) {
      return undefined;
    } else {
      return this.createError(result.error.issues, value);
    }
  }
  
  /**
   * Creates a ValidationError instance from Zod issues
   */
  protected createError(issues: z.ZodIssue[], value: T): ValidationError<T> {
    return new ValidationError<T>(
      "Validation failed",
      issues.map(issue => ({
        message: issue.message,
        path: issue.path || [],
        code: issue.code,
        invalidValue: issue.path ? this.getNestedProperty(value, issue.path) : undefined,
        metadata: (issue as any).params
      })),
      value
    );
  }
  
  /**
   * Helper method to propagate validation errors from nested validators
   * Maintains detailed error context through the validation chain
   */
  protected propagateValidationError(error: unknown, ctx: z.RefinementCtx, fieldName: string): void {
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
            nestedValidatorName: fieldName,
            ...(issue.metadata || {})
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
  
  /**
   * Safely retrieves a nested property from an object by path
   */
  private getNestedProperty(obj: any, path: (string | number)[]): any {
    return path.reduce((acc, key) => 
      acc && typeof acc === 'object' ? acc[key] : undefined, 
      obj
    );
  }
}

/**
 * String validator base class
 */
@injectable()
export class StringValidator extends AbstractValidator<string> {
  constructor() {
    super();
    this.schema = z.string() as z.ZodSchema<string>;
  }
}

/**
 * Number validator base class
 */
@injectable()
export class NumberValidator extends AbstractValidator<number> {
  constructor(@unmanaged() min?: number, @unmanaged() max?: number) {
    super();
    
    let schema = z.number();
    
    if (min !== undefined) {
      schema = schema.min(min);
    }
    
    if (max !== undefined) {
      schema = schema.max(max);
    }
    
    this.schema = schema as z.ZodSchema<number>;
  }
}