# OCR Checks Worker v1.30.0 - Guardian [Maintenance]

## Quality Improvements

- **Enhanced Type Safety**: Added proper type assertions throughout test suite
- **Testing Reliability**: Fixed TypeScript errors in test files
- **Code Quality**: Improved IoE interface implementations to ensure type completeness
- **Error Handling**: Strengthened type checking for error handling in tests
- **Maintainability**: Added generated test results file to .gitignore

# OCR Checks Worker v1.29.0 - Sentinel [Maintenance]

## Process Improvements

- **GitFlow Validation**: Implemented workflow validation to prevent direct changes to develop/main branches
- **Type Safety Enhancements**: Added proper type assertions for API responses in integration tests
- **Post-mortem Analysis**: Added structured process for documenting lessons from development challenges
- **Release Naming Convention**: Introduced symbolic codenames and type classifications for releases

## Bug Fixes

- Fixed "unknown error" during test execution caused by TypeScript type safety issues
- Updated version expectations in health check tests to match current API version
- Fixed JSON syntax error in package.json
- Improved server process cleanup in test runner

# OCR Checks Worker v1.12.2

## Documentation Improvements

- **Comprehensive Documentation**: Added detailed documentation for all system components
- **Test Server Management Guide**: Created dedicated documentation for server process management
- **Copyright Information**: Added O2.services copyright notices across all documentation
- **Enhanced API Documentation**: Updated with detailed examples and response formats
- **Fixed Documentation References**: Corrected broken links and standardized documentation format

# OCR Checks Worker v1.12.1

## Testing Infrastructure Improvements

- **Enhanced Test Reliability**: Fixed server process management to ensure clean shutdown after tests
- **Improved Resource Management**: Eliminated potential "zombie" server processes
- **Better Development Experience**: Added robust server process tracking and cleanup
- **Enhanced Error Handling**: Improved logging and error reporting for server processes

# OCR Checks Worker v1.12.0

## API Structure Improvements

- **Streamlined Endpoints**: Removed legacy root endpoint (`/`) in favor of dedicated, purpose-specific endpoints
- **Improved Architecture**: Each endpoint now has a clear, single responsibility
- **Better Developer Experience**: Clear endpoint structure makes API easier to understand and use

## API Change Notice

The root endpoint (`/`) has been removed. Please use these dedicated endpoints instead:
- `/process` - Universal document processing (with type=check|receipt)
- `/check` - Check-specific processing
- `/receipt` - Receipt-specific processing
- `/health` - Server status information

## Integration Test Improvements

- Updated integration tests to focus on testing specific endpoint functionality
- Enhanced test reliability through focused test cases

# OCR Checks Worker v1.11.0

## New Features

- **Enhanced Test Coverage**: Added unit tests for previously untested IO module
- **Health Endpoint Testing**: Added integration tests for health endpoint
- **Error Handling Tests**: Added integration tests for comprehensive API error handling
- **Knowledge Management System**: Created a structured system for documenting problem-solution patterns
- **Test Framework Documentation**: Added detailed documentation about test framework compatibility

## Improvements

- Improved integration test reliability through better error handling
- Enhanced test runner script to better handle specific test cases and test filtering
- Implemented more robust error reporting for test failures
- Updated health endpoint version to 1.11.0
- Created a structured approach to documenting common development challenges

## Bug Fixes

- Fixed issues with integration tests timing out or hanging
- Improved error handling in test runner to catch undefined errors
- Added proper null checks and optional chaining for improved robustness

# OCR Checks Worker v1.10.0

## BREAKING CHANGES

- Removed legacy adapters: `src/json/receipt-extractor.ts` and `src/json/check-extractor.ts`
- Direct imports of these legacy adapters will now fail and must be updated

## Improvements

- Simplified codebase by removing all legacy adapter code
- Streamlined imports and API - use extractors directly from src/json/extractors
- Removed potentially confusing duplicate implementations

## Migration Guide

- Update imports to use the new paths:
  ```typescript
  // Old import (no longer works)
  import { ReceiptExtractor } from '../src/json/receipt-extractor';
  
  // New import
  import { ReceiptExtractor } from '../src/json/extractors/receipt-extractor';
  ```
- Make sure your code works with readonly Result tuples (instead of mutable ones)
- If you need both extractors, import them directly from their respective files

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