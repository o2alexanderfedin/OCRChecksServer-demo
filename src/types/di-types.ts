/**
 * Dependency injection type symbols
 */

/**
 * Symbols for dependency identifiers - used for type-safe dependency injection
 */
export const TYPES = {
  IoE: Symbol.for('IoE'),
  MistralApiKey: Symbol.for('MistralApiKey'),
  MistralClient: Symbol.for('MistralClient'),
  OCRProvider: Symbol.for('OCRProvider'),
  JsonExtractorProvider: Symbol.for('JsonExtractorProvider'),
  ReceiptExtractor: Symbol.for('ReceiptExtractor'),
  CheckExtractor: Symbol.for('CheckExtractor'),
  ReceiptScanner: Symbol.for('ReceiptScanner'),
  CheckScanner: Symbol.for('CheckScanner'),
  ValidationMiddleware: Symbol.for('ValidationMiddleware'),
  AntiHallucinationDetector: Symbol.for('AntiHallucinationDetector')
};