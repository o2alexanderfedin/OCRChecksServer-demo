# Software Architecture Document – Integration and External Interfaces

[Home](index.md) | [Up](index.md) | [Previous](10_Security_Architecture.md) | [Next](12_Operational_Concerns.md)

## API Specifications

The OCR Checks Server provides a RESTful API for client applications to interact with the system. The API is designed to be simple, consistent, and well-documented.

### API Overview

```mermaid
graph LR
    subgraph "Client Applications"
        MobileApp[Mobile Apps]
        WebApp[Web Applications]
        ThirdParty[Third-Party Systems]
    end
    
    subgraph "OCR Checks Server API"
        CheckAPI[/check Endpoint]
        ReceiptAPI[/receipt Endpoint]
        ProcessAPI[/process Endpoint]
        HealthAPI[/health Endpoint]
        DocsAPI[/api-docs Endpoint]
    end
    
    MobileApp -->|POST| CheckAPI
    MobileApp -->|POST| ReceiptAPI
    MobileApp -->|POST| ProcessAPI
    MobileApp -->|GET| HealthAPI
    
    WebApp -->|POST| CheckAPI
    WebApp -->|POST| ReceiptAPI
    WebApp -->|POST| ProcessAPI
    WebApp -->|GET| HealthAPI
    WebApp -->|GET| DocsAPI
    
    ThirdParty -->|POST| CheckAPI
    ThirdParty -->|POST| ReceiptAPI
    ThirdParty -->|POST| ProcessAPI
    ThirdParty -->|GET| HealthAPI
```

### API Endpoints

| Endpoint | Method | Purpose | Request Format | Response Format |
|----------|--------|---------|----------------|-----------------|
| `/check` | POST | Process check images | Image (JPEG, PNG, HEIC) | JSON (check data) |
| `/receipt` | POST | Process receipt images | Image (JPEG, PNG, HEIC) | JSON (receipt data) |
| `/process` | POST | General document processing | Image with `type` parameter | JSON (document data) |
| `/health` | GET | System health status | None | JSON (health status) |
| `/api-docs` | GET | API documentation (Swagger UI) | None | HTML (Swagger UI) |
| `/openapi.json` | GET | OpenAPI specification | None | JSON (OpenAPI spec) |

### OpenAPI Specification

The API is fully documented using OpenAPI Specification (formerly Swagger):

```yaml
openapi: 3.0.0
info:
  title: OCR Checks Server API
  description: API for OCR processing of checks and receipts
  version: 1.57.0
servers:
  - url: https://ocr-checks-worker.af-4a0.workers.dev
    description: Production
  - url: https://ocr-checks-worker-staging.af-4a0.workers.dev
    description: Staging
  - url: https://ocr-checks-worker-dev.af-4a0.workers.dev
    description: Development
paths:
  /check:
    post:
      summary: Process a check image
      requestBody:
        content:
          image/*:
            schema:
              type: string
              format: binary
      responses:
        200:
          description: Successful check processing
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CheckResponse'
  /receipt:
    post:
      summary: Process a receipt image
      requestBody:
        content:
          image/*:
            schema:
              type: string
              format: binary
      responses:
        200:
          description: Successful receipt processing
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ReceiptResponse'
  /process:
    post:
      summary: Process a document
      parameters:
        - name: type
          in: query
          required: true
          schema:
            type: string
            enum: [check, receipt]
      requestBody:
        content:
          image/*:
            schema:
              type: string
              format: binary
      responses:
        200:
          description: Successful document processing
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProcessResponse'
  /health:
    get:
      summary: Check API health
      responses:
        200:
          description: API is healthy
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HealthResponse'
components:
  schemas:
    CheckResponse:
      type: object
      properties:
        data:
          $ref: '#/components/schemas/Check'
        confidence:
          $ref: '#/components/schemas/Confidence'
    # Additional schema definitions...
```

### Swagger UI Integration

The system provides a Swagger UI interface for interactive API documentation:

```mermaid
graph LR
    Client[Client Browser] -->|GET| APIDocsEndpoint[/api-docs Endpoint]
    APIDocsEndpoint --> SwaggerUI[Swagger UI Interface]
    SwaggerUI -->|GET| OpenAPISpec[/openapi.json]
    OpenAPISpec --> SwaggerUI
    SwaggerUI -->|Interaction| APIEndpoints[API Endpoints]
```

Key features of the Swagger UI integration:
- Interactive API documentation
- Request builder for testing
- Response visualization
- Environment selection (dev, staging, production)
- Schema inspection

## External System Interfaces

The OCR Checks Server interacts with several external systems to provide its functionality.

### Mistral AI Integration

```mermaid
sequenceDiagram
    participant OCS as OCR Checks Server
    participant Mistral as Mistral AI Service
    
    OCS->>Mistral: OCR Request (Image)
    Note over OCS,Mistral: Sends document image for OCR processing
    Mistral-->>OCS: OCR Response (Text)
    
    OCS->>Mistral: Extraction Request (OCR Text + Schema)
    Note over OCS,Mistral: Sends OCR text with schema for structured data extraction
    Mistral-->>OCS: Extraction Response (JSON)
```

#### Mistral AI Interface Details

1. **OCR Processing Interface**
   - Endpoint: Mistral AI Vision API
   - Authentication: API Key
   - Request Format: Image binary + processing instructions
   - Response Format: JSON with OCR text
   - Error Handling: Retry with exponential backoff

2. **JSON Extraction Interface**
   - Endpoint: Mistral AI Chat API
   - Authentication: API Key
   - Request Format: OCR text + schema definition
   - Response Format: JSON with structured data
   - Error Handling: Retry with exponential backoff

#### Mistral AI Client Configuration

```typescript
// Retry configuration for Mistral API
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

// Create Mistral client with configuration
const mistralClient = new Mistral({ 
  apiKey: validApiKey,
  retryConfig: typedRetryConfig,
  timeoutMs: 15000
});
```

### Cloudflare Workers Integration

```mermaid
sequenceDiagram
    participant User as User/Client
    participant CloudflareEdge as Cloudflare Edge Network
    participant Worker as OCR Checks Worker
    participant CloudflareAPI as Cloudflare API
    
    User->>CloudflareEdge: HTTP Request
    CloudflareEdge->>Worker: Route to Worker
    Worker->>Worker: Process Request
    Worker-->>CloudflareEdge: HTTP Response
    CloudflareEdge-->>User: Deliver Response
    
    Note over Worker,CloudflareAPI: Deployment & Management
    Worker->>CloudflareAPI: Worker Lifecycle Events
    CloudflareAPI-->>Worker: Configuration & Control
```

#### Cloudflare Workers Interface Details

1. **Runtime Interface**
   - Environment: V8 Isolate
   - Integration: ES Module exports
   - Request Handling: Event-driven model
   - Resource Limits: CPU and time constraints

2. **Deployment Interface**
   - Tool: Wrangler CLI
   - Configuration: wrangler.toml
   - Authentication: Cloudflare API token
   - Environments: dev, staging, production

3. **Secrets Management Interface**
   - API: Cloudflare Worker Secrets
   - Access: Environment-scoped
   - Storage: Secure and encrypted
   - Usage: Runtime access via environment

## Integration Patterns

The OCR Checks Server implements several integration patterns to facilitate communication with external systems and clients.

### REST API Pattern

```mermaid
graph LR
    Client[Client] -->|HTTP Request| API[REST API]
    API -->|Resource Operation| Server[Server Logic]
    Server -->|Resource Representation| API
    API -->|HTTP Response| Client
```

The RESTful API pattern includes:
- Resource-based URL structure
- Standard HTTP methods (POST, GET)
- JSON response format
- Stateless request handling
- Standard HTTP status codes

### Adapter Pattern

```mermaid
graph LR
    Server[Server Logic] -->|Interface| Adapter[External Service Adapter]
    Adapter -->|Service-Specific Protocol| ExternalService[External Service]
    ExternalService -->|Service-Specific Response| Adapter
    Adapter -->|Standardized Response| Server
```

The adapter pattern is used for:
- Mistral AI integration (OCR Provider, JSON Extractor)
- Environment-specific configuration
- API format conversions

### Facade Pattern

```mermaid
graph LR
    Client[Client] -->|Simple Interface| Facade[Scanner Facade]
    Facade -->|Complex Implementation| SubsystemA[OCR Processing]
    Facade -->|Complex Implementation| SubsystemB[Data Extraction]
    Facade -->|Complex Implementation| SubsystemC[Validation]
    SubsystemA -->|Results| Facade
    SubsystemB -->|Results| Facade
    SubsystemC -->|Results| Facade
    Facade -->|Simplified Response| Client
```

The facade pattern is implemented through:
- Scanner Factory providing a unified interface
- Check and Receipt scanners encapsulating complex processing
- Simplified API endpoints hiding implementation details

### Factory Pattern

```mermaid
graph TD
    Client[API Endpoint] -->|Type Parameter| Factory[Scanner Factory]
    Factory -->|Creates| CheckScanner[Check Scanner]
    Factory -->|Creates| ReceiptScanner[Receipt Scanner]
    CheckScanner -->|Implements| ScannerInterface[Scanner Interface]
    ReceiptScanner -->|Implements| ScannerInterface
```

The factory pattern is used to:
- Create appropriate scanner instances based on document type
- Abstract away complex object creation
- Manage dependencies for scanner instances
- Enable extensibility for new document types

## Client Libraries

The OCR Checks Server provides client libraries to simplify integration for specific platforms.

### Swift Client Library

```mermaid
classDiagram
    class OCRClient {
        +processCheck(image: Data) async throws -> CheckResult
        +processReceipt(image: Data) async throws -> ReceiptResult
        +processDocument(image: Data, type: DocumentType) async throws -> DocumentResult
        +checkHealth() async throws -> HealthResult
        -makeRequest(endpoint: String, image: Data) async throws -> Response
    }
    
    class CheckResult {
        +data: Check
        +confidence: ConfidenceScores
    }
    
    class ReceiptResult {
        +data: Receipt
        +confidence: ConfidenceScores
    }
    
    class DocumentResult {
        +data: Any
        +documentType: String
        +confidence: ConfidenceScores
    }
    
    class HealthResult {
        +status: String
        +timestamp: Date
        +version: String
    }
    
    OCRClient --> CheckResult
    OCRClient --> ReceiptResult
    OCRClient --> DocumentResult
    OCRClient --> HealthResult
```

#### Swift Client Features

1. **Modern Swift Design**
   - Swift concurrency (async/await)
   - Type-safe models
   - Error handling with Swift's throwing functions
   - Swift Package Manager support

2. **API Integration**
   - Complete API coverage
   - Environment configuration (dev, staging, production)
   - Automatic HEIC conversion
   - Response parsing and type conversion

3. **Usage Example**

```swift
// Swift client usage example
import NolockOCR

// Initialize the client
let client = OCRClient(environment: .production)

// Process a check image
do {
    let image = try Data(contentsOf: checkImageURL)
    let result = try await client.processCheck(image: image)
    
    // Access the extracted check data
    let check = result.data
    print("Check #\(check.checkNumber)")
    print("Amount: $\(check.amount)")
    print("Date: \(check.date)")
    print("Payee: \(check.payee)")
    
    // Access confidence scores
    print("OCR Confidence: \(result.confidence.ocr)")
    print("Extraction Confidence: \(result.confidence.extraction)")
    print("Overall Confidence: \(result.confidence.overall)")
} catch {
    print("Error processing check: \(error)")
}
```

### NolockCapture Package

The NolockCapture package works alongside the Swift client to provide advanced document capture capabilities:

```mermaid
graph LR
    subgraph "iOS Application"
        CaptureView[Document CaptureView]
        DepthProcessing[Depth Processing]
        OCRClient[OCR Client]
    end
    
    subgraph "OCR Server"
        API[OCR API]
    end
    
    CaptureView -->|Capture Document| DepthProcessing
    DepthProcessing -->|Flattened Image| OCRClient
    OCRClient -->|API Request| API
    API -->|JSON Response| OCRClient
```

#### NolockCapture Features

1. **Advanced Capture**
   - Depth-aware document capture
   - LiDAR or dual camera support
   - 3D point cloud processing
   - Document plane detection

2. **Image Enhancement**
   - Perspective correction
   - Document flattening
   - Lighting normalization
   - OCR-optimized preprocessing

3. **Integration with OCR Client**
   - Seamless workflow from capture to OCR
   - Type-safe data models
   - Consistent error handling
   - Progressive enhancement design

## Integration Examples

### Mobile Integration Example

```mermaid
sequenceDiagram
    participant User
    participant MobileApp
    participant CaptureModule
    participant OCRClient
    participant OCRServer
    
    User->>MobileApp: Take picture of check
    MobileApp->>CaptureModule: Initialize capture
    CaptureModule->>User: Display capture interface
    User->>CaptureModule: Capture check image
    CaptureModule->>CaptureModule: Process image (enhance, flatten)
    CaptureModule->>OCRClient: Process enhanced image
    OCRClient->>OCRServer: Send image for processing
    OCRServer->>OCRServer: Process check
    OCRServer-->>OCRClient: Return structured data
    OCRClient-->>MobileApp: Return check details
    MobileApp-->>User: Display check information
```

### Web Integration Example

```mermaid
sequenceDiagram
    participant User
    participant WebApp
    participant UploadComponent
    participant APIClient
    participant OCRServer
    
    User->>WebApp: Navigate to upload page
    WebApp->>User: Display upload interface
    User->>UploadComponent: Select receipt image
    UploadComponent->>UploadComponent: Preview and validate image
    User->>UploadComponent: Confirm upload
    UploadComponent->>APIClient: Send image to API
    APIClient->>OCRServer: POST /receipt with image
    OCRServer->>OCRServer: Process receipt
    OCRServer-->>APIClient: Return structured data
    APIClient-->>WebApp: Return receipt details
    WebApp-->>User: Display receipt information
```

### Third-Party Integration Example

```mermaid
sequenceDiagram
    participant ThirdPartySystem
    participant IntegrationLayer
    participant OCRServer
    participant DataStorage
    
    ThirdPartySystem->>IntegrationLayer: Send document for processing
    IntegrationLayer->>OCRServer: POST /process with image
    OCRServer->>OCRServer: Process document
    OCRServer-->>IntegrationLayer: Return structured data
    IntegrationLayer->>IntegrationLayer: Transform data format
    IntegrationLayer->>DataStorage: Store processed data
    IntegrationLayer-->>ThirdPartySystem: Return success status
```

## API Evolution and Versioning

The OCR Checks Server implements an API versioning strategy to enable evolution while maintaining backward compatibility.

### Versioning Strategy

```mermaid
graph LR
    V1API[v1 API] --> CurrentAPI[Current API Implementation]
    V2API[v2 API] --> CurrentAPI
    
    subgraph "Future Extensions"
        V3API[v3 API]
    end
    
    Client1[Legacy Client] -->|Uses| V1API
    Client2[Current Client] -->|Uses| V2API
    Client3[Future Client] -->|Will Use| V3API
```

The versioning approach includes:
1. **Semantic Versioning**
   - Major version for breaking changes
   - Minor version for backward-compatible features
   - Patch version for backward-compatible bug fixes

2. **Response Compatibility**
   - Maintain backward compatibility when possible
   - Add new fields without removing existing ones
   - Provide deprecated field warnings

3. **Documentation Updates**
   - OpenAPI specification evolution
   - Swagger UI documentation
   - Changelog maintenance

### API Lifecycle Management

```mermaid
graph TD
    Introduction[API Introduction] --> Stable[Stable API]
    Stable --> Deprecated[Deprecated API]
    Deprecated --> Retired[Retired API]
    
    subgraph "Introduction Phase"
        FeatureBranch[Feature Branch]
        BetaEndpoint[Beta Endpoint]
        EarlyAdopters[Early Adopter Feedback]
    end
    
    subgraph "Stable Phase"
        ProductionUse[Production Use]
        MinorUpdates[Backward-Compatible Updates]
        Documentation[Full Documentation]
    end
    
    subgraph "Deprecated Phase"
        WarningHeaders[Warning Headers]
        MigrationGuides[Migration Guides]
        TransitionPeriod[Transition Period]
    end
```

The API lifecycle includes:
1. **Introduction Phase**
   - New features developed in feature branches
   - Beta testing in staging environment
   - Documentation draft for early adopters

2. **Stable Phase**
   - Full production support
   - Backward-compatible enhancements
   - Complete documentation

3. **Deprecation Phase**
   - Announcement of upcoming retirement
   - Migration guides provided
   - Transition period for client updates

---

[Home](index.md) | [Up](index.md) | [Previous](10_Security_Architecture.md) | [Next](12_Operational_Concerns.md)