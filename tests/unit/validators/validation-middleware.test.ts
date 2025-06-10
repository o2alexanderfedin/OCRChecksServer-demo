/**
 * Unit tests for ValidationMiddleware
 */
import { ValidationMiddleware, ValidationError, ApiKeyValidator } from '../../../src/validators.ts';

describe('ValidationMiddleware', () => {
  let middleware: ValidationMiddleware;
  let apiKeyValidator: ApiKeyValidator;
  
  beforeEach(() => {
    middleware = new ValidationMiddleware();
    apiKeyValidator = new ApiKeyValidator({
      apiKeyMinLength: 20,
      forbiddenPatterns: ['test', 'placeholder']
    });
  });
  
  describe('createBodyValidator', () => {
    it('should pass valid requests to the next middleware', () => {
      // Create a body validator middleware
      const bodyValidator = middleware.createBodyValidator(apiKeyValidator);
      
      // Create mock request, response, and next function
      const req: any = { body: 'valid-api-key-12345678901234' };
      const res: any = {
        status: jasmine.createSpy('status').and.returnValue({}),
        json: jasmine.createSpy('json')
      };
      const next = jasmine.createSpy('next');
      
      // Call middleware with valid body
      bodyValidator(req, res, next);
      
      // Should call next and not call status/json
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      
      // Should replace req.body with validated value
      expect(req.body).toBe('valid-api-key-12345678901234');
    });
    
    it('should return 400 with error details for invalid requests', () => {
      // Create a body validator middleware
      const bodyValidator = middleware.createBodyValidator(apiKeyValidator);
      
      // Create mock request, response, and next function
      const req: any = { body: 'short' };
      const res: any = {
        status: jasmine.createSpy('status').and.returnValue({
          json: jasmine.createSpy('json')
        })
      };
      const next = jasmine.createSpy('next');
      
      // Call middleware with invalid body
      bodyValidator(req, res, next);
      
      // Should not call next
      expect(next).not.toHaveBeenCalled();
      
      // Should return 400 status with error details
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.status().json).toHaveBeenCalled();
      
      // Check error response format
      const errorResponse = res.status().json.calls.mostRecent().args[0];
      expect(errorResponse.error).toBe('Validation failed');
      expect(errorResponse.details).toBeDefined();
      expect(errorResponse.details.length).toBeGreaterThan(0);
      
      // Check that no sensitive data is exposed
      const firstDetail = errorResponse.details[0];
      expect(firstDetail.message).toBeDefined();
      expect(firstDetail.path).toBeDefined();
      expect(firstDetail.code).toBeDefined();
      // Should not include originalValue in API responses
      expect(firstDetail.originalValue).toBeUndefined();
    });
    
    it('should pass non-validation errors to next middleware', () => {
      // Create a validator that throws non-validation errors
      const errorValidator = {
        assertValid: jasmine.createSpy('assertValid').and.callFake(() => {
          throw new Error('Some other error');
        }),
        validate: jasmine.createSpy('validate')
      };
      
      // Create a body validator middleware
      const bodyValidator = middleware.createBodyValidator(errorValidator);
      
      // Create mock request, response, and next function
      const req: any = { body: {} };
      const res: any = {
        status: jasmine.createSpy('status').and.returnValue({
          json: jasmine.createSpy('json')
        })
      };
      const next = jasmine.createSpy('next');
      
      // Call middleware with validator that throws non-validation error
      bodyValidator(req, res, next);
      
      // Should call next with the error
      expect(next).toHaveBeenCalled();
      expect(next.calls.mostRecent().args[0].message).toBe('Some other error');
      
      // Should not try to handle the error itself
      expect(res.status).not.toHaveBeenCalled();
    });
  });
  
  describe('createParamValidator', () => {
    it('should validate URL parameters and pass to next middleware', () => {
      // Create a param validator middleware
      const paramValidator = middleware.createParamValidator('apiKey', apiKeyValidator);
      
      // Create mock request, response, and next function
      const req: any = { params: { apiKey: 'valid-api-key-12345678901234' } };
      const res: any = {
        status: jasmine.createSpy('status').and.returnValue({
          json: jasmine.createSpy('json')
        })
      };
      const next = jasmine.createSpy('next');
      
      // Call middleware with valid param
      paramValidator(req, res, next);
      
      // Should call next and not call status/json
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    it('should return 400 for invalid URL parameters', () => {
      // Create a param validator middleware
      const paramValidator = middleware.createParamValidator('apiKey', apiKeyValidator);
      
      // Create mock request, response, and next function
      const req: any = { params: { apiKey: 'short' } };
      const res: any = {
        status: jasmine.createSpy('status').and.returnValue({
          json: jasmine.createSpy('json')
        })
      };
      const next = jasmine.createSpy('next');
      
      // Call middleware with invalid param
      paramValidator(req, res, next);
      
      // Should not call next
      expect(next).not.toHaveBeenCalled();
      
      // Should return 400 status with error details
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.status().json).toHaveBeenCalled();
      
      // Error message should include the param name
      const errorResponse = res.status().json.calls.mostRecent().args[0];
      expect(errorResponse.error).toContain('apiKey');
    });
  });
  
  describe('createQueryValidator', () => {
    it('should validate query parameters and pass to next middleware', () => {
      // Create a query validator middleware
      const queryValidator = middleware.createQueryValidator('apiKey', apiKeyValidator);
      
      // Create mock request, response, and next function
      const req: any = { query: { apiKey: 'valid-api-key-12345678901234' } };
      const res: any = {
        status: jasmine.createSpy('status').and.returnValue({
          json: jasmine.createSpy('json')
        })
      };
      const next = jasmine.createSpy('next');
      
      // Call middleware with valid query param
      queryValidator(req, res, next);
      
      // Should call next and not call status/json
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    it('should return 400 for invalid query parameters', () => {
      // Create a query validator middleware
      const queryValidator = middleware.createQueryValidator('apiKey', apiKeyValidator);
      
      // Create mock request, response, and next function
      const req: any = { query: { apiKey: 'short' } };
      const res: any = {
        status: jasmine.createSpy('status').and.returnValue({
          json: jasmine.createSpy('json')
        })
      };
      const next = jasmine.createSpy('next');
      
      // Call middleware with invalid query param
      queryValidator(req, res, next);
      
      // Should not call next
      expect(next).not.toHaveBeenCalled();
      
      // Should return 400 status with error details
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.status().json).toHaveBeenCalled();
      
      // Error message should include the query param name
      const errorResponse = res.status().json.calls.mostRecent().args[0];
      expect(errorResponse.error).toContain('apiKey');
    });
  });
});