# 🚨 DEMO REPOSITORY 🚨

> **This is a demonstration version** of the OCRChecksServer project, stripped from the original production codebase. 
> 
> **🤖 Fully AI-Generated Project**: This entire project was developed using AI assistance, including:
> - ✅ **Requirements Collection** - Product specifications and feature definitions
> - ✅ **Product Development** - End-to-end feature implementation 
> - ✅ **System Architecture** - Complete technical design and documentation
> - ✅ **Code Implementation** - All source code, utilities, and integrations
> - ✅ **Test Suite** - Comprehensive testing framework with 8 test types
> - ✅ **CI/CD Pipeline** - Automated deployment and infrastructure
> - ✅ **Documentation** - Technical specs, API docs, and guides
> 
> **⚠️ Demo Modifications**:
> - API keys have been replaced with fake demo values
> - Cloudflare Worker names include `-demo` suffix to prevent production conflicts
> - This repository is for demonstration purposes only

---

# OCR Checks Worker

A Cloudflare Worker that uses Mistral AI to perform OCR on paper checks and receipts and extract relevant information into structured data.

## Features

- **OCR Processing**: 
  - Accepts image uploads of paper checks and receipts
  - Uses Mistral AI's vision capabilities to analyze documents
  - Extracts key information from checks including:
    - Check number
    - Amount
    - Date
    - Payee
    - Payer
    - Bank name
    - Routing number
    - Account number
    - Memo (if present)
  - Extracts key information from receipts including:
    - Merchant information (name, address, etc.)
    - Transaction timestamp
    - Total amounts (subtotal, tax, tip, total)
    - Item details (descriptions, quantities, prices)
    - Payment methods
    
- **JSON Extraction**: 
  - Converts OCR results into structured JSON data
  - Validates against customizable schemas
  - Provides confidence scoring for extraction reliability
  
- **API Integration**:
  - TypeScript definitions for all API responses
  - Example client implementation for easy integration
  - Comprehensive documentation of response formats
  - Includes detailed confidence metrics for OCR and extraction steps
  
- **API Design**:
  - Dedicated endpoints for specific document types
  - Universal processing endpoint with document type specification
  - RESTful API with proper HTTP status codes and error handling
  - CORS support for browser-based applications
    
- **Architecture**:
  - Clean separation of concerns with specialized components
  - Dependency injection using InversifyJS for flexible configuration
  - Factory pattern for easy instantiation of complex object graphs
  - Functional programming patterns with Result tuples for error handling
  - Comprehensive test coverage with eight test types

## 🏗️ Technical Architecture Overview

This project demonstrates a production-grade, AI-generated system architecture built on modern engineering principles:

### 🎯 Core Design Principles
- **SOLID Principles**: Single responsibility, open/closed, Liskov substitution, interface segregation, dependency inversion
- **Clean Architecture**: Clear separation between business logic, data access, and external interfaces
- **Functional Programming**: Immutable data structures, pure functions, and Result-type error handling
- **Test-Driven Development**: Comprehensive test coverage with multiple testing strategies

### 🔧 System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Worker                        │
├─────────────────────────────────────────────────────────────┤
│  🌐 API Layer (REST Endpoints)                             │
│     ├── /check - Check processing endpoint                  │
│     ├── /receipt - Receipt processing endpoint              │
│     ├── /process - Universal document processor             │
│     └── /health - Service health monitoring                 │
├─────────────────────────────────────────────────────────────┤
│  🔍 Document Scanner Layer                                  │
│     ├── CheckScanner - Paper check analysis                │
│     ├── ReceiptScanner - Receipt processing                │
│     └── ScannerFactory - Dynamic scanner instantiation     │
├─────────────────────────────────────────────────────────────┤
│  🤖 AI Processing Pipeline                                  │
│     ├── Mistral Vision OCR - Document text extraction      │
│     ├── Cloudflare Llama 3.3 - JSON structure extraction  │
│     └── Confidence Scoring - Quality assessment            │
├─────────────────────────────────────────────────────────────┤
│  ✅ Validation & Quality Assurance                         │
│     ├── Zod Schema Validation - Type-safe data validation  │
│     ├── Hallucination Detection - AI accuracy monitoring   │
│     └── Result Pattern - Functional error handling         │
├─────────────────────────────────────────────────────────────┤
│  🔧 Infrastructure Services                                │
│     ├── Dependency Injection Container (InversifyJS)       │
│     ├── Configuration Management - Environment handling    │
│     └── Logging & Monitoring - Observability stack        │
└─────────────────────────────────────────────────────────────┘
```

### 🚀 Key Technical Features

**🔀 Dual AI Pipeline**: 
- **Mistral Vision**: High-accuracy OCR with vision-language model
- **Cloudflare Llama 3.3**: On-edge JSON extraction for structured data

**📊 Quality Assurance**:
- Multi-stage confidence scoring (OCR + Extraction + Overall)
- Hallucination detection with statistical validation
- Schema-based validation using Zod for type safety

**🧪 Testing Strategy** (8 distinct test types):
- Unit, Functional, Semi-Integration, Full Integration
- Receipt Scanner, Swift E2E, Version Testing, Smoke Tests

**⚡ Performance Optimizations**:
- Edge computing with Cloudflare Workers
- Efficient binary data handling for image processing
- Optimized AI model selection per environment

**🔒 Production Features**:
- Comprehensive error handling with Result patterns
- Environment-specific configurations (dev/staging/production)
- API key management with Cloudflare secrets
- CORS support for web applications

## Setup

1. Clone the repository with submodules:
   ```bash
   git clone --recurse-submodules https://github.com/o2alexanderfedin/OCRChecksServer-demo.git
   ```
   
   Or if you've already cloned the repository:
   ```bash
   git submodule init
   git submodule update
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure your environment:
   - **API Keys are managed via Cloudflare secrets** (not in wrangler.toml for security)
   - Set up your API keys using Wrangler secrets:
     ```bash
     # Set Mistral API key
     echo "your-mistral-api-key" | npx wrangler secret put MISTRAL_API_KEY
     
     # Set Cloudflare API token
     echo "your-cloudflare-token" | npx wrangler secret put CLOUDFLARE_API_TOKEN
     ```
   - You can obtain a Mistral API key from the [Mistral AI Console](https://console.mistral.ai/)
   - Deploy using the deployment script:
     ```bash
     npm run deploy:with-secrets
     ```
   - For detailed deployment instructions, see the [Cloudflare Deployment Guide](./docs/guides/deployment/cloudflare-deployment-guide.md)

## Prerequisites

- A Cloudflare account with Workers enabled
- A Mistral AI API key with access to the OCR model
- Node.js and npm installed for local development

## API Usage

The OCR Checks Worker provides three main processing endpoints and a health status endpoint:

### Dedicated Endpoints

#### Check Processing

Send a POST request to the dedicated check endpoint with a check image:

```bash
curl -X POST \
  -H "Content-Type: image/jpeg" \
  --data-binary @check.jpg \
  https://ocr-checks-worker-demo.workers.dev/check
```

Response:
```json
{
  "data": {
    "checkNumber": "1234",
    "date": "2023-09-15",
    "payee": "John Doe",
    "amount": "250.00",
    "payer": "ABC Company",
    "bankName": "First National Bank",
    "routingNumber": "123456789",
    "accountNumber": "987654321",
    "memo": "Invoice #1001"
  },
  "markdown": "Raw OCR text extracted from the check image...",
  "confidence": {
    "ocr": 0.92,
    "extraction": 0.85,
    "overall": 0.78
  }
}
```

#### Receipt Processing

Send a POST request to the dedicated receipt endpoint with a receipt image:

```bash
curl -X POST \
  -H "Content-Type: image/jpeg" \
  --data-binary @receipt.jpg \
  https://ocr-checks-worker-demo.workers.dev/receipt
```

Response:
```json
{
  "data": {
    "merchant": {
      "name": "Grocery Store Inc.",
      "address": "123 Main St., Anytown, CA 90210",
      "phone": "555-123-4567"
    },
    "timestamp": "2023-09-15T14:30:00Z",
    "items": [
      { "description": "Organic Apples", "quantity": "2", "unitPrice": "1.99", "totalPrice": "3.98" },
      { "description": "Whole Grain Bread", "quantity": "1", "unitPrice": "3.49", "totalPrice": "3.49" }
    ],
    "totals": {
      "subtotal": "7.47",
      "tax": "0.65",
      "tip": "0.00",
      "total": "8.12"
    },
    "payment": {
      "method": "CREDIT_CARD",
      "cardLastFour": "1234"
    }
  },
  "markdown": "Raw OCR text extracted from the receipt image...",
  "confidence": {
    "ocr": 0.89,
    "extraction": 0.82,
    "overall": 0.73
  }
}
```

### Universal Document Processing

Use the unified processing endpoint with the document type parameter:

```bash
curl -X POST \
  -H "Content-Type: image/jpeg" \
  --data-binary @check.jpg \
  https://ocr-checks-worker-demo.workers.dev/process?type=check
```

The universal endpoint provides the same functionality as the dedicated endpoints but includes an additional `documentType` field in the response:

```json
{
  "data": { /* document data */ },
  "markdown": "Raw OCR text extracted from the document...",
  "documentType": "check",
  "confidence": {
    "ocr": 0.92,
    "extraction": 0.85,
    "overall": 0.78
  }
}
```

### Health Status

Check the service status, version, and API key configuration:

```bash
curl https://ocr-checks-worker-demo.workers.dev/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-05-02T12:34:56.789Z",
  "version": "1.66.0",
  "apiKey": "configured",
  "mistralApiKey": "configured",
  "cloudflareApiToken": "configured"
}
```

> **Note**: All API responses include a `markdown` field containing the raw OCR text extracted from the document.

> **Important**: The root endpoint (`/`) has been removed in version 1.12.0. Please use the dedicated endpoints described above.

### JSON Extraction Example

```javascript
import { MistralJsonExtractorProvider } from './src/json/mistral';
import { Mistral } from '@mistralai/mistralai';
import { workerIoE } from './src/io';

// Initialize the JSON extractor
const mistralClient = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });
const jsonExtractor = new MistralJsonExtractorProvider(workerIoE, mistralClient);

// Define a schema for check data
const checkSchema = {
  name: "CheckSchema",
  schemaDefinition: {
    type: "object",
    properties: {
      checkNumber: { type: "string" },
      date: { type: "string" },
      payee: { type: "string" },
      amount: { type: "string" },
      memo: { type: "string" }
    },
    required: ["checkNumber", "date", "payee", "amount"]
  }
};

// Process OCR output with JSON extraction
async function processCheckWithOCR(imageBuffer) {
  // Step 1: Perform OCR on the check image
  const ocrResult = await ocrProvider.processDocuments([{
    content: imageBuffer,
    type: DocumentType.Image
  }]);
  
  if (ocrResult[0] === 'error') {
    return { error: 'OCR processing failed' };
  }
  
  // Step 2: Extract JSON data from OCR text
  const markdownText = ocrResult[1][0][0].text;
  const jsonResult = await jsonExtractor.extract({
    markdown: markdownText,
    schema: checkSchema
  });
  
  if (jsonResult[0] === 'error') {
    return { error: 'JSON extraction failed' };
  }
  
  // Step 3: Return structured data with confidence score
  return {
    data: jsonResult[1].json,
    confidence: jsonResult[1].confidence,
    rawText: markdownText
  };
}
```

## Development

To run locally:
```bash
npx wrangler dev
```

### Schema Documentation

The following JSON schemas are available:

- **Check Schema**: For extracting data from paper checks
- **Receipt Schema**: For extracting data from purchase receipts

For detailed schema documentation, see:
- [Check Schema Documentation](docs/api/check-schema-documentation.md)
- [Receipt Schema Documentation](docs/api/receipt-schema-documentation.md)

### Testing Infrastructure

The project uses a comprehensive testing approach with multiple distinct test types:

1. **Unit Tests**: Test individual components in isolation
   ```bash
   npm run test:unit
   ```

2. **Functional Tests**: Test functions and interactions with a functional programming approach
   ```bash
   npm run test:functional
   ```

3. **Semi-Integration Tests**: Test components against real external services
   ```bash
   npm run test:semi
   ```

4. **Integration Tests**: Full end-to-end tests of the API
   ```bash
   npm run test:integration
   ```

5. **Receipt Scanner Tests**: Specific tests for the receipt scanning functionality
   ```bash
   npm run test:receipt-scanner
   ```

6. **Swift Proxy E2E Tests**: End-to-end tests for the Swift client library that verify it can communicate with a real server instance
   ```bash
   npm run test:swift-e2e
   ```

7. **Version Testing**: Verify deployed versions match source code across all environments
   ```bash
   # Test all environments with auto-discovery
   npm run test:version:dynamic
   
   # Test specific environments
   npm run test:version:production
   npm run test:version:staging
   npm run test:version:dev
   ```

8. **Smoke Tests**: Quick health checks and basic functionality verification
   ```bash
   # Enhanced smoke tests with dynamic version checking
   npm run test:smoke
   
   # Environment-specific smoke tests
   npm run test:smoke:production
   npm run test:smoke:dev
   ```

#### Dynamic URL Discovery

The testing infrastructure includes automatic Cloudflare Worker URL discovery:

```bash
# Discover all environment URLs from Cloudflare
npx tsx scripts/get-cloudflare-urls.ts

# Test version across all discovered environments
npm run test:version:dynamic

# Output discovered URLs in different formats
npx tsx scripts/get-cloudflare-urls.ts --format json
npx tsx scripts/get-cloudflare-urls.ts --format env
```

**Features:**
- **Automatic URL Discovery**: No hardcoded URLs needed
- **Multi-Environment Testing**: Test local, dev, staging, and production simultaneously
- **Version Verification**: Ensures deployed version matches `package.json`
- **Health Monitoring**: Checks service status and API key configuration

Run all tests together:
```bash
npm test
```

> Note: The Swift proxy E2E tests require Swift to be installed on your system. These tests will automatically start a local server, run the tests, and shut down the server when complete.

### Client Libraries

#### Swift Client Library

The Swift client library is now maintained as a separate Git submodule. This provides a clean Swift package that can be used independently in iOS and macOS applications.

Key features of the Swift client:
- Modern Swift concurrency with async/await support
- Backward compatibility with completion handlers
- Type-safe models for check and receipt data
- Automatic HEIC image conversion to PNG
- Comprehensive error handling
- Environment configuration (development, staging, production)

For more information on working with the Swift submodule, see the [Swift Submodule Guide](./docs/guides/development/swift-submodule-guide.md).

#### NolockCapture Package

The NolockCapture package provides advanced document capture capabilities with depth sensing support to improve OCR accuracy by flattening curved documents.

Key features of NolockCapture:
- Depth-aware document capture using LiDAR or dual cameras
- 3D point cloud processing for document plane detection
- Automatic perspective correction for curved documents
- Surface flattening to improve OCR accuracy
- Progressive enhancement with fallbacks for non-LiDAR devices

For more information on working with the NolockCapture submodule, see the [NolockCapture Guide](./docs/tools/nolock-capture-guide.md).

### Test Server Management

Starting from version 1.12.1, the test server is properly managed with improved process tracking:

- Server processes are tracked using a PID file
- Server is automatically shut down after tests complete
- No more "zombie" server processes after tests
- Proper signal handling for clean termination
- Enhanced error reporting and logging

### Development Guidelines

For complete development guidelines, refer to:
- [Gitflow Branch Management](./.claude/rules/gitflow-branch-management.md)
- [Testing Framework Compatibility](./.claude/rules/test-framework-compatibility.md)
- [CLAUDE.md](./CLAUDE.md) for detailed development guidelines
- [Cloudflare Deployment Guide](./docs/guides/deployment/cloudflare-deployment-guide.md) for step-by-step deployment instructions
- [Git Submodule Guide](./docs/guides/development/git-submodule-guide.md) for working with submodules
- [Swift Submodule Guide](./docs/guides/development/swift-submodule-guide.md) for Swift-specific submodule instructions
- [NolockCapture Guide](./docs/tools/nolock-capture-guide.md) for details on the document capture package

## License

This project is licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).

This means:
- You can use, modify, and distribute this software
- If you modify and distribute the software, you must share your changes under the same license
- If you use this software over a network (e.g., as a web service), you must provide access to the source code to users of the network service

See the [LICENSE](./LICENSE) file for the full license text.

## Copyright

Copyright © 2025 [Nolock.social](https://nolock.social). All rights reserved.

Authored by: [O2.services](https://o2.services)  
For inquiries, contact: [sales@o2.services](mailto:sales@o2.services)