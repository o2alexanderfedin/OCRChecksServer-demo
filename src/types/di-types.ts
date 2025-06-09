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
  // AntiHallucinationDetector: Symbol.for('AntiHallucinationDetector'), // REMOVED - replaced with SOLID-compliant factory
  JsonExtractionConfidenceCalculator: Symbol.for('JsonExtractionConfidenceCalculator'),
  CloudflareAI: Symbol.for('CloudflareAI'),
  JsonExtractorFactory: Symbol.for('JsonExtractorFactory'),
  CheckHallucinationDetector: Symbol.for('CheckHallucinationDetector'),
  ReceiptHallucinationDetector: Symbol.for('ReceiptHallucinationDetector'),
  HallucinationDetectorFactory: Symbol.for('HallucinationDetectorFactory')
};