/**
 * Check scanner validators
 */
import { z } from 'zod.js';
import { injectable, inject } from 'inversify';
import { AbstractValidator } from '../base.ts';
import { TYPES, ValidationError } from '../types.ts';
import { IScannerInputValidator, ScannerInput, ScannerOptions } from './types.ts';

/**
 * Interface for File validators
 */
export interface IFileValidator extends z.ZodType<File | Buffer | ArrayBuffer | string> {
  // Any additional methods specific to file validation
}

/**
 * Interface for ScannerOptions validators
 */
export interface IScannerOptionsValidator extends z.ZodType<ScannerOptions> {
  // Any additional methods specific to scanner options validation
}

/**
 * Check scanner input validator
 */
@injectable()
export class CheckScannerInputValidator extends AbstractValidator<ScannerInput> implements IScannerInputValidator {
  constructor(
    @inject(TYPES.FileValidator) private readonly fileValidator: IFileValidator,
    @inject(TYPES.ScannerOptionsValidator) private readonly optionsValidator: IScannerOptionsValidator
  ) {
    super();
    
    // Create the schema using Zod and the component validators
    this.schema = z.object({
      file: this.fileValidator,
      mimeType: z.string().optional().superRefine((mimeType, ctx) => {
        if (mimeType && !this.isValidImageMimeType(mimeType)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Unsupported image MIME type",
            path: [],
            params: { 
              supportedTypes: this.getSupportedMimeTypes() 
            }
          });
          return z.NEVER;
        }
      }),
      options: this.optionsValidator.optional()
    });
  }
  
  /**
   * Checks if the MIME type is a valid image type for check scanning
   */
  private isValidImageMimeType(mimeType: string): boolean {
    const supportedTypes = this.getSupportedMimeTypes();
    return supportedTypes.includes(mimeType.toLowerCase());
  }
  
  /**
   * Gets the list of supported MIME types for check scanning
   */
  private getSupportedMimeTypes(): string[] {
    return [
      'image/jpeg',
      'image/png',
      'image/heic',
      'image/heif',
      'application/pdf'
    ];
  }
}