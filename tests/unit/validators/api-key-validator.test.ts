/**
 * Unit tests for API Key validator
 */
import { ApiKeyValidator, ValidationError } from '../../../src/validators';

describe('ApiKeyValidator', () => {
  let validator: ApiKeyValidator;
  
  beforeEach(() => {
    validator = new ApiKeyValidator({
      apiKeyMinLength: 20,
      forbiddenPatterns: ['test', 'placeholder']
    });
  });
  
  it('should accept valid API keys', () => {
    const key = 'valid-api-key-12345678901234';
    expect(() => validator.assertValid(key)).not.toThrow();
  });
  
  it('should reject keys that are too short', () => {
    const key = 'short-key';
    expect(() => validator.assertValid(key)).toThrow(jasmine.any(ValidationError));
  });
  
  it('should reject keys containing forbidden patterns', () => {
    const key = 'this-is-a-test-api-key-123456789';
    expect(() => validator.assertValid(key)).toThrow(jasmine.any(ValidationError));
  });
  
  it('should return a strongly-typed validation error with details', () => {
    const key = 'short-placeholder-key';
    try {
      validator.assertValid(key);
      fail('Should have thrown ValidationError');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      if (error instanceof ValidationError) {
        // Check error formatting
        expect(error.getFormattedMessage()).toContain('API key appears to be a placeholder value');
        
        // Check individual issues
        expect(error.issues.length).toBeGreaterThan(0);
        
        // Make sure the original value is preserved
        expect(error.originalValue).toBe(key);
      }
    }
  });
  
  it('should validate without throwing when using validate()', () => {
    const key = 'short-placeholder-key';
    const result = validator.validate(key);
    
    expect(result).toBeInstanceOf(ValidationError);
    expect(result?.issues.length).toBeGreaterThan(0);
  });
  
  it('should return undefined from validate() for valid keys', () => {
    const key = 'valid-api-key-12345678901234';
    const result = validator.validate(key);
    
    expect(result).toBeUndefined();
  });
});