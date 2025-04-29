# OCR Checks Server Architecture

## Overview

The OCR Checks Server is a Cloudflare Worker application that processes images of paper checks to extract structured data. The system is designed with a functional programming approach, leveraging the `functionalscript` library for IO operations and error handling.

## System Components

### 1. Core Components

#### Worker Entry Point (`src/index.ts`)
- Main Cloudflare Worker handler
- Handles HTTP requests
- Manages processing pipeline
- Implements CORS and request validation

#### Processing Pipeline
- Handles document processing
- Manages API communication
- Uses functional programming patterns with `IoE` interface

### 2. Type System

#### IO Interface (`IoE`)
- Extends the base `Io` type from `functionalscript`
- Adds enhanced `fetch` capabilities for API communication
- Provides `atob` for base64 encoding
- Maintains compatibility with functional programming patterns

#### Data Types
- `CheckData`: Extracted check information
- `Result<T, E>`: Error handling from `functionalscript`

### 3. Testing Infrastructure

#### Unit Tests
- Tests are written using Jasmine testing framework
- Located in files with `.test.ts` or `.test.f.ts` extensions within the `src` directory
- Tests core functionality with isolated components
- Follows a BDD (Behavior-Driven Development) pattern with `describe`, `it`, and expectation syntax

#### Mocking Strategy
- Uses Jasmine spies for mocking external dependencies
- Implements a comprehensive mock of the `IoE` interface for all functional tests
- Mocks include network calls, file operations, and environment variables
- External clients (like Mistral AI) are mocked with spies to simulate responses

#### Running Tests
- `npm run test:unit`: Runs all unit tests via custom Jasmine configuration
- Tests are executed using a custom runner (`run-tests.js`) that handles TypeScript files
- Test configuration is defined in both `jasmine.json` and `run-tests.js`
- Tests both functional-style components (`.test.f.ts`) and object-oriented components (`.test.ts`)

#### Integration Tests
- Tests the complete worker functionality
- Processes actual check images
- Validates end-to-end workflow
- Can be run with `npm test` command

## UML Diagrams

### Sequence Diagram
```mermaid
sequenceDiagram
    participant Client
    participant Worker
    participant ProcessingProvider

    Client->>+Worker: Upload Document
    Worker->>+ProcessingProvider: Process Document
    ProcessingProvider->>ProcessingProvider: Process Content
    ProcessingProvider->>ProcessingProvider: Extract Data
    ProcessingProvider-->>-Worker: Processed Result
    Worker-->>-Client: Response
```

## Data Flow

1. **Document Upload**
   - Client sends document via HTTP POST
   - Worker validates content type and size

2. **Document Processing**
   - Document converted to appropriate format
   - Processed by selected provider
   - Data extracted and structured

3. **Response Handling**
   - Data formatted and validated
   - Error handling and validation
   - JSON response returned to client

## Error Handling

- Uses `Result` type from `functionalscript`
- Implements `asyncTryCatch` for async operations
- Validates API responses
- Handles processing errors

## Dependencies

- `functionalscript`: Core functional programming utilities
- `hono`: Web framework for Cloudflare Workers
- `sharp`: Image processing (if needed for preprocessing)

## Development Workflow

1. **Local Development**
   - `npm run dev`: Start local worker
   - `npm run test:unit`: Run unit tests with Jasmine
   - `npm test`: Run integration tests against local server

2. **Deployment**
   - Uses Wrangler for deployment
   - Environment variables managed via `wrangler.toml`
   - CI/CD integration possible via GitHub Actions

## Security Considerations

- API key management via environment variables
- Input validation and sanitization
- CORS configuration
- Rate limiting (if implemented)

## Future Considerations

- Processing optimization
- Caching strategies
- Rate limiting implementation
- Additional providers support
- Batch processing capabilities 