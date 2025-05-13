/**
 * Unit tests for ValidationError class
 */
import { ValidationError } from '../../../src/validators';

describe('ValidationError', () => {
  it('should preserve error details', () => {
    const originalValue = { key: 'test', value: 123 };
    const issues = [
      { 
        message: 'Invalid key', 
        path: ['key'], 
        code: 'custom', 
        invalidValue: 'test' 
      },
      { 
        message: 'Value must be positive', 
        path: ['value'], 
        code: 'custom', 
        invalidValue: 123,
        metadata: { min: 0 } 
      }
    ];
    
    const error = new ValidationError('Validation failed', issues, originalValue);
    
    expect(error.message).toBe('Validation failed');
    expect(error.issues).toEqual(issues);
    expect(error.originalValue).toBe(originalValue);
  });
  
  it('should format error messages correctly', () => {
    const originalValue = { apiKey: 'test', timeout: -5 };
    const issues = [
      { 
        message: 'API key too short', 
        path: ['apiKey'], 
        code: 'too_small', 
        invalidValue: 'test' 
      },
      { 
        message: 'Timeout must be positive', 
        path: ['timeout'], 
        code: 'too_small', 
        invalidValue: -5 
      }
    ];
    
    const error = new ValidationError('Validation failed', issues, originalValue);
    const formattedMessage = error.getFormattedMessage();
    
    expect(formattedMessage).toContain('Validation failed');
    expect(formattedMessage).toContain('apiKey: API key too short');
    expect(formattedMessage).toContain('timeout: Timeout must be positive');
  });
  
  it('should handle nested paths in formatted messages', () => {
    const originalValue = { config: { retryConfig: { maxDelay: 1000, initialDelay: 5000 } } };
    const issues = [
      { 
        message: 'maxDelay must be greater than initialDelay', 
        path: ['config', 'retryConfig'], 
        code: 'custom', 
        invalidValue: { maxDelay: 1000, initialDelay: 5000 } 
      }
    ];
    
    const error = new ValidationError('Validation failed', issues, originalValue);
    const formattedMessage = error.getFormattedMessage();
    
    expect(formattedMessage).toContain('config.retryConfig: maxDelay must be greater than initialDelay');
  });
  
  it('should handle empty paths', () => {
    const originalValue = 'test';
    const issues = [
      { 
        message: 'Invalid format', 
        path: [], 
        code: 'custom', 
        invalidValue: 'test' 
      }
    ];
    
    const error = new ValidationError('Validation failed', issues, originalValue);
    const formattedMessage = error.getFormattedMessage();
    
    expect(formattedMessage).toContain('Invalid format');
  });
});