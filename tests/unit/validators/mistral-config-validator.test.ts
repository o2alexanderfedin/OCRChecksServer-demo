/**
 * Unit tests for Mistral Config validator
 */
import { 
  MistralConfigValidator, 
  ApiKeyValidator,
  UrlValidator,
  NumberValidator,
  ValidationError
} from '../../../src/validators';

// Create a mock API Key validator
class MockApiKeyValidator extends ApiKeyValidator {
  constructor() {
    super({
      apiKeyMinLength: 20,
      forbiddenPatterns: ['test', 'placeholder']
    });
  }
}

describe('MistralConfigValidator', () => {
  let validator: MistralConfigValidator;
  let apiKeyValidator: ApiKeyValidator;
  let urlValidator: UrlValidator;
  let numberValidator: NumberValidator;
  
  beforeEach(() => {
    apiKeyValidator = new MockApiKeyValidator();
    urlValidator = new UrlValidator();
    numberValidator = new NumberValidator(1, 60000);
    
    validator = new MistralConfigValidator(
      apiKeyValidator,
      urlValidator,
      numberValidator
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
  });
  
  it('should reject configurations with invalid API keys', () => {
    const config = {
      apiKey: 'short-key',
      baseUrl: 'https://api.mistral.ai',
      timeout: 30000
    };
    
    expect(() => validator.assertValid(config)).toThrow(ValidationError);
  });
  
  it('should reject configurations with invalid URLs', () => {
    const config = {
      apiKey: 'valid-api-key-12345678901234',
      baseUrl: 'not-a-url',
      timeout: 30000
    };
    
    expect(() => validator.assertValid(config)).toThrow(ValidationError);
  });
  
  it('should reject configurations with invalid timeout values', () => {
    const config = {
      apiKey: 'valid-api-key-12345678901234',
      baseUrl: 'https://api.mistral.ai',
      timeout: -1000
    };
    
    expect(() => validator.assertValid(config)).toThrow(ValidationError);
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
    
    expect(() => validator.assertValid(config)).toThrow(ValidationError);
  });
  
  it('should propagate nested validation errors with detailed messages', () => {
    const config = {
      apiKey: 'short-placeholder-key',
      baseUrl: 'not-a-url',
      timeout: -1000
    };
    
    try {
      validator.assertValid(config);
      fail('Should have thrown ValidationError');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      if (error instanceof ValidationError) {
        // Should contain multiple issues
        expect(error.issues.length).toBeGreaterThan(1);
        
        // Should have detailed error messages from nested validators
        const errorMessage = error.getFormattedMessage();
        expect(errorMessage).toContain('API key');
        expect(errorMessage).toContain('URL');
        
        // Original value should be preserved
        expect(error.originalValue).toBe(config);
      }
    }
  });
});