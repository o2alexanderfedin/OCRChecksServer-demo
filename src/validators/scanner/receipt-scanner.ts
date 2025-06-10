/**
 * Receipt scanner validators
 */
import { z } from 'zod';
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
 * Receipt scanner input validator
 */
@injectable()
export class ReceiptScannerInputValidator extends AbstractValidator<ScannerInput> implements IScannerInputValidator {
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
            message: "Unsupported image MIME type for receipt scanning",
            path: [],
            params: { 
              supportedTypes: this.getSupportedMimeTypes() 
            }
          });
          return z.NEVER;
        }
      }),
      options: this.optionsValidator.optional().superRefine((options, ctx) => {
        if (options?.forceOCR === true && options?.enhanceImage === false) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "When forcing OCR, image enhancement should not be disabled",
            path: ["enhanceImage"],
            params: { conflictingOption: "forceOCR" }
          });
          return z.NEVER;
        }
      })
    });
  }
  
  /**
   * Checks if the MIME type is a valid image type for receipt scanning
   */
  private isValidImageMimeType(mimeType: string): boolean {
    const supportedTypes = this.getSupportedMimeTypes();
    return supportedTypes.includes(mimeType.toLowerCase());
  }
  
  /**
   * Gets the list of supported MIME types for receipt scanning
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