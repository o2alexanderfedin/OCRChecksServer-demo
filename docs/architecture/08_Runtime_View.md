# Software Architecture Document – Runtime View

[Home](index.md) | [Up](index.md) | [Previous](07_Build_Deployment.md) | [Next](09_Data_Architecture.md)

## System Initialization

The OCR Checks Server follows a specific initialization sequence when starting up in the Cloudflare Workers environment. This sequence ensures that all dependencies are properly configured and services are available before handling requests.

### Initialization Sequence

```mermaid
sequenceDiagram
    participant CF as Cloudflare Worker Runtime
    participant App as OCR Checks App
    participant Hono as Hono Framework
    participant DI as Dependency Injection Container
    participant Services as Service Components
    
    CF->>App: Initialize Worker
    App->>Hono: Create Hono App Instance
    App->>Hono: Register Routes
    App->>Hono: Configure Middleware
    
    Note over App,DI: Service initialization happens per-request
    
    CF->>App: Incoming Request
    App->>DI: Initialize DI Container
    DI->>Services: Register Dependencies
    DI->>Services: Configure Services
    App->>Hono: Handle Request
    Hono->>App: Response
    App->>CF: Return Response
```

### Key Initialization Steps

1. **Worker Initialization**
   - Cloudflare Workers environment instantiates the worker
   - Module exports are evaluated
   - `app` instance is created

2. **Route Registration**
   - API routes are registered with the Hono framework
   - Middleware is configured for all routes
   - Static file handlers are set up

3. **Per-Request Initialization**
   - Dependency injection container is created or retrieved
   - Services are registered and configured
   - API key validation occurs

4. **Request Processing**
   - Incoming request is passed to the appropriate route handler
   - Services are used to process the request
   - Response is generated and returned

### Service Initialization

The following services are initialized during the startup process:

| Service | Initialization | Dependencies |
|---------|----------------|--------------|
| Hono App | At worker start | None |
| Dependency Injection Container | Per request | IoE (I/O services) |
| Mistral Client | On first use via DI | API Key, Configuration |
| OCR Provider | On first use via DI | Mistral Client |
| JSON Extractor | On first use via DI | Mistral Client |
| Scanner Services | On first use via DI | OCR Provider, JSON Extractor |
| Validators | On first use via DI | None |

## Key Processes

The OCR Checks Server handles several key runtime processes. The following sections describe the most important process flows in the system.

### Document Processing Process

The document processing workflow is the core functionality of the system:

```mermaid
sequenceDiagram
    participant Client
    participant API as API Layer
    participant Scanner as Scanner Service
    participant OCR as OCR Provider
    participant Extractor as JSON Extractor
    participant Mistral as Mistral AI
    
    Client->>API: POST /check or /receipt
    API->>API: Validate Request
    API->>Scanner: Process Document
    
    Scanner->>OCR: Process Document for OCR
    OCR->>Mistral: Send Image for OCR
    Mistral-->>OCR: Return OCR Text
    OCR-->>Scanner: Return OCR Result
    
    Scanner->>Extractor: Extract Structured Data
    Extractor->>Mistral: Send OCR Text for Extraction
    Mistral-->>Extractor: Return Structured Data
    Extractor-->>Scanner: Return Extraction Result
    
    Scanner->>Scanner: Calculate Confidence Scores
    Scanner-->>API: Return Processing Result with OCR Text
    API-->>Client: Return JSON Response with Data and Markdown
```

1. **Request Reception**
   - Client sends document image to `/check` or `/receipt` endpoint
   - API layer validates content type and request format

2. **Document Scanning**
   - Scanner service orchestrates the processing workflow
   - Document is sent to OCR provider for text extraction
   - OCR text is sent to extractor for structured data extraction

3. **Result Processing**
   - Confidence scores are calculated for extraction accuracy
   - Results are formatted according to API schema, including raw OCR text
   - Response is returned to client with both structured data and markdown

### Universal Document Processing

The system also supports a universal document processing endpoint:

```mermaid
sequenceDiagram
    participant Client
    participant API as API Layer
    participant Factory as Scanner Factory
    participant Scanner as Scanner Service
    participant Processing as Document Processing
    
    Client->>API: POST /process?type=check|receipt
    API->>API: Validate Request & Type
    API->>Factory: Create Scanner by Type
    Factory->>Factory: Resolve Dependencies
    Factory-->>API: Return Appropriate Scanner
    
    API->>Scanner: Process Document
    Scanner->>Processing: Process via OCR & Extraction
    Processing-->>Scanner: Return Processing Result
    Scanner-->>API: Return Scanning Result
    
    API->>API: Format Response with Type and Markdown
    API-->>Client: Return JSON Response with Data and OCR Text
```

The universal endpoint provides flexibility by:
- Supporting multiple document types via a single endpoint

## AI Model Architecture Decision

### Mistral AI to Cloudflare Llama Migration

**Issue**: The system originally used Mistral AI for both OCR processing and JSON extraction. However, **Mistral AI service demonstrated significant instability issues** including:
- Frequent timeout errors during JSON extraction
- Connection failures and unreliable API responses
- Inconsistent response times affecting user experience
- Service interruptions impacting production reliability

**Solution**: Migration to hybrid AI architecture:
- **OCR Processing**: Continue using Mistral AI (`mistral-ocr-latest`) - stable performance
- **JSON Extraction**: Migrate to Cloudflare Workers AI (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`) - edge-native reliability

**Benefits of Migration**:
- **Improved Reliability**: Edge-native processing eliminates external service dependencies for JSON extraction
- **Consistent Performance**: Cloudflare's infrastructure provides stable, predictable response times  
- **Reduced Complexity**: Eliminates complex retry logic needed for unstable Mistral AI JSON extraction
- **Cost Efficiency**: Cloudflare Workers AI competitive pricing model
- **Maintained Quality**: Preserves anti-hallucination detection and validation logic

**Current Architecture** (v1.63.0+):
- **Remote Environments** (dev, staging, production): Cloudflare Llama 3.3 for JSON extraction
- **Local Development**: Mistral AI for JSON extraction (for development consistency)
- **All Environments**: Mistral AI for OCR processing (stable service area)
- Using the factory pattern to create appropriate scanners
- Maintaining consistent response format with document type information

### Health Check Process

The health check endpoint verifies system health:

```mermaid
sequenceDiagram
    participant Client
    participant API as API Layer
    participant DI as DI Container
    participant Factory as Scanner Factory
    
    Client->>API: GET /health
    API->>DI: Create Container
    DI->>DI: Validate API Key
    
    API->>Factory: Validate Scanner Creation
    Factory->>Factory: Create Check Scanner
    Factory->>Factory: Create Receipt Scanner
    Factory-->>API: Scanners Created Successfully
    
    API->>API: Create Health Response
    API-->>Client: Return Health Status
```

The health check process:
- Validates the DI container configuration
- Verifies scanner factory functionality
- Confirms API key availability and format
- Returns version, status, and timestamp information

## Request Processing Workflows

### Check Processing Workflow

```mermaid
graph TD
    A[Receive Check Image] --> B{Validate Image}
    B -->|Valid| C[Perform OCR]
    B -->|Invalid| ErrorResponse1[Return Error]
    
    C --> D{OCR Successful?}
    D -->|Yes| E[Extract Check Data]
    D -->|No| ErrorResponse2[Return OCR Error]
    
    E --> F{Extraction Successful?}
    F -->|Complete| G[Format Full Response]
    F -->|Partial| H[Format Partial Response]
    F -->|Failed| ErrorResponse3[Return Extraction Error]
    
    G --> Response1[Return Complete Response]
    H --> Response2[Return Partial Response with Warnings]
```

The check processing workflow:
1. Validates the uploaded check image
2. Performs OCR on the check image
3. Extracts structured data from OCR text
4. Formats response based on extraction success

### Receipt Processing Workflow

```mermaid
graph TD
    A[Receive Receipt Image] --> B{Validate Image}
    B -->|Valid| C[Perform OCR]
    B -->|Invalid| ErrorResponse1[Return Error]
    
    C --> D{OCR Successful?}
    D -->|Yes| E[Extract Receipt Data]
    D -->|No| ErrorResponse2[Return OCR Error]
    
    E --> F{Extraction Successful?}
    F -->|Complete| G[Format Full Response]
    F -->|Partial| H[Format Partial Response]
    F -->|Failed| ErrorResponse3[Return Extraction Error]
    
    G --> Response1[Return Complete Response]
    H --> Response2[Return Partial Response with Warnings]
```

The receipt processing workflow follows a similar pattern to check processing but uses receipt-specific extraction logic.

## Exception Handling

The OCR Checks Server implements a comprehensive exception handling strategy to ensure robust operation.

### Error Handling Approach

```mermaid
graph TD
    Error[Error Occurs] --> ErrorType{Error Type}
    
    ErrorType -->|Validation Error| ValidationHandler[Validation Error Handler]
    ErrorType -->|OCR Error| OCRHandler[OCR Error Handler]
    ErrorType -->|Extraction Error| ExtractionHandler[Extraction Error Handler]
    ErrorType -->|External API Error| APIHandler[External API Error Handler]
    ErrorType -->|Unexpected Error| UnexpectedHandler[Unexpected Error Handler]
    
    ValidationHandler --> ValidationResponse[400 Bad Request Response]
    OCRHandler --> OCRResponse[500 Internal Server Error]
    ExtractionHandler --> ExtractionResponse[422 Unprocessable Entity]
    APIHandler --> APIErrorHandler{Retry Possible?}
    UnexpectedHandler --> UnexpectedResponse[500 Internal Server Error + Logging]
    
    APIErrorHandler -->|Yes| RetryOperation[Retry Operation]
    APIErrorHandler -->|No| APIResponse[503 Service Unavailable]
    
    RetryOperation --> RetrySuccess{Retry Successful?}
    RetrySuccess -->|Yes| SuccessResponse[Success Response]
    RetrySuccess -->|No| MaxRetriesResponse[503 Service Unavailable]
```

### Error Types and Handling

| Error Type | Handling Approach | Response Code | Example |
|------------|-------------------|---------------|---------|
| Validation Error | Return descriptive error message | 400 Bad Request | Invalid image format |
| OCR Error | Return error with details | 500 Internal Server Error | OCR processing failed |
| Extraction Error | Return partial data or error | 422 Unprocessable Entity | Unable to extract data |
| External API Error | Retry with exponential backoff | 503 Service Unavailable | Mistral API unavailable |
| Unexpected Error | Log error and return generic message | 500 Internal Server Error | Unhandled exception |

### Result Type Pattern

The system uses the Result type pattern for error handling:

```typescript
// Result type definition (pseudocode)
type Result<T, E> = ['ok', T] | ['error', E];

// Usage example
async function processDocument(document: Document): Promise<Result<ScanResult, string>> {
  try {
    // Processing logic
    return ['ok', result];
  } catch (error) {
    return ['error', 'Failed to process document: ' + error.message];
  }
}

// Error handling example
const result = await processDocument(document);
if (result[0] === 'error') {
  // Handle error case
  return new Response(JSON.stringify({ error: result[1] }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' }
  });
}
// Handle success case
```

### Retry Strategy

The system implements a retry strategy for transient errors:

```mermaid
graph TD
    Request[API Request] --> Response{Success?}
    Response -->|Yes| SuccessHandler[Process Response]
    Response -->|No| ErrorType{Error Type}
    
    ErrorType -->|Transient| RetryCheck{Retries Exhausted?}
    ErrorType -->|Permanent| ErrorHandler[Handle Error]
    
    RetryCheck -->|No| Backoff[Calculate Backoff]
    RetryCheck -->|Yes| MaxRetryHandler[Handle Max Retries]
    
    Backoff --> Wait[Wait]
    Wait --> RetryRequest[Retry Request]
    RetryRequest --> Response
```

Retry configuration for Mistral AI API requests:

```typescript
// Retry configuration
const retryConfig = {
  strategy: "backoff",
  backoff: {
    initialInterval: 1000,    // Initial retry delay in ms
    maxInterval: 10000,       // Maximum retry delay
    exponent: 1.8,            // Backoff exponent
    maxElapsedTime: 25000     // Maximum total retry time
  },
  retryConnectionErrors: true
};
```

## Memory Management

The OCR Checks Server operates in a constrained memory environment due to Cloudflare Workers limits.

### Memory Constraints

```mermaid
graph LR
    subgraph "Memory Usage"
        Code[Application Code]
        Dependencies[Dependencies]
        RequestData[Request Data]
        OCRData[OCR Processing Data]
        ResponseData[Response Data]
    end
    
    TotalMemory[Total Memory Limit] --- Code
    TotalMemory --- Dependencies
    TotalMemory --- RequestData
    TotalMemory --- OCRData
    TotalMemory --- ResponseData
```

The system optimizes memory usage through:
- Efficient data structures
- Stream processing where possible
- Minimal dependency usage
- Careful handling of large documents
- Cleanup of temporary data

### Image Processing Memory Management

Image processing is particularly memory-intensive:

```mermaid
graph TD
    ReceiveImage[Receive Image] --> ValidateSize{Size < Limit?}
    ValidateSize -->|Yes| ProcessImage[Process Image]
    ValidateSize -->|No| RejectImage[Reject Oversized Image]
    
    ProcessImage --> ConvertIfNeeded{Conversion Needed?}
    ConvertIfNeeded -->|Yes| ConvertImage[Convert Image Format]
    ConvertIfNeeded -->|No| PrepareForOCR[Prepare for OCR]
    
    ConvertImage --> ReleaseOriginal[Release Original Memory]
    ReleaseOriginal --> PrepareForOCR
    
    PrepareForOCR --> SendToOCR[Send to OCR]
    SendToOCR --> ReleaseProcessedImage[Release Processed Image]
```

The system manages memory during image processing by:
- Validating image sizes before processing
- Converting images to efficient formats when needed
- Releasing memory as soon as possible
- Processing in chunks when dealing with large documents

## Concurrency Model

Cloudflare Workers use an event-driven, single-threaded execution model with async/await patterns.

### Request Handling Concurrency

```mermaid
sequenceDiagram
    participant CF as Cloudflare Runtime
    participant W1 as Worker Instance 1
    participant W2 as Worker Instance 2
    participant W3 as Worker Instance 3
    
    CF->>W1: Request 1
    Note over W1: Processing Request 1
    
    CF->>W2: Request 2
    Note over W2: Processing Request 2
    
    CF->>W3: Request 3
    Note over W3: Processing Request 3
    
    W1-->>CF: Response 1
    W2-->>CF: Response 2
    W3-->>CF: Response 3
```

Key aspects of the concurrency model:
- Each request is handled by a separate worker instance
- No shared memory between requests
- Stateless design eliminates concurrency issues
- Async/await pattern for I/O operations

### Async Operation Handling

The system uses promises and async/await extensively:

```typescript
// Example async handler (pseudocode)
app.post('/check', async (c) => {
  try {
    // Async operations
    const imageBuffer = await c.req.arrayBuffer();
    const scanner = ScannerFactory.createMistralCheckScanner(workerIoE, c.env.MISTRAL_API_KEY);
    const document = { content: imageBuffer, type: DocumentType.Image };
    const result = await scanner.processDocument(document);
    
    // Handle result
    if (result[0] === 'error') {
      return new Response(JSON.stringify({ error: result[1] }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Return successful response
    return new Response(JSON.stringify({
      data: result[1].json,
      markdown: result[1].rawText,
      confidence: {
        ocr: result[1].ocrConfidence,
        extraction: result[1].extractionConfidence,
        overall: result[1].overallConfidence
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    // Handle unexpected errors
    console.error('Error processing check:', error);
    return new Response(JSON.stringify({ message: 'Internal server error', error }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
```

## System State Management

The OCR Checks Server is designed as a stateless system, with no persistent state between requests.

### Stateless Design

```mermaid
graph LR
    subgraph "Request 1"
        R1Init[Initialize] --> R1Process[Process]
        R1Process --> R1Response[Respond]
        R1Response --> R1Cleanup[Cleanup]
    end
    
    subgraph "Request 2"
        R2Init[Initialize] --> R2Process[Process]
        R2Process --> R2Response[Respond]
        R2Response --> R2Cleanup[Cleanup]
    end
    
    subgraph "Request 3"
        R3Init[Initialize] --> R3Process[Process]
        R3Process --> R3Response[Respond]
        R3Response --> R3Cleanup[Cleanup]
    end
    
    R1Cleanup -.-> R2Init
    R2Cleanup -.-> R3Init
```

The stateless design:
- Eliminates shared state issues
- Enables horizontal scaling
- Simplifies the programming model
- Increases system resilience

### Per-Request State

Each request maintains its own isolated state:

1. **Request Context**
   - Request parameters and headers
   - Uploaded document data
   - Environment configuration

2. **Processing Context**
   - OCR results
   - Raw OCR text (markdown)
   - Extracted structured data
   - Confidence scores

3. **Response Context**
   - Formatted structured JSON data
   - Raw OCR text (markdown field)
   - Error information if applicable
   - Response headers

## Startup and Shutdown

Cloudflare Workers have specific startup and shutdown behaviors:

### Worker Lifecycle

```mermaid
graph TD
    Deploy[Worker Deployment] --> Initialize[Initialize Worker Script]
    Initialize --> Idle[Worker Idle]
    Idle --> RequestReceived[Request Received]
    RequestReceived --> ProcessRequest[Process Request]
    ProcessRequest --> ReturnResponse[Return Response]
    ReturnResponse --> Idle
    
    Idle --> NoRequests[No Requests for Period]
    NoRequests --> Hibernation[Worker Hibernation]
    Hibernation --> RequestReceived
```

#### Startup Process

When a Worker script is first deployed or activated:
1. Worker script is loaded into the V8 isolate
2. Module-level code is executed
3. Worker enters idle state waiting for requests

#### Per-Request Activation

When a request is received:
1. Request handler is invoked
2. Dependency container is initialized
3. Services are configured
4. Request is processed
5. Response is returned

#### Hibernation

After a period of inactivity:
1. Worker instance may be hibernated
2. Resources are freed
3. Next request will require reactivation

There is no explicit shutdown process in Cloudflare Workers; the platform manages worker lifecycle automatically.

---

[Home](index.md) | [Up](index.md) | [Previous](07_Build_Deployment.md) | [Next](09_Data_Architecture.md)