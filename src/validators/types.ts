/**
 * Core validation types
 */
import { z } from 'zod';

/**
 * Detailed validation issue information
 */
export interface ValidationIssue {
  /** The error message */
  readonly message: string;
  
  /** Path to the invalid property */
  readonly path: (string | number)[];
  
  /** Error code (from Zod) */
  readonly code: string;
  
  /** The specific invalid value */
  readonly invalidValue?: any;
  
  /** Additional metadata about the validation error */
  readonly metadata?: Record<string, any>;
}

/**
 * Strongly-typed validation error class
 * @template T - The expected type that failed validation
 */
export class ValidationError<T> extends Error {
  /** The validation issues in detail */
  public readonly issues: ValidationIssue[];
  
  /** The original value that failed validation */
  public readonly originalValue: unknown;
  
  constructor(
    message: string, 
    issues: ValidationIssue[], 
    originalValue: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
    this.issues = issues;
    this.originalValue = originalValue;
  }
  
  /**
   * Get a formatted error message with details
   */
  public getFormattedMessage(): string {
    return `${this.message}\n\nIssues:\n${this.formatIssues()}`;
  }
  
  /**
   * Format the validation issues for display
   */
  private formatIssues(): string {
    return this.issues.map(issue => 
      `- ${issue.path.join('.')}: ${issue.message}`
    ).join('\n');
  }
}

/**
 * Generic domain validator interface
 * 
 * @template T - The type this validator validates
 */
export interface IDomainValidator<T> {
  /**
   * Validates the given value and returns it if valid
   * 
   * @param value - The value to validate (already typed as T)
   * @returns The validated value with guarantees it meets all validation rules
   * @throws ValidationError<T> if validation fails
   */
  assertValid(value: T): T;
  
  /**
   * Validates the given value and returns a validation error if invalid
   * 
   * @param value - The value to validate (already typed as T)
   * @returns ValidationError<T> if validation fails, undefined if valid
   */
  validate(value: T): ValidationError<T> | undefined;
}

/**
 * Branded type for API Key to ensure type safety
 */
export type ApiKey = string;

/**
 * Branded type for URL to ensure type safety
 */
export type Url = string;

/**
 * Result tuple type for validation results
 */
export type ValidationResult<T> = ['ok', T] | ['error', ValidationError<T>];

/**
 * Type identifiers for dependency injection
 */
export const TYPES = {
  // Core validators
  StringValidator: Symbol("StringValidator"),
  NumberValidator: Symbol("NumberValidator"),
  
  // Domain-specific validators
  ApiKeyValidator: Symbol("ApiKeyValidator"),
  UrlValidator: Symbol("UrlValidator"),
  MistralConfigValidator: Symbol("MistralConfigValidator"),
  ScannerInputValidator: Symbol("ScannerInputValidator"),
  
  // Configuration
  ValidationConfig: Symbol("ValidationConfig"),
  
  // File and options validators
  FileValidator: Symbol("FileValidator"),
  ScannerOptionsValidator: Symbol("ScannerOptionsValidator"),
  
  // Middleware
  ValidationMiddleware: Symbol("ValidationMiddleware")
};

/**
 * Validation configuration type
 */
export interface ValidationConfig {
  apiKeyMinLength: number;
  forbiddenPatterns: string[];
}