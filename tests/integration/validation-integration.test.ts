/**
 * Integration tests for validation system
 */
import { Container } from 'inversify';
import { 
  registerValidators, 
  ApiKeyValidator, 
  MistralConfigValidator,
  ValidationMiddleware,
  TYPES,
  ApiKey,
  Url,
  ValidationError
} from '../../src/validators';

describe('Validation System Integration', () => {
  let container: Container;
  
  beforeEach(() => {
    container = new Container();
    registerValidators(container);
  });
  
  it('should register all validators in the container', () => {
    expect(container.isBound(TYPES.ApiKeyValidator)).toBeTruthy();
    expect(container.isBound(TYPES.UrlValidator)).toBeTruthy();
    expect(container.isBound(TYPES.MistralConfigValidator)).toBeTruthy();
  });
  
  it('should validate API keys using the validator from the container', () => {
    const apiKeyValidator = container.get<ApiKeyValidator>(TYPES.ApiKeyValidator);
    
    // Valid key
    const validKey = 'valid-api-key-12345678901234';
    const result = apiKeyValidator.assertValid(validKey);
    expect(typeof result).toBe('string');
    
    // ApiKey should be a branded type
    const apiKey: ApiKey = result;
    expect(apiKey).toBe(validKey);
    
    // Invalid key
    const invalidKey = 'short';
    expect(() => apiKeyValidator.assertValid(invalidKey)).toThrow(ValidationError);
  });
  
  it('should validate Mistral configurations using the validator from the container', () => {
    const mistralConfigValidator = container.get<MistralConfigValidator>(TYPES.MistralConfigValidator);
    
    // Valid config
    const validConfig = {
      apiKey: 'valid-api-key-12345678901234',
      timeout: 5000
    };
    
    expect(() => mistralConfigValidator.assertValid(validConfig)).not.toThrow();
    
    // Invalid config
    const invalidConfig = {
      apiKey: 'short',
      timeout: -5000
    };
    
    expect(() => mistralConfigValidator.assertValid(invalidConfig)).toThrow(ValidationError);
  });
  
  it('should use validation middleware correctly', () => {
    const middleware = container.get<ValidationMiddleware>(TYPES.ValidationMiddleware);
    const apiKeyValidator = container.get<ApiKeyValidator>(TYPES.ApiKeyValidator);
    
    // Create mock Express objects
    const req: any = {
      body: {
        apiKey: 'valid-api-key-12345678901234'
      }
    };
    
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    const next = jest.fn();
    
    // Create body validator middleware
    const bodyValidator = middleware.createBodyValidator(apiKeyValidator);
    
    // Valid body
    bodyValidator(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Invalid body
    req.body.apiKey = 'short';
    bodyValidator(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
    
    // Check that the error response includes details
    const errorResponse = res.json.mock.calls[0][0];
    expect(errorResponse.error).toBe('Validation failed');
    expect(errorResponse.details.length).toBeGreaterThan(0);
  });
});