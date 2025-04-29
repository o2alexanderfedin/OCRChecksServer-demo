# OCR Checks Worker v1.8.0

## New Features

- **Receipt Scanner**: Enhanced integration tests for the receipt scanning workflow
- **Test Infrastructure**: Added dedicated test script for receipt scanner tests

## Improvements

- Moved tests from src directory to proper tests/unit directory
- Improved project structure by separating source and test code
- Enhanced error handling for API rate limits
- Improved type definitions for better TypeScript type checking

## Bug Fixes

- Fixed DI container TypeScript issues with component instantiation
- Fixed nested OCR result array access in unified processor
- Fixed test interfaces to match implementation
- Fixed module resolution issues in integration tests

# OCR Checks Worker v1.3.0

## New Features

- **JSON Extraction**: Added JSON extraction capability from OCR text
- **Confidence Scoring**: Implemented confidence scoring for extraction reliability
- **Schema Validation**: Added schema validation for extracted JSON data
- **Integration Tests**: Comprehensive integration test suite for end-to-end validation

## Improvements

- Enhanced JSON extraction design with detailed implementation
- Improved prompt formatting with code blocks for schemas
- Robust integration test runner with proper cleanup
- Updated test runners to support dry run mode

## Bug Fixes

- Removed unnecessary parameters from Mistral API calls
- Fixed JSON schema formatting in prompts for better extraction
- Fixed server process cleanup in integration tests