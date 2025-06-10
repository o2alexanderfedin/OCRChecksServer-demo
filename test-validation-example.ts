// Test with built-in test setup
import './test-setup.ts';
import { ApiKeyValidator, ValidationError } from './src/validators/index.ts';

describe('ApiKeyValidator Test', () => {
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
    expect(() => validator.assertValid(key)).toThrowError(ValidationError);
  });
});