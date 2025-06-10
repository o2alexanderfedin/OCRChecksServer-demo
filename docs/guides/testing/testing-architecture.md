# Testing Architecture

> Copyright © 2025 [Nolock.social](https://nolock.social). All rights reserved.  
> Authored by: [O2.services](https://o2.services)  
> Contact: [sales@o2.services](mailto:sales@o2.services)  
> Licensed under the [GNU Affero General Public License v3.0 or later](https://www.gnu.org/licenses/agpl-3.0.html) (AGPL-3.0-or-later)

## Overview

The OCR Checks Server uses a comprehensive testing approach with different types of tests organized by their purpose and scope. This document describes the testing structure, test types, and how to run different test suites.

## Test Directory Structure

```
tests/
├── fixtures/            # Test data and reference files
│   ├── expected/        # Expected test output for validation
│   └── images/          # Sample check images for testing
├── functional/          # Functional programming style tests
│   └── ocr/             # OCR-related functional tests
├── integration/         # End-to-end integration tests
│   └── README.md        # Integration tests documentation
├── semi/                # Semi-integration tests with real dependencies
│   └── ocr/             # OCR-related semi-integration tests
└── unit/                # Unit tests for isolated components
    └── ocr/             # OCR-related unit tests
```

## Test Types

### Unit Tests

Located in `tests/unit/` directory, unit tests focus on testing individual components in isolation.

**Characteristics:**
- Test files follow `.test.ts` naming convention
- External dependencies are mocked
- Tests focus on component inputs/outputs and behavior
- Isolation ensures tests are fast and deterministic

**Example:**
```typescript
// tests/unit/ocr/mistral.test.ts
import { DocumentType, type IoE } from '../../../src/ocr/types'
import { MistralOCRProvider } from '../../../src/ocr/mistral'

describe('MistralOCR', () => {
  // Mock dependencies
  const mockIo: IoE = { /* mocked implementation */ };

  it('should process a single image document', async () => {
    // Test with mocked dependencies
    const result = await provider.processDocuments([{
      content: new Uint8Array([1, 2, 3]).buffer,
      type: DocumentType.Image
    }]);
    
    // Assertions
    expect(result[0]).toBe('ok');
  });
});
```

### Functional Tests

Located in `tests/functional/` directory, functional tests focus on testing components using a functional programming approach.

**Characteristics:**
- Test files follow `.f.test.ts` naming convention
- Emphasize functional composition and pure functions
- Use similar mocking strategy to unit tests
- Focus on behaviors and transformations

**Example:**
```typescript
// tests/functional/ocr/mistral.f.test.ts
import type { IoE } from '../../../src/ocr/types'
import { MistralOCRProvider } from '../../../src/ocr/mistral'

describe('MistralOCR (Functional Style)', () => {
  // Similar test structure but with functional style assertions
});
```

### Semi-Integration Tests

Located in `tests/semi/` directory, semi-integration tests use real dependencies but not a full web server.

**Characteristics:**
- Test files follow `.test.js` naming convention
- Use real external services (like actual Mistral API)
- Process real image files from `tests/fixtures/images`
- Save results to `tests/fixtures/expected` for validation
- Longer timeouts to accommodate API calls

**Example:**
```javascript
// tests/semi/ocr/mistral.test.js
import { Mistral } from '@mistralai/mistralai';
import { MistralOCRProvider } from '../../../src/ocr/mistral.js';

describe('MistralOCR Semi-Integration', () => {
  // Create real dependencies
  const realMistralClient = new Mistral({ apiKey: MISTRAL_API_KEY });
  
  it('should process a check image with real Mistral client', async () => {
    // Test with real images and real API
    const imagePath = path.join(checksDir, imageFiles[0]);
    const imageBuffer = fs.readFileSync(imagePath);
    
    const result = await provider.processDocuments([{
      content: imageBuffer.buffer,
      type: DocumentType.Image,
      name: path.basename(imagePath)
    }]);
    
    // Save results for inspection and future tests
    fs.writeFileSync(
      path.join(resultsDir, 'mistral-ocr-results.json'), 
      JSON.stringify(result[1], null, 2)
    );
    
    // Assertions
    expect(result[0]).toBe('ok');
  });
});
```

### Integration Tests

Located in `tests/integration/` directory, integration tests verify the complete application with a running web server.

**Characteristics:**
- Test complete HTTP endpoints and responses
- Run against a live server instance
- Test full processing pipeline
- Validate real-world scenarios and error cases

## Test Fixtures

### Image Fixtures

Test images are stored in `tests/fixtures/images/` and include:
- Sample check images in JPG format
- Variations of check images for different test cases

### Expected Results

Reference data for test validation is stored in `tests/fixtures/expected/`:
- `mistral-ocr-results.json`: Contains expected OCR output for comparison

## Test Runners

Test runners are located in the `scripts/` directory:

- `scripts/run-unit-tests.js`: Runs unit tests only
- `scripts/run-functional-tests.js`: Runs functional tests only
- `scripts/run-semi-tests.js`: Runs semi-integration tests only
- `scripts/run-tests.js`: Universal runner for all test types
- `scripts/start-server.js`: Utility script to start the server for integration tests

### Server Process Management

As of version 1.12.2, the test server management system has been improved:

- The server process is tracked via a PID file (`scripts/start-server.js`)
- The server is automatically shut down after integration tests complete (`scripts/run-tests.js`)
- Proper signal handlers ensure clean termination even when tests are interrupted
- Multi-layered approach to server shutdown prevents "zombie" processes
- Detailed logging provides visibility into server lifecycle

For more details on server management, see [Test Server Management](./test-server-management.md).

## Running Tests

The following npm scripts are available:

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit        # Unit tests only
npm run test:functional  # Functional tests only 
npm run test:semi        # Semi-integration tests only
npm run test:integration # Integration tests only
```

## Mocking Strategy

The project uses a custom mocking approach for unit and functional tests:

```typescript
// Custom mock function implementation
interface MockFunction {
    (): any;
    calls: {
        count: number;
        reset: () => void;
    };
    mockReturnValue: (val: any) => MockFunction;
    mockImplementation: (fn: Function) => MockFunction;
    mockReturnedValue: any;
    mockImplementationValue: Function | null;
}

function createSpy(name: string): MockFunction {
    // Implementation details
}
```

This allows for consistent mocking across test files without external dependencies.

## Testing Best Practices

1. **Test Organization**:
   - Keep test files organized by type (unit, functional, semi, integration)
   - Follow established naming conventions
   - Group tests logically within each file

2. **Test Independence**:
   - Each test should be independent and not rely on others
   - Clean up any side effects after tests
   - Use beforeEach/afterEach for test setup and teardown

3. **Assertions**:
   - Use clear, specific assertions
   - Test both success and error cases
   - Check edge cases and boundary conditions

4. **Mocking**:
   - Mock external dependencies consistently
   - Only use real dependencies in semi/integration tests
   - Reset mocks between tests

5. **Test Coverage**:
   - Aim for high test coverage of critical code paths
   - Balance between different test types
   - Prioritize testing business logic and error handling

## Deployment Verification Testing

### Version Testing and URL Discovery

The system includes comprehensive deployment verification through dynamic URL discovery and version testing.

#### Dynamic URL Discovery
Automatically discovers actual Cloudflare Worker URLs from configuration:

```bash
# Discover all environment URLs
npx tsx scripts/get-cloudflare-urls.ts

# Test version across all discovered environments
npm run test:version:dynamic
```

**Discovery Methods:**
- **Wrangler CLI**: Uses `wrangler` commands to query deployment information
- **Cloudflare API**: Direct API queries using `CLOUDFLARE_API_TOKEN`
- **Pattern Testing**: Tests known URL patterns for accessibility

#### Version Verification Tests
Ensures deployed applications match source code version:

**Static URL Testing:**
```bash
npm run test:version:production    # Test with predefined URLs
npm run test:version:staging
npm run test:version:dev
```

**Dynamic URL Testing:**
```bash
npm run test:version:dynamic              # Auto-discover and test all environments
npm run test:version:dynamic:production   # Test specific environment with auto-discovery
```

**Features:**
- **Source Comparison**: Compares `/health` endpoint version with `package.json`
- **Multi-Environment**: Tests local, dev, staging, and production simultaneously
- **Health Verification**: Checks service health status and API key configuration
- **Error Analysis**: Provides detailed troubleshooting guidance for failures

#### Integration with Smoke Tests
Version testing integrates with existing smoke test infrastructure:

```bash
# Enhanced smoke tests with dynamic version checking
bash scripts/smoke-test.sh              # Uses package.json for version comparison

# Comprehensive verification workflow
npm run test:version:dynamic && npm run test:smoke
```

**Enhanced Features:**
- **Dynamic Version Reading**: Shell scripts now read expected version from `package.json`
- **Deployment Analysis**: Provides actionable recommendations for version mismatches
- **API Key Status**: Monitors Mistral API key configuration across environments

### URL Discovery Tools

#### Available Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `get-cloudflare-urls.ts` | Comprehensive URL discovery | `npx tsx scripts/get-cloudflare-urls.ts` |
| `simple-url-discovery.ts` | Lightweight pattern testing | `npx tsx scripts/simple-url-discovery.ts` |
| `dynamic-version-smoke-test.ts` | Auto-discovering version test | `npm run test:version:dynamic` |
| `version-smoke-test.ts` | Static URL version test | `npm run test:version` |

#### Output Formats

**Human-Readable:**
```
Environment URLs:
  production  : https://ocr-checks-worker.af-4a0.workers.dev
  dev         : https://ocr-checks-worker-dev.af-4a0.workers.dev
  staging     : https://ocr-checks-worker-staging.af-4a0.workers.dev
  local       : http://localhost:8787
```

**JSON:**
```json
{
  "production": "https://ocr-checks-worker.af-4a0.workers.dev",
  "dev": "https://ocr-checks-worker-dev.af-4a0.workers.dev",
  "staging": "https://ocr-checks-worker-staging.af-4a0.workers.dev",
  "local": "http://localhost:8787"
}
```

**Environment Variables:**
```bash
export OCR_API_URL_PRODUCTION="https://ocr-checks-worker.af-4a0.workers.dev"
export OCR_API_URL_DEV="https://ocr-checks-worker-dev.af-4a0.workers.dev"
export OCR_API_URL_STAGING="https://ocr-checks-worker-staging.af-4a0.workers.dev"
export OCR_API_URL_LOCAL="http://localhost:8787"
```

## Continuous Integration

The project is ready for CI integration, with scripts structured to support automated testing in a CI pipeline.

### CI/CD Integration Examples

**GitHub Actions Integration:**
```yaml
- name: Verify Deployment Versions
  run: npm run test:version:dynamic
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}

- name: Run Smoke Tests
  run: npm run test:smoke
```

**Pre-Deployment Verification:**
```bash
# Verify current state before deployment
npm run test:version:dynamic

# Deploy to environment
npm run deploy:production

# Verify deployment success
npm run test:version:dynamic:production
```