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
      forbiddenPatterns: ['valid-production-token-placeholder']
    });
  });
  
  it('should pass valid requests to the next middleware', () => {
      // Create a body validator middleware
      const bodyValidator = middleware.createBodyValidator(apiKeyValidator);
      
      // Create mock request, response, and next function
      const req: any = { body: 'valid-api-key-12345678901234' };
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
      expect(req.body).toBe('valid-api-key-12345678901234');
    });
    
    it('should return 400 with error details for invalid requests', () => {
      // Create a body validator middleware
      const bodyValidator = middleware.createBodyValidator(apiKeyValidator);
      
      // Create mock request, response, and next function
      const req: any = { body: 'short' };
      let nextCalled = false;
      let statusCode = 0;
      let responseData: any = null;
      const res: any = {
        status: (code: number) => {
          statusCode = code;
          return {
            json: (data: any) => {
              responseData = data;
            }
          };
        }
      };
      const next = () => { nextCalled = true; };
      
      // Call middleware with invalid body
      bodyValidator(req, res, next);
      
      // Should not call next
      expect(nextCalled).toBe(false);
      
      // Should return 400 status with error details
      expect(statusCode).toBe(400);
      expect(responseData).toBeDefined();
      expect(responseData.error).toBe('Validation failed');
      expect(responseData.details).toBeDefined();
      expect(responseData.details.length).toBeGreaterThan(0);
      
      // Check that no sensitive data is exposed
      const firstDetail = responseData.details[0];
      expect(firstDetail.message).toBeDefined();
      expect(firstDetail.path).toBeDefined();
      expect(firstDetail.code).toBeDefined();
      // Should not include originalValue in API responses
      expect(firstDetail.originalValue).toBeUndefined();
    });
    
    it('should pass non-validation errors to next middleware', () => {
      // Create a validator that throws non-validation errors
      const errorValidator = {
        assertValid: () => {
          throw new Error('Some other error');
        },
        validate: () => undefined
      };
      
      // Create a body validator middleware
      const bodyValidator = middleware.createBodyValidator(errorValidator);
      
      // Create mock request, response, and next function
      const req: any = { body: {} };
      let statusCalled = false;
      let nextError: any = null;
      const res: any = {
        status: () => {
          statusCalled = true;
          return { json: () => {} };
        }
      };
      const next = (error?: any) => { nextError = error; };
      
      // Call middleware with validator that throws non-validation error
      bodyValidator(req, res, next);
      
      // Should call next with the error
      expect(nextError).toBeDefined();
      expect(nextError.message).toBe('Some other error');
      
      // Should not try to handle the error itself
      expect(statusCalled).toBe(false);
    });
  
  describe('createParamValidator', () => {
    it('should validate URL parameters and pass to next middleware', () => {
      // Create a param validator middleware
      const paramValidator = middleware.createParamValidator('apiKey', apiKeyValidator);
      
      // Create mock request, response, and next function
      const req: any = { params: { apiKey: 'valid-api-key-12345678901234' } };
      let nextCalled = false;
      let statusCalled = false;
      const res: any = {
        status: () => {
          statusCalled = true;
          return { json: () => {} };
        }
      };
      const next = () => { nextCalled = true; };
      
      // Call middleware with valid param
      paramValidator(req, res, next);
      
      // Should call next and not call status/json
      expect(nextCalled).toBe(true);
      expect(statusCalled).toBe(false);
    });
    
    it('should return 400 for invalid URL parameters', () => {
      // Create a param validator middleware
      const paramValidator = middleware.createParamValidator('apiKey', apiKeyValidator);
      
      // Create mock request, response, and next function
      const req: any = { params: { apiKey: 'short' } };
      let nextCalled = false;
      let statusCode = 0;
      let responseData: any = null;
      const res: any = {
        status: (code: number) => {
          statusCode = code;
          return {
            json: (data: any) => {
              responseData = data;
            }
          };
        }
      };
      const next = () => { nextCalled = true; };
      
      // Call middleware with invalid param
      paramValidator(req, res, next);
      
      // Should not call next
      expect(nextCalled).toBe(false);
      
      // Should return 400 status with error details
      expect(statusCode).toBe(400);
      expect(responseData.error).toContain('apiKey');
    });
  });
  
  describe('createQueryValidator', () => {
    it('should validate query parameters and pass to next middleware', () => {
      // Create a query validator middleware
      const queryValidator = middleware.createQueryValidator('apiKey', apiKeyValidator);
      
      // Create mock request, response, and next function
      const req: any = { query: { apiKey: 'valid-api-key-12345678901234' } };
      let nextCalled = false;
      let statusCalled = false;
      const res: any = {
        status: () => {
          statusCalled = true;
          return { json: () => {} };
        }
      };
      const next = () => { nextCalled = true; };
      
      // Call middleware with valid query param
      queryValidator(req, res, next);
      
      // Should call next and not call status/json
      expect(nextCalled).toBe(true);
      expect(statusCalled).toBe(false);
    });
    
    it('should return 400 for invalid query parameters', () => {
      // Create a query validator middleware
      const queryValidator = middleware.createQueryValidator('apiKey', apiKeyValidator);
      
      // Create mock request, response, and next function
      const req: any = { query: { apiKey: 'short' } };
      let nextCalled = false;
      let statusCode = 0;
      let responseData: any = null;
      const res: any = {
        status: (code: number) => {
          statusCode = code;
          return {
            json: (data: any) => {
              responseData = data;
            }
          };
        }
      };
      const next = () => { nextCalled = true; };
      
      // Call middleware with invalid query param
      queryValidator(req, res, next);
      
      // Should not call next
      expect(nextCalled).toBe(false);
      
      // Should return 400 status with error details
      expect(statusCode).toBe(400);
      expect(responseData.error).toContain('apiKey');
    });
  });
});