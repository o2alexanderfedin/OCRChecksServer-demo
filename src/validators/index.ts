/**
 * Validators module index
 */
import { Container } from 'inversify';
import { z } from 'zod';
import { StringValidator, NumberValidator } from './base';
import { 
  ApiKeyValidator, 
  UrlValidator, 
  MistralConfigValidator,
  IApiKeyValidator,
  IMistralConfigValidator
} from './mistral';
import { 
  CheckScannerInputValidator, 
  IFileValidator, 
  IScannerOptionsValidator 
} from './scanner/check-scanner';
import { ReceiptScannerInputValidator } from './scanner/receipt-scanner';
import { 
  IDomainValidator, 
  ValidationConfig, 
  TYPES, 
  Url,
  ApiKey
} from './types';
import { 
  IScannerInputValidator, 
  ScannerOptions 
} from './scanner/types';
import { ValidationMiddleware } from './api/middleware';

/**
 * File validator implementation
 */
const fileValidator: IFileValidator = z.union([
  z.instanceof(File),
  z.instanceof(Buffer),
  z.instanceof(ArrayBuffer),
  z.string().min(1, "File path cannot be empty")
]);

/**
 * Scanner options validator implementation
 */
const scannerOptionsValidator: IScannerOptionsValidator = z.object({
  enhanceImage: z.boolean().optional(),
  detectOrientation: z.boolean().optional(),
  timeout: z.number().positive().optional(),
  forceOCR: z.boolean().optional()
});

/**
 * Register all validators in the DI container
 */
export function registerValidators(container: Container): void {
  // Register configuration
  container.bind<ValidationConfig>(TYPES.ValidationConfig).toConstantValue({
    apiKeyMinLength: 20,
    forbiddenPatterns: ["placeholder", "api-key", "test-key"]
  });
  
  // Register file and options validators
  container.bind<IFileValidator>(TYPES.FileValidator).toConstantValue(fileValidator);
  container.bind<IScannerOptionsValidator>(TYPES.ScannerOptionsValidator).toConstantValue(scannerOptionsValidator);
  
  // Register base validators
  container.bind<IDomainValidator<string>>(TYPES.StringValidator)
    .to(StringValidator)
    .inSingletonScope();
    
  container.bind<IDomainValidator<number>>(TYPES.NumberValidator)
    .to(NumberValidator)
    .inSingletonScope();
    
  // Register domain-specific validators
  container.bind<IApiKeyValidator>(TYPES.ApiKeyValidator)
    .to(ApiKeyValidator)
    .inSingletonScope();
    
  container.bind<IDomainValidator<Url>>(TYPES.UrlValidator)
    .to(UrlValidator)
    .inSingletonScope();
    
  container.bind<IMistralConfigValidator>(TYPES.MistralConfigValidator)
    .to(MistralConfigValidator)
    .inSingletonScope();
    
  container.bind<IScannerInputValidator>(TYPES.ScannerInputValidator)
    .to(CheckScannerInputValidator)
    .whenParentNamed('check');
    
  container.bind<IScannerInputValidator>(TYPES.ScannerInputValidator)
    .to(ReceiptScannerInputValidator)
    .whenParentNamed('receipt');
    
  // Register validation middleware
  container.bind(TYPES.ValidationMiddleware)
    .to(ValidationMiddleware)
    .inSingletonScope();
}

// Export all validators
export * from './base';
export * from './mistral';
export { CheckScannerInputValidator } from './scanner/check-scanner';
export { ReceiptScannerInputValidator } from './scanner/receipt-scanner';
export * from './scanner/types';
export * from './types';
export * from './api/index';

// Factory functions for creating validators
export function createApiKeyValidator(config: ValidationConfig): IApiKeyValidator {
  return new ApiKeyValidator(config);
}

/**
 * Validate an API key
 * 
 * @param key - The API key to validate
 * @returns The validated API key (branded type)
 * @throws ValidationError<string> if validation fails
 */
export function validateApiKey(key: string, config?: ValidationConfig): ApiKey {
  const validator = new ApiKeyValidator(config || {
    apiKeyMinLength: 20,
    forbiddenPatterns: ["placeholder", "api-key", "test-key"]
  });
  return validator.assertValid(key);
}

/**
 * Validate a URL
 * 
 * @param url - The URL to validate
 * @returns The validated URL (branded type)
 * @throws ValidationError<string> if validation fails
 */
export function validateUrl(url: string): Url {
  const validator = new UrlValidator();
  return validator.assertValid(url);
}