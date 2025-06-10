/**
 * Unit tests for URL validator
 */
import '../../../test-setup.ts';
import { UrlValidator, ValidationError } from '../../../src/validators/index.ts';

describe('UrlValidator', () => {
  let validator: UrlValidator;
  
  beforeEach(() => {
    validator = new UrlValidator();
  });
  
  it('should accept valid URLs', () => {
    const urls = [
      'https://api.mistral.ai',
      'http://localhost:8080',
      'https://example.com/path/to/resource?query=param#fragment'
    ];
    
    for (const url of urls) {
      expect(() => validator.assertValid(url)).not.toThrow();
    }
  });
  
  it('should reject invalid URLs', () => {
    const invalidUrls = [
      'not-a-url',
      'just some text'
    ];
    
    for (const url of invalidUrls) {
      expect(() => validator.assertValid(url)).toThrowError(ValidationError);
    }
  });
  
  it('should enforce HTTPS in production environment', () => {
    // Save original NODE_ENV
    const originalEnv = process.env.NODE_ENV;
    
    try {
      // Set environment to production
      process.env.NODE_ENV = 'production';
      
      // HTTP URL should be rejected in production
      const httpUrl = 'http://api.mistral.ai';
      expect(() => validator.assertValid(httpUrl)).toThrowError(ValidationError);
      
      // HTTPS URL should be accepted
      const httpsUrl = 'https://api.mistral.ai';
      expect(() => validator.assertValid(httpsUrl)).not.toThrow();
    } finally {
      // Restore original NODE_ENV
      process.env.NODE_ENV = originalEnv;
    }
  });
  
  it('should allow HTTP URLs in non-production environments', () => {
    // Save original NODE_ENV
    const originalEnv = process.env.NODE_ENV;
    
    try {
      // Set environment to development
      process.env.NODE_ENV = 'development';
      
      // HTTP URL should be accepted in development
      const httpUrl = 'http://localhost:8080';
      expect(() => validator.assertValid(httpUrl)).not.toThrow();
    } finally {
      // Restore original NODE_ENV
      process.env.NODE_ENV = originalEnv;
    }
  });
  
  it('should provide detailed error information', () => {
    const invalidUrl = 'not-a-url';
    
    try {
      validator.assertValid(invalidUrl);
      fail('Should have thrown ValidationError');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      if (error instanceof ValidationError) {
        expect(error.issues.length).toBeGreaterThan(0);
        expect(error.issues[0].message).toContain('URL');
        expect(error.originalValue).toBe(invalidUrl);
      }
    }
  });
});