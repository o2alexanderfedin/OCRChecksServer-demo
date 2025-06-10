/**
 * Unit tests for ValidationMiddleware
 */
import '../../../test-setup.ts';
import { ValidationMiddleware, ValidationError, ApiKeyValidator } from '../../../src/validators/index.ts';

describe('ValidationMiddleware', () => {
  let middleware: ValidationMiddleware;
  let apiKeyValidator: ApiKeyValidator;
  
  beforeEach(() => {
    middleware = new ValidationMiddleware();
    apiKeyValidator = new ApiKeyValidator({
      apiKeyMinLength: 20,
      forbiddenPatterns: ['forbidden-pattern-placeholder']
    });
  });
  
  it('should create body validator middleware', () => {
    // Create a body validator middleware
    const bodyValidator = middleware.createBodyValidator(apiKeyValidator);
    
    // Should return a function
    expect(typeof bodyValidator).toBe('function');
  });
  
  it('should pass valid requests to the next middleware', () => {
    // Create a body validator middleware
    const bodyValidator = middleware.createBodyValidator(apiKeyValidator);
    
    // Create mock request, response, and next function
    const req: any = { body: 'valid-production-token-1234567890' };
    let nextCalled = false;
    let statusCalled = false;
    const res: any = {
      status: () => {
        statusCalled = true;
        return { json: () => {} };
      },
      json: () => {}
    };
    const next = () => { nextCalled = true; };
    
    // Call middleware with valid body
    bodyValidator(req, res, next);
    
    // Should call next and not call status/json
    expect(nextCalled).toBe(true);
    expect(statusCalled).toBe(false);
    
    // Should replace req.body with validated value
    expect(req.body).toBe('valid-production-token-1234567890');
  });
});