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
  OCRProvider: Symbol.for('OCRProvider'),
  JsonExtractorProvider: Symbol.for('JsonExtractorProvider'),
  ReceiptExtractor: Symbol.for('ReceiptExtractor'),
  ReceiptScanner: Symbol.for('ReceiptScanner')
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

## Adding a New Dependency

To add a new dependency:

1. Add a new Symbol identifier in the TYPES object
2. Create a binding in the registration method
3. Inject the dependency where needed using `context.container.get()`

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

## Future Improvements

- Add decorator-based injection for class properties
- Support for different container scopes (request-scoped, etc.)
- Advanced container configuration for different environments