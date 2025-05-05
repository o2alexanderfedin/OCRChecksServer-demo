# OCR Checks Server Tests

> Copyright © 2025 [Nolock.social](https://nolock.social). All rights reserved.  
> Authored by: [O2.services](https://o2.services)  
> Contact: [sales@o2.services](mailto:sales@o2.services)  
> Licensed under the [GNU Affero General Public License v3.0 or later](https://www.gnu.org/licenses/agpl-3.0.html) (AGPL-3.0-or-later)

This directory contains the test suites for the OCR Checks Server project.

## Test Directory Structure

```
tests/
├── fixtures/            # Test data and reference files
│   ├── expected/        # Expected test output for validation
│   └── images/          # Sample check images for testing
├── functional/          # Functional programming style tests
│   └── ocr/             # OCR-related functional tests
├── integration/         # End-to-end integration tests
├── semi/                # Semi-integration tests with real dependencies
│   └── ocr/             # OCR-related semi-integration tests
└── unit/                # Unit tests for isolated components
    └── ocr/             # OCR-related unit tests
```

## Running Tests

Run all tests:
```bash
npm test
```

Run specific test types:
```bash
npm run test:unit        # Unit tests only
npm run test:functional  # Functional tests only 
npm run test:semi        # Semi-integration tests only
npm run test:integration # Integration tests only
```

## Test Types

- **Unit Tests** (`tests/unit/`): Test individual components in isolation with mocked dependencies
- **Functional Tests** (`tests/functional/`): Test functional style components with a focus on composition
- **Semi-Integration Tests** (`tests/semi/`): Test with real dependencies but without a web server
- **Integration Tests** (`tests/integration/`): Test complete application with a running web server

## Test Fixtures

- **Images** (`tests/fixtures/images/`): Sample check images for testing
- **Expected Results** (`tests/fixtures/expected/`): Reference data for test validation

## More Information

For detailed documentation on the testing architecture, see [/docs/testing-architecture.md](/docs/testing-architecture.md).

## Server Process Management

As of version 1.12.2, the test server management system has been improved:

- The server process is tracked via a PID file (`.server-pid`)
- Automatic cleanup of server processes after tests complete
- Proper signal handling ensures clean termination
- No more "zombie" server processes after tests

For more details, see [/docs/test-server-management.md](/docs/test-server-management.md).

## Rate Limiting

As of version 1.43.2, the testing system includes rate limiting to respect Mistral API's limits:

- Mistral API has a rate limit of 5 requests per second
- Helper function `withRateLimit()` enforces this limit by adding delays between requests
- Integration tests use rate limiting by default via the `respectRateLimit` option
- This prevents test failures due to API rate limiting when running test suites

To use rate limiting in your own tests:

```typescript
import { retry } from '../../helpers/retry';

// Using rate limiting with retry mechanism
const result = await retry(
  async () => await someFunction(),
  {
    retries: 5, // Retry up to 5 times (6 attempts total)
    initialDelay: 1000, // Start with 1 second delay
    respectRateLimit: true, // This enables rate limiting
    // ... other options
  }
);

// Or directly with the withRateLimit helper
import { withRateLimit } from '../../helpers/retry';

const result = await withRateLimit(async () => {
  return await someApiCall();
});
```