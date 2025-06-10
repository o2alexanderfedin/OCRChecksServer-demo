/**
 * Validation middleware for API endpoints
 */
import { Request, Response, NextFunction } from 'express';
import { injectable } from 'inversify';
import { IDomainValidator, ValidationError } from '../types.ts';

/**
 * Middleware that validates request bodies
 */
@injectable()
export class ValidationMiddleware {
  /**
   * Create middleware for validating a specific request type
   */
  public createBodyValidator<T>(validator: IDomainValidator<T>) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        // Validate request body
        const validBody = validator.assertValid(req.body as T);
        
        // Replace body with validated version
        req.body = validBody;
        
        // Continue to next middleware
        next();
      } catch (error) {
        if (error instanceof ValidationError) {
          // Format the validation error for the API response
          // The error includes detailed information from nested validators
          res.status(400).json({
            error: "Validation failed",
            details: error.issues.map(issue => ({
              path: issue.path.join('.'),
              message: issue.message,
              code: issue.code,
              // Don't include invalid values in API responses for security reasons
              metadata: issue.metadata ? {
                ...issue.metadata,
                // Remove sensitive metadata
                originalValue: undefined 
              } : undefined
            }))
          });
        } else {
          next(error);
        }
      }
    };
  }
  
  /**
   * Create middleware for validating URL parameters
   */
  public createParamValidator<T>(paramName: string, validator: IDomainValidator<T>) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        // Validate param
        const validParam = validator.assertValid(req.params[paramName] as any);
        
        // Replace param with validated version
        req.params[paramName] = validParam as any;
        
        // Continue to next middleware
        next();
      } catch (error) {
        if (error instanceof ValidationError) {
          res.status(400).json({
            error: `Invalid ${paramName} parameter`,
            details: error.issues.map(issue => ({
              message: issue.message,
              code: issue.code
            }))
          });
        } else {
          next(error);
        }
      }
    };
  }
  
  /**
   * Create middleware for validating query parameters
   */
  public createQueryValidator<T>(queryName: string, validator: IDomainValidator<T>) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        // Validate query parameter
        const validQuery = validator.assertValid(req.query[queryName] as any);
        
        // Replace query with validated version
        req.query[queryName] = validQuery as any;
        
        // Continue to next middleware
        next();
      } catch (error) {
        if (error instanceof ValidationError) {
          res.status(400).json({
            error: `Invalid ${queryName} query parameter`,
            details: error.issues.map(issue => ({
              message: issue.message,
              code: issue.code
            }))
          });
        } else {
          next(error);
        }
      }
    };
  }
}