# OCR Checks Server Tests

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

For detailed documentation on the testing architecture, see [/docs/testing.md](/docs/testing.md).