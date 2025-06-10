/**
 * Unit tests for Mistral Config validator
 */
import 'jasmine';
import { 
  MistralConfigValidator,
  ApiKeyValidator,
  UrlValidator,
  NumberValidator,
  ValidationError,
  ApiKey,
  Url
} from '../../../src/validators/index.ts';

// Create our own simplified mock function since jasmine.createSpy might not be available
interface MockFunction {
    (...args: any[]): any;
    calls: {
        count: number;
        args: any[][];
        reset(): void;
    };
    mockReturnValue(val: any): MockFunction;
    mockImplementation(fn: Function): MockFunction;
    and: {
        callFake(fn: Function): MockFunction;
        returnValue(val: any): MockFunction;
    };
}

function createSpy(name: string): MockFunction {
    const fn = function(...args: any[]) {
        fn.calls.count++;
        fn.calls.args.push(args);
        if (fn._implementation) {
            return fn._implementation(...args);
        }
        return fn._returnValue;
    } as MockFunction & { _implementation?: Function; _returnValue?: any; };
    
    fn.calls = {
        count: 0,
        args: [],
        reset() {
            this.count = 0;
            this.args = [];
        }
    };
    
    fn.mockReturnValue = function(val: any) {
        fn._returnValue = val;
        return fn;
    };
    
    fn.mockImplementation = function(impl: Function) {
        fn._implementation = impl;
        return fn;
    };
    
    fn.and = {
        callFake(impl: Function) {
            fn._implementation = impl;
            return fn;
        },
        returnValue(val: any) {
            fn._returnValue = val;
            return fn;
        }
    };
    
    return fn;
}

describe('MistralConfigValidator', () => {
  let validator: MistralConfigValidator;
  let mockApiKeyValidator: any;
  let mockUrlValidator: any;
  let mockNumberValidator: any;
  
  beforeEach(() => {
    // Create mock validators manually using our custom spy function
    mockApiKeyValidator = {
      assertValid: createSpy('assertValid'),
      validate: createSpy('validate')
    };
    
    mockUrlValidator = {
      assertValid: createSpy('assertValid'),
      validate: createSpy('validate')
    };
    
    mockNumberValidator = {
      assertValid: createSpy('assertValid'),
      validate: createSpy('validate')
    };
    
    // Configure mock behavior for valid values
    mockApiKeyValidator.assertValid.and.callFake((key) => {
      if (key === 'valid-api-key-12345678901234') {
        return key as ApiKey;
      } else {
        throw new ValidationError('Validation failed', [
          { message: 'Invalid API key', path: [], code: 'custom', invalidValue: key }
        ], key);
      }
    });
    
    mockUrlValidator.assertValid.and.callFake((url) => {
      if (url.startsWith('http')) {
        return url as Url;
      } else {
        throw new ValidationError('Validation failed', [
          { message: 'Invalid URL format', path: [], code: 'custom', invalidValue: url }
        ], url);
      }
    });
    
    mockNumberValidator.assertValid.and.callFake((value) => {
      if (value > 0) {
        return value;
      } else {
        throw new ValidationError('Validation failed', [
          { message: 'Value must be positive', path: [], code: 'custom', invalidValue: value }
        ], value);
      }
    });
    
    // Create validator with mocks
    validator = new MistralConfigValidator(
      mockApiKeyValidator,
      mockUrlValidator as any,
      mockNumberValidator
    );
  });
  
  it('should accept valid configurations', () => {
    const config = {
      apiKey: 'valid-api-key-12345678901234',
      baseUrl: 'https://api.mistral.ai',
      timeout: 30000,
      retryConfig: {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 5000
      }
    };
    
    expect(() => validator.assertValid(config)).not.toThrow();
    // Verify the mock was called with correct arguments
    expect(mockApiKeyValidator.assertValid.calls.count).toBe(1);
    expect(mockApiKeyValidator.assertValid.calls.args[0][0]).toBe('valid-api-key-12345678901234');
    expect(mockUrlValidator.assertValid.calls.count).toBe(1);
    expect(mockUrlValidator.assertValid.calls.args[0][0]).toBe('https://api.mistral.ai');
    expect(mockNumberValidator.assertValid.calls.count).toBe(1);
    expect(mockNumberValidator.assertValid.calls.args[0][0]).toBe(30000);
  });
  
  it('should reject configurations with invalid API keys', () => {
    const config = {
      apiKey: 'short-key',
      baseUrl: 'https://api.mistral.ai',
      timeout: 30000
    };
    
    expect(() => validator.assertValid(config)).toThrowError(ValidationError);
    expect(mockApiKeyValidator.assertValid.calls.count).toBe(1);
    expect(mockApiKeyValidator.assertValid.calls.args[0][0]).toBe('short-key');
  });
  
  it('should reject configurations with invalid URLs', () => {
    const config = {
      apiKey: 'valid-api-key-12345678901234',
      baseUrl: 'not-a-url',
      timeout: 30000
    };
    
    expect(() => validator.assertValid(config)).toThrowError(ValidationError);
    expect(mockApiKeyValidator.assertValid.calls.count).toBe(1);
    expect(mockApiKeyValidator.assertValid.calls.args[0][0]).toBe('valid-api-key-12345678901234');
    expect(mockUrlValidator.assertValid.calls.count).toBe(1);
    expect(mockUrlValidator.assertValid.calls.args[0][0]).toBe('not-a-url');
  });
  
  it('should reject configurations with invalid timeout values', () => {
    const config = {
      apiKey: 'valid-api-key-12345678901234',
      baseUrl: 'https://api.mistral.ai',
      timeout: -1000
    };
    
    expect(() => validator.assertValid(config)).toThrowError(ValidationError);
    expect(mockApiKeyValidator.assertValid.calls.count).toBe(1);
    expect(mockApiKeyValidator.assertValid.calls.args[0][0]).toBe('valid-api-key-12345678901234');
    expect(mockUrlValidator.assertValid.calls.count).toBe(1);
    expect(mockUrlValidator.assertValid.calls.args[0][0]).toBe('https://api.mistral.ai');
    expect(mockNumberValidator.assertValid.calls.count).toBe(1);
    expect(mockNumberValidator.assertValid.calls.args[0][0]).toBe(-1000);
  });
  
  it('should reject configurations with invalid retry configs', () => {
    const config = {
      apiKey: 'valid-api-key-12345678901234',
      retryConfig: {
        maxRetries: 3,
        initialDelay: 5000,
        maxDelay: 1000 // maxDelay < initialDelay is invalid
      }
    };
    
    expect(() => validator.assertValid(config)).toThrowError(ValidationError);
    expect(mockApiKeyValidator.assertValid.calls.count).toBe(1);
    expect(mockApiKeyValidator.assertValid.calls.args[0][0]).toBe('valid-api-key-12345678901234');
  });
  
  it('should propagate nested validation errors with detailed messages', () => {
    const config = {
      apiKey: 'short-key',
      baseUrl: 'not-a-url',
      timeout: -1000
    };
    
    try {
      validator.assertValid(config);
      fail('Should have thrown ValidationError');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      if (error instanceof ValidationError) {
        // Should have error details from the nested validators
        const errorMessage = error.getFormattedMessage();
        expect(errorMessage).toContain('Invalid API key');
        
        // All of the mocks should have been called
        expect(mockApiKeyValidator.assertValid.calls.count).toBeGreaterThan(0);
        expect(mockUrlValidator.assertValid.calls.count).toBeGreaterThan(0); // Validator validates all fields
        expect(mockNumberValidator.assertValid.calls.count).toBeGreaterThan(0); // Validator validates all fields
      }
    }
  });
});