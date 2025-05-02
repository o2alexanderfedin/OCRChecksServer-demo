# Swift Proxy Integration Tests

> Copyright © 2025 [Nolock.social](https://nolock.social). All rights reserved.  
> Authored by: [O2.services](https://o2.services)  
> Contact: [sales@o2.services](mailto:sales@o2.services)  
> Licensed under the [GNU Affero General Public License v3.0 or later](https://www.gnu.org/licenses/agpl-3.0.html) (AGPL-3.0-or-later)

This directory contains tests for the Swift proxy client for the OCR Checks Server.

## Test Types

1. **Unit Tests** (`OCRClientAsyncTests.swift`): Tests the Swift proxy client with mocked responses. These tests can run independently without a server.

2. **Integration Tests** (`OCRClientIntegrationTests.swift`): End-to-end tests that communicate with a running server instance. These tests verify that the Swift proxy can correctly interact with the actual server.

## Running Unit Tests

Unit tests can be run standalone without additional setup:

```bash
cd swift-proxy
swift test
```

## Running Integration Tests

Integration tests require a running server instance:

1. Start the server in one terminal:
   ```bash
   npm run dev
   ```

2. Run the Swift tests in another terminal:
   ```bash
   cd swift-proxy
   swift test
   ```

### Integration Test Configuration

By default, integration tests will try to connect to a local server running at `http://localhost:8787`. If the server is not available, the tests will be automatically skipped rather than failing.

You can also explicitly skip integration tests by setting an environment variable:

```bash
OCR_SKIP_INTEGRATION_TESTS=1 swift test
```

## Test Images

Integration tests use check/receipt images from the `tests/fixtures/images` directory. The tests look for `IMG_2388.jpg` in several common locations relative to the test runner.

## Troubleshooting

If integration tests are failing:

1. Ensure the server is running at http://localhost:8787
2. Verify the test image exists at `tests/fixtures/images/IMG_2388.jpg`
3. Check server logs for any errors
4. Try running with increased timeout if network latency is an issue

## Adding New Tests

When adding new tests:

1. **Unit Tests**: Add to `OCRClientAsyncTests.swift` with appropriate mocks
2. **Integration Tests**: Add to `OCRClientIntegrationTests.swift` with appropriate timeout handling

Both test types are important for ensuring the Swift proxy works correctly:
- Unit tests provide fast feedback and test edge cases
- Integration tests verify end-to-end functionality with the actual server