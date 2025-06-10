/**
 * Scanner validation types
 */
import { IDomainValidator } from '../types.ts';

/**
 * Scanner options type
 */
export interface ScannerOptions {
  enhanceImage?: boolean;
  detectOrientation?: boolean;
  timeout?: number;
  forceOCR?: boolean;
}

/**
 * Scanner input type
 */
export interface ScannerInput {
  file: File | Buffer | ArrayBuffer | string; // File object, Buffer, ArrayBuffer, or file path
  mimeType?: string;
  options?: ScannerOptions;
}

/**
 * Interface for ScannerInput validators
 */
export interface IScannerInputValidator extends IDomainValidator<ScannerInput> {
  // Any additional methods specific to scanner input validation
}

/**
 * Scanner output type
 */
export interface ScannerOutput {
  text: string;
  confidence: number;
  duration: number;
  metadata?: Record<string, unknown>;
}

/**
 * Interface for ScannerOutput validators
 */
export interface IScannerOutputValidator extends IDomainValidator<ScannerOutput> {
  // Any additional methods specific to scanner output validation
}