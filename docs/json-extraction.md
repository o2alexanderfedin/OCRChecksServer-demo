# JSON Extraction Design

## Overview

The JSON Extraction feature is designed to process markdown text output from the OCR system and extract structured JSON data using Mistral AI's capabilities. This document outlines the design and implementation details of this feature.

## Components

### 1. Core Types

```typescript
// Result of JSON extraction
type JsonExtractionResult = {
    /** Extracted JSON data */
    json: any
}

// Request for JSON extraction
type JsonExtractionRequest = {
    /** Markdown text to process */
    markdown: string
    /** Optional context for extraction */
    context?: {
        [key: string]: string
    }
}

// JSON extractor interface
interface JsonExtractor {
    extract(request: JsonExtractionRequest): Promise<Result<JsonExtractionResult, Error>>
}
```

### 2. Implementation

```typescript
class MistralJsonExtractorProvider implements JsonExtractor {
    private readonly io: IoE
    private readonly apiKey: string

    constructor(io: IoE, apiKey: string) {
        this.io = io
        this.apiKey = apiKey
    }

    async extract(request: JsonExtractionRequest): Promise<Result<JsonExtractionResult, Error>> {
        // Implementation using Mistral API
        // Convert markdown to structured JSON
    }
}
```

## UML Diagrams

### Class Diagram
```mermaid
classDiagram
    class JsonExtractor {
        <<interface>>
        +extract(JsonExtractionRequest) Promise~Result~
    }

    class MistralJsonExtractorProvider {
        -IoE io
        -string apiKey
        +extract(JsonExtractionRequest) Promise~Result~
    }

    class JsonExtractionResult {
        +json: any
    }

    class JsonExtractionRequest {
        +markdown: string
        +context?: { [key: string]: string }
    }

    class IoE {
        <<interface>>
        +fetch(url, options) Promise~Response~
        +atob(data) string
        +asyncTryCatch(fn) Promise~Result~
    }

    JsonExtractor <|.. MistralJsonExtractorProvider : implements
    MistralJsonExtractorProvider --> IoE : uses
    JsonExtractor --> JsonExtractionResult : returns
    JsonExtractor --> JsonExtractionRequest : processes
```

### Sequence Diagram
```mermaid
sequenceDiagram
    participant Client
    participant Worker
    participant MistralJsonExtractorProvider

    Client->>Worker: Send Markdown Text
    Worker->>MistralJsonExtractorProvider: extract({ markdown, context })
    MistralJsonExtractorProvider->>MistralJsonExtractorProvider: Process with Mistral
    MistralJsonExtractorProvider->>MistralJsonExtractorProvider: Convert to JSON
    MistralJsonExtractorProvider-->>Worker: JsonExtractionResult
    Worker-->>Client: Response
```

## Processing Flow

1. **Text Processing**
   - Receive markdown text from OCR
   - Prepare context for extraction
   - Format prompt for Mistral

2. **Mistral Processing**
   - Send text to Mistral API
   - Process response
   - Validate JSON structure

3. **Result Generation**
   - Structure extracted data as JSON
   - Handle any conversion errors
   - Return formatted result

## Error Handling

- API communication errors
- Invalid JSON response
- Context validation failures
- Rate limiting issues

## Testing Strategy

### Unit Tests
- API communication
- JSON validation
- Error handling
- Context processing

### Integration Tests
- End-to-end extraction flow
- Integration with OCR output
- Performance benchmarks

## Future Enhancements

1. **Extraction Improvements**
   - Enhanced prompt engineering
   - Better context handling
   - Schema validation

2. **Performance**
   - Response caching
   - Batch processing
   - Rate limit optimization

3. **Monitoring**
   - Extraction success rates
   - Response times
   - Error tracking 