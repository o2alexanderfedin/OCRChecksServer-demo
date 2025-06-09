# Dependency Injection System

This document explains the dependency injection (DI) system used in the OCR Checks Worker project.

## Overview

The project uses InversifyJS, a powerful dependency injection container for TypeScript applications. This helps with:

- Decoupling component creation from usage
- Making testing easier through component replacement
- Improving code maintainability and flexibility

## Key Components

### DIContainer

Located in `src/di/container.ts`, the DIContainer class is responsible for:

1. Registering all dependencies
2. Managing their lifecycle (singleton vs transient)
3. Resolving dependencies when requested

### TYPES

Symbol identifiers are used to uniquely identify dependencies:

```typescript
export const TYPES = {
  IoE: Symbol.for('IoE'),
  MistralApiKey: Symbol.for('MistralApiKey'),
  MistralClient: Symbol.for('MistralClient'),
  CloudflareAi: Symbol.for('CloudflareAi'),
  OCRProvider: Symbol.for('OCRProvider'),
  JsonExtractor: Symbol.for('JsonExtractor'),
  JsonExtractorProvider: Symbol.for('JsonExtractorProvider'),
  ReceiptExtractor: Symbol.for('ReceiptExtractor'),
  CheckExtractor: Symbol.for('CheckExtractor'),
  ReceiptScanner: Symbol.for('ReceiptScanner'),
  CheckScanner: Symbol.for('CheckScanner'),
  HallucinationDetectorFactory: Symbol.for('HallucinationDetectorFactory'),
  CheckHallucinationDetector: Symbol.for('CheckHallucinationDetector'),
  ReceiptHallucinationDetector: Symbol.for('ReceiptHallucinationDetector'),
  ConfidenceCalculator: Symbol.for('ConfidenceCalculator')
};
```

## Registering Dependencies

The `registerMistralDependencies` method in DIContainer registers all dependencies for the Mistral implementation:

```typescript
registerMistralDependencies(io: IoE, apiKey: string): DIContainer {
  // Register basic dependencies
  this.container.bind(TYPES.IoE).toConstantValue(io);
  this.container.bind(TYPES.MistralApiKey).toConstantValue(apiKey);
  
  // Register Mistral client
  this.container.bind(TYPES.MistralClient).toDynamicValue((_context) => {
    return new Mistral({ apiKey });
  }).inSingletonScope();
  
  // Register OCR provider (and other components)...
  
  return this;
}
```

## Using the Container

The DI container is used in the `ProcessorFactory` class to create configured instances:

```typescript
static createMistralProcessor(io: IoE, apiKey: string): ReceiptScanner {
  // Create DI container with all dependencies registered
  const container = new DIContainer().registerMistralDependencies(io, apiKey);
  
  // Get and return a fully configured ReceiptScanner
  return container.get<ReceiptScanner>(TYPES.ReceiptScanner);
}
```

## SOLID Hallucination Detection Integration

The DI system now supports SOLID-compliant hallucination detection:

```typescript
// Register hallucination detection components
container.bind<CheckHallucinationDetector>(TYPES.CheckHallucinationDetector)
  .to(CheckHallucinationDetector)
  .inSingletonScope();

container.bind<ReceiptHallucinationDetector>(TYPES.ReceiptHallucinationDetector)
  .to(ReceiptHallucinationDetector)
  .inSingletonScope();

container.bind<HallucinationDetectorFactory>(TYPES.HallucinationDetectorFactory)
  .to(HallucinationDetectorFactory)
  .inSingletonScope();
```

### Factory Pattern Implementation

The factory automatically selects the appropriate detector based on document type:

```typescript
@injectable()
export class HallucinationDetectorFactory {
  constructor(
    @inject(TYPES.CheckHallucinationDetector) 
    private checkDetector: CheckHallucinationDetector,
    @inject(TYPES.ReceiptHallucinationDetector) 
    private receiptDetector: ReceiptHallucinationDetector
  ) {}

  detectHallucinations(data: any): void {
    const detector = this.getDetectorForData(data);
    if (detector) {
      detector.detect(data);
    }
  }
}
```

## Adding a New Dependency

To add a new dependency:

1. Add a new Symbol identifier in the TYPES object
2. Create a binding in the registration method
3. Inject the dependency where needed using `@inject()` decorator or `context.container.get()`

## Testing with the DI Container

For testing, you can:

1. Create a mock implementation of the dependency
2. Register the mock in the container instead of the real implementation
3. Use the container to get instances with the mocked dependency injected

Example:

```typescript
// Create a mock OCR provider
const mockOcrProvider = { /* mock implementation */ };

// Create a test container
const container = new DIContainer();

// Register dependencies with mocks
container.bind(TYPES.OCRProvider).toConstantValue(mockOcrProvider);
// Register other dependencies...

// Get an instance with the mock injected
const scanner = container.get<ReceiptScanner>(TYPES.ReceiptScanner);
// Test the scanner with the mock provider
```

## SOLID Principles in DI Design

The dependency injection system exemplifies SOLID principles:

- **Single Responsibility**: Each service has one focused purpose
- **Open/Closed**: New detectors can be added without modifying existing code
- **Interface Segregation**: Focused interfaces like `HallucinationDetector<T>`
- **Dependency Inversion**: High-level modules depend on abstractions

## Multiple Extractor Support

The system now supports multiple JSON extractors through configuration:

```typescript
// Cloudflare configuration
container.bind<JsonExtractor>(TYPES.JsonExtractor)
  .to(CloudflareLlama33JsonExtractor)
  .whenTargetNamed('cloudflare');

// Mistral configuration  
container.bind<JsonExtractor>(TYPES.JsonExtractor)
  .to(MistralJsonExtractorProvider)
  .whenTargetNamed('mistral');
```

## Future Improvements

- Add decorator-based injection for class properties
- Support for different container scopes (request-scoped, etc.)
- Advanced container configuration for different environments
- Runtime detector registration for extensibility