/**
 * Unit tests for Mistral Config validator
 */
import { 
  MistralConfigValidator,
  ApiKeyValidator,
  UrlValidator,
  NumberValidator,
  ValidationError,
  ApiKey,
  Url
} from '../../../src/validators';

describe('MistralConfigValidator', () => {
  let validator: MistralConfigValidator;
  let mockApiKeyValidator: jasmine.SpyObj<ApiKeyValidator>;
  let mockUrlValidator: jasmine.SpyObj<UrlValidator>;
  let mockNumberValidator: jasmine.SpyObj<NumberValidator>;
  
  beforeEach(() => {
    // Create mock validators using Jasmine spies
    mockApiKeyValidator = jasmine.createSpyObj('ApiKeyValidator', ['assertValid', 'validate']);
    mockUrlValidator = jasmine.createSpyObj('UrlValidator', ['assertValid', 'validate']);
    mockNumberValidator = jasmine.createSpyObj('NumberValidator', ['assertValid', 'validate']);
    
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
    expect(mockApiKeyValidator.assertValid).toHaveBeenCalledWith('valid-api-key-12345678901234');
    expect(mockUrlValidator.assertValid).toHaveBeenCalledWith('https://api.mistral.ai');
    expect(mockNumberValidator.assertValid).toHaveBeenCalledWith(30000);
  });
  
  it('should reject configurations with invalid API keys', () => {
    const config = {
      apiKey: 'short-key',
      baseUrl: 'https://api.mistral.ai',
      timeout: 30000
    };
    
    expect(() => validator.assertValid(config)).toThrow(jasmine.any(ValidationError));
    expect(mockApiKeyValidator.assertValid).toHaveBeenCalledWith('short-key');
  });
  
  it('should reject configurations with invalid URLs', () => {
    const config = {
      apiKey: 'valid-api-key-12345678901234',
      baseUrl: 'not-a-url',
      timeout: 30000
    };
    
    expect(() => validator.assertValid(config)).toThrow(jasmine.any(ValidationError));
    expect(mockApiKeyValidator.assertValid).toHaveBeenCalledWith('valid-api-key-12345678901234');
    expect(mockUrlValidator.assertValid).toHaveBeenCalledWith('not-a-url');
  });
  
  it('should reject configurations with invalid timeout values', () => {
    const config = {
      apiKey: 'valid-api-key-12345678901234',
      baseUrl: 'https://api.mistral.ai',
      timeout: -1000
    };
    
    expect(() => validator.assertValid(config)).toThrow(jasmine.any(ValidationError));
    expect(mockApiKeyValidator.assertValid).toHaveBeenCalledWith('valid-api-key-12345678901234');
    expect(mockUrlValidator.assertValid).toHaveBeenCalledWith('https://api.mistral.ai');
    expect(mockNumberValidator.assertValid).toHaveBeenCalledWith(-1000);
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
    
    expect(() => validator.assertValid(config)).toThrow(jasmine.any(ValidationError));
    expect(mockApiKeyValidator.assertValid).toHaveBeenCalledWith('valid-api-key-12345678901234');
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
        expect(mockApiKeyValidator.assertValid).toHaveBeenCalled();
        expect(mockUrlValidator.assertValid).toHaveBeenCalled(); // Validator validates all fields
        expect(mockNumberValidator.assertValid).toHaveBeenCalled(); // Validator validates all fields
      }
    }
  });
});