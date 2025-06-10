/**
 * Unit tests for AbstractValidator class
 */
import { z } from 'zod';
import { AbstractValidator, ValidationError } from '../../../src/validators/index.ts';

// Create a concrete implementation of AbstractValidator for testing
class TestValidator extends AbstractValidator<string> {
  constructor(minLength: number = 5) {
    super();
    this.schema = z.string().min(minLength, `Must be at least ${minLength} characters long`);
  }
}

class TestObjectValidator extends AbstractValidator<{ name: string; age: number }> {
  constructor() {
    super();
    this.schema = z.object({
      name: z.string().min(2, 'Name must be at least 2 characters'),
      age: z.number().min(18, 'Must be at least 18 years old')
    });
  }
}

describe('AbstractValidator', () => {
  let validator: TestValidator;
  let objectValidator: TestObjectValidator;
  
  beforeEach(() => {
    validator = new TestValidator();
    objectValidator = new TestObjectValidator();
  });
  
  it('should validate valid values', () => {
    const validValue = 'valid string';
    expect(() => validator.assertValid(validValue)).not.toThrow();
    expect(validator.assertValid(validValue)).toBe(validValue);
  });
  
  it('should reject invalid values', () => {
    const invalidValue = 'shrt';
    expect(() => validator.assertValid(invalidValue)).toThrowError(ValidationError);
  });
  
  it('should return undefined for valid values with validate()', () => {
    const validValue = 'valid string';
    expect(validator.validate(validValue)).toBeUndefined();
  });
  
  it('should return ValidationError for invalid values with validate()', () => {
    const invalidValue = 'shrt';
    const result = validator.validate(invalidValue);
    
    expect(result).toBeInstanceOf(ValidationError);
    expect(result?.issues.length).toBeGreaterThan(0);
    expect(result?.originalValue).toBe(invalidValue);
  });
  
  it('should handle object validation correctly', () => {
    const validObject = { name: 'John', age: 25 };
    const invalidObject = { name: 'J', age: 16 };
    
    // Valid object
    expect(() => objectValidator.assertValid(validObject)).not.toThrow();
    expect(objectValidator.assertValid(validObject)).toEqual(validObject);
    
    // Invalid object
    expect(() => objectValidator.assertValid(invalidObject)).toThrowError(ValidationError);
    const result = objectValidator.validate(invalidObject);
    
    expect(result).toBeInstanceOf(ValidationError);
    if (result) {
      // Should have multiple issues (both name and age are invalid)
      expect(result.issues.length).toBe(2);
      
      // Check each issue has the right path
      const nameIssue = result.issues.find(i => i.path[0] === 'name');
      const ageIssue = result.issues.find(i => i.path[0] === 'age');
      
      expect(nameIssue).toBeDefined();
      expect(ageIssue).toBeDefined();
      
      // Check invalid values are captured
      expect(nameIssue?.invalidValue).toBe('J');
      expect(ageIssue?.invalidValue).toBe(16);
    }
  });
  
  it('should propagate validation errors with superRefine', () => {
    // Create a validator that uses superRefine to propagate errors
    class NestedValidator extends AbstractValidator<{ nested: string }> {
      private readonly stringValidator: TestValidator;
      
      constructor() {
        super();
        this.stringValidator = new TestValidator(10); // Require 10 chars
        
        this.schema = z.object({
          nested: z.string().superRefine((value, ctx) => {
            try {
              this.stringValidator.assertValid(value);
            } catch (e) {
              if (e instanceof ValidationError) {
                e.issues.forEach(issue => {
                  ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: issue.message,
                    path: [...(issue.path || [])],
                    params: issue.metadata
                  });
                });
                return z.NEVER;
              }
            }
          })
        });
      }
    }
    
    const nestedValidator = new NestedValidator();
    
    // Invalid nested value
    const invalidObject = { nested: 'short' };
    try {
      nestedValidator.assertValid(invalidObject);
      fail('Should have thrown ValidationError');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      if (error instanceof ValidationError) {
        // Error should contain message from the nested validator
        expect(error.issues[0].message).toContain('10 characters');
        // Path should include 'nested' property
        expect(error.issues[0].path[0]).toBe('nested');
      }
    }
  });
});