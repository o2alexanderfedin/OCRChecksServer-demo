# Changelog

All notable changes to this project will be documented in this file.

## [1.47.0] - 2025-05-06

### Changed
- Updated test image references across the entire codebase
- Renamed test images with more descriptive filenames (e.g., fredmeyer-receipt.jpg instead of telegram-cloud-photo-size-1-4915775046379745522-y.jpg)
- Improved test documentation with accurate image path references
- Updated smoke test scripts with optimized size thresholds for faster testing

### Fixed
- Consistent image path references across all test files
- Standardized test image naming conventions for better readability
- TypeScript type assertions in receipt scanner tests
- Swift proxy test references to image files

## [1.46.0] - 2025-05-06

### Added
- Scripts for consistent release branch naming with v-prefix
- Improved test image file organization
- Data-driven test approach for check and receipt processing
- Compatibility with HEIC image formats for testing

### Fixed
- Consistent release branch naming across repository
- Standardized test image references in scanner tests
- Test image filenames to better represent their content
- Missing test fixtures for comprehensive testing

## [1.45.0] - 2025-05-06

### Added
- Swift client package with MIT license for better integration
- Comprehensive examples for Swift client usage
- SwiftUI integration examples for the Swift client
- Modern Swift concurrency (async/await) support in client API
- Type-safe models for check and receipt data in Swift
- Swift Package Index metadata for better discoverability

### Improved
- Swift client documentation with detailed usage examples
- Error handling in the Swift client
- Swift client API with both modern and traditional patterns
- Swift package structure for better distribution

## [1.44.0] - 2025-05-06

### Added
- Data-driven test architecture for scanner tests using available test images
- Rate limiting for Mistral API calls to respect the 5 requests per second limit
- Verification script for test image availability
- Descriptively named test images for better test readability

### Changed
- Renamed test images with more descriptive filenames
- Updated test structure to dynamically consume all available test images
- Improved retry configuration with 5 retries and 1 second initial delay
- Enhanced testing reliability with proper rate limiting

### Improved
- Documentation for test images and rate limiting functionality
- Test resilience with better error handling for missing images
- Overall testing efficiency with optimized retry parameters

## [1.43.2] - 2025-05-05

### Improved
- Optimized Mistral client retry policy for Cloudflare Workers environment
- Reduced retry timeouts to stay within Cloudflare's 30-second execution limit
- Added detailed documentation for retry policy configuration and rationale
- Adjusted exponential backoff parameters for more efficient retry behavior
- Enhanced overall performance in Cloudflare Workers environment

## [1.43.1] - 2025-05-05

### Added
- Mistral client retry policy with configurable settings in JSON
- Configuration system for maintaining client settings separate from code

### Improved
- API reliability with automatic retry for transient failures
- Service resilience with configurable timeouts and backoff strategy

## [1.43.0] - 2025-05-05

### Added
- Comprehensive test runner script (run-all-tests.sh) for running all test types
- Test report generation tool for code coverage visualization
- New npm script `test:all` for executing the complete test suite
- GitFlow-compliant test execution with automatic branch management

### Improved
- Test execution workflow with better error handling and reporting
- Development process with integrated testing tools
- Consolidated test results with visual reporting
- Better GitFlow integration in testing workflow

## [1.42.0] - 2025-05-05

### Added
- Data-driven test architecture for Swift client integration tests
- Comprehensive test case structures for different image formats and endpoints
- Support for testing multiple image formats (JPEG, HEIC) across different endpoints
- Improved test verification with expected value validation
- Comprehensive test runner (run-all-tests.sh) and test report script
- New 'test:all' npm script for running all test types with GitFlow compliance

### Fixed
- Enhanced enum decoding robustness across all Swift models
- Added fallback handling for unknown enum values to improve client stability
- Fixed test reliability with better error handling and timeout management
- Improved cross-platform compatibility with enhanced test structure

### Improved
- Test maintainability with separation of test data from test logic
- Error isolation to prevent one test failure from stopping the entire suite
- Test readability with clear test case definitions and verification methods
- Overall Swift client robustness when handling server responses
- Better GitFlow workflow integration in testing process

## [1.41.0] - 2025-05-05

### Added
- Enhanced Swift client with automatic HEIC to JPEG conversion
- Support for platform-specific image format conversion (iOS and macOS)
- Integration test for HEIC image format processing
- Environment selection support in Swift test script (local, dev, staging, production)

### Fixed
- Content-Type header in Swift client (now uses image/jpeg instead of multipart/form-data)
- Robust enum decoding in Swift models to handle unknown values
- Image processing pipeline with proper format detection and conversion
- Swift test script reliability with better environment configuration

### Improved 
- Swift client robustness when handling various image formats
- Cross-platform support with dedicated iOS and macOS implementations
- Error handling and diagnostic information in Swift tests
- Swift integration test environment configuration

## [1.40.3] - 2025-05-04

### Added
- Created universal software problem-solving framework applicable to diverse technical challenges
- Extended integration problem-solving methodology to general software development
- Added guidance for different application areas: performance, security, UX, data modeling, algorithms, and architecture

## [1.40.2] - 2025-05-04

### Added
- Added comprehensive integration problem-solving framework to knowledge base
- Created platform-agnostic approach for addressing cross-platform integration challenges
- Documented systematic problem investigation and solution methodology

## [1.40.1] - 2025-05-04

### Removed
- Removed entire debug-test directory with all experimental test scripts and documentation
- Further cleaned up repository by eliminating all development debugging artifacts

## [1.40.0] - 2025-05-04

### Removed
- Removed all experimental endpoints (/experimental/mistral-direct, /experimental2/mistral-sdk, /experimental/binary, /experimental2/binary)
- Cleaned up codebase by focusing only on stable, production-ready endpoints

### Changed
- Simplified API surface by providing only stable endpoints
- Improved code clarity and maintainability by removing experimental code
- Enhanced code organization with cleaner endpoint structure

## [1.39.0] - 2025-05-04

### Added
- Binary image support for experimental endpoints with improved handling
- Buffer package for consistent cross-platform base64 encoding

### Fixed
- Fixed Mistral SDK property naming issues (camelCase vs snake_case)
- Fixed `/receipt` and `/check` endpoints to work with binary image uploads
- Improved base64 encoding with proper validation and error handling

### Changed
- Simplified implementation by using standardized Buffer package
- Enhanced error handling and logging for better debugging
- Removed custom _dataUrl property with standardized approach

## [1.38.1] - 2025-05-04

### Fixed
- Further improved base64 image handling for Mistral API
- Enhanced validation and cleaning of base64 data
- Fixed SDK compatibility with latest Mistral OCR API requirements
- Improved data URL format handling

## [1.38.0] - 2025-05-15

### Fixed
- Improved base64 image handling in Mistral API integration
- Added validation and cleaning of base64 encoded images
- Fixed image format issues in API requests
- Enhanced smoke tests for better reliability

### Added
- New tiny test image generation for more reliable testing
- Added `--force` flag to smoke tests to continue on errors
- Added new npm script `test:smoke:dev:force` for easier development
- Unit tests for base64 validation and cleaning

### Changed
- Improved smoke test validation with more lenient checks for tiny images
- Enhanced error handling with more detailed diagnostics
- Better compatibility with Mistral API requirements

## [1.37.0] - 2025-05-10

### Added
- Default dev environment for all deployment and monitoring tools
- Updated `tail-logs.sh` script with dev environment defaults
- Enhanced deployment documentation with default environment examples

### Changed
- Modified `deploy-with-secrets.sh` to target dev environment by default
- Updated `wrangler.toml` to use consistent workers_dev configuration
- Improved documentation with better examples using default environments
- Simplified deployment and monitoring process with sensible defaults

### Improved
- Streamlined developer workflow with default environment targeting
- Reduced configuration errors with consistent environment defaults
- Enhanced monitoring capabilities with default filtering options 
- More comprehensive documentation in cloudflare-deployment-guide.md

## [1.36.0] - 2025-05-08

### Added
- New Cloudflare Worker compatibility documentation
- Dedicated `tail-logs.sh` script for convenient Worker log monitoring
- Environment-specific deployment support in deploy scripts
- Enhanced environment detection for base64 encoding

### Fixed
- Removed hardcoded API keys from configuration files
- Fixed Mistral API compatibility issues in Cloudflare Workers
- Improved base64 encoding for larger images in Worker environment

### Improved
- Enhanced error diagnostics with environment-specific details
- Better deployment process with environment parameter support
- More efficient chunked processing for Worker environments
- Streamlined logging with targeted filtering capabilities

## [1.35.0] - 2025-05-07

### Added
- Enhanced diagnostic logging for Mistral API interactions
- Comprehensive error reporting for API service issues
- Standalone Mistral API test script for direct testing
- Detailed request and response validation

### Fixed
- Better error handling for service outages
- Improved debugging capabilities for third-party API issues
- Enhanced diagnostic information for troubleshooting

### Improved
- More detailed logging for API calls and responses
- Better visibility into API key usage and authentication
- Enhanced error cause identification

## [1.34.0] - 2025-05-06

### Added
- Secure deployment workflow with Cloudflare secrets management
- New `deploy:with-secrets` script for handling API keys securely
- Comprehensive deployment guidelines in CLAUDE.md
- Documentation for Cloudflare Mistral API key setup

### Fixed
- Improved API key management with Cloudflare Secrets API
- Fixed version reading from package.json in health endpoint
- Updated deployment script for better cross-platform compatibility

### Improved
- Enhanced security practices for API key management
- Standardized deployment process with explicit secrets handling
- Better documentation on proper API key management

## [1.33.0] - 2025-05-05

### Added
- Production smoke test scripts for all environments
- TypeScript implementation of comprehensive API smoke tests
- Shell script wrapper for running smoke tests with environment targeting
- New npm scripts for running smoke tests against different environments
- Enhanced logging configuration in Cloudflare Workers

### Improved
- Better production monitoring with automated smoke tests
- Simplified testing workflow for operations teams
- Enhanced visibility into production API health
- More robust deployment verification process

## [1.32.0] - 2025-05-04

### Added
- TestDIContainer class for consistent test mocking
- createMockMistral factory function for type-safe mocking
- Enhanced mock testing support for all test types

### Fixed
- Fixed instanceof type check failures in tests 
- Improved error handling in Mistral client validation tests
- Added hardcoded test API key for integration tests
- Fixed console output suppression in I/O tests

### Improved
- Better prototype chain preservation in mock objects
- Enhanced developer experience with more reliable tests
- Improved mock test context awareness with typed responses
- Consistent mock API behavior across test suites

## [1.29.0] - 2025-06-10

### Fixed
- Fixed "unknown error" during test execution caused by TypeScript type safety issues
- Added proper type assertions for API responses in integration tests
- Updated version expectations in health check tests to match current API version

### Added
- Post-mortem analysis process with templates and documentation
- Type safety rules for API responses to prevent similar issues
- Documentation of lessons learned from TypeScript type assertion challenges

## [1.28.0] - 2025-06-10

### Improved
- Enhanced API key validation with better error location information
- Added more comprehensive validation for API key format and common placeholders
- Removed explicit placeholder key check for better security

### Fixed
- Improved error messages with detailed location information for easier debugging
- Made API key validation more consistent across all modules

## [1.27.0] - 2025-06-07

### Changed
- Merged version 1.26.1 fixes into main branch
- Official production release incorporating all fixes from 1.26.0 and 1.26.1
- Enhanced API key validation and error handling
- Fixed MIME type detection and base64 encoding for Mistral API integration
- Improved type definitions and TypeScript compatibility

### Added
- Enhanced validation checks for API keys across all components
- Detailed error messages with component location for easier debugging
- Integration with Cloudflare environment variables
- Improved reliability of environment variable detection

### Fixed
- Better error handling for invalid or missing API keys
- More robust initialization process for Mistral client
- Enhanced stability in cloud environments

## [1.26.1] - 2025-06-10

### Fixed
- Improved API key validation and error handling in MistralOCRProvider
- Added explicit checks for missing API keys before making API calls
- Enhanced error messages with specific guidance when API key is missing or invalid
- Added special handling for authentication-related errors
- Fixed type definitions in IoE interface for better TypeScript compatibility

## [1.26.0] - 2025-06-05

### Fixed
- Fixed base64 encoding issues when calling Mistral OCR API
- Improved handling of image data encoding for different environments
- Added Buffer-based encoding as primary approach with fallbacks
- Enhanced error handling and logging for OCR processing
- Fixed MIME type detection for proper data URL formatting
- Made OCR integration more reliable across Node.js and Cloudflare Workers

### Added
- Direct test for Mistral API integration to verify encoding approach
- Enhanced logging for better troubleshooting of OCR issues

## [1.25.1] - 2025-06-03

### Improved
- Updated receipt schema documentation to reflect v1.25.0 changes
- Added information about the ReceiptBase interface in documentation
- Clarified optional vs required fields in schema documentation
- Updated class diagrams to show inheritance relationship
- Fixed example code in documentation to show currency is optional

## [1.25.0] - 2025-06-02

### Added
- ReceiptBase interface for common receipt type fields
- Enhanced type system with better interface composition

### Changed
- Updated Receipt schema to make currency field optional
- Improved schema flexibility while maintaining validation rules
- Enhanced test suite to verify new type behavior

## [1.24.0] - 2025-05-30

### Added
- TypeScript type definitions for all API responses
- Enhanced type safety for client applications interacting with the API
- Example TypeScript client implementation with proper typing
- Example HTML client for API integration demonstration
- Comprehensive documentation for API response types

### Improved
- Better client integration experience with strongly-typed responses
- Enhanced developer workflow with proper TypeScript support
- Full end-to-end type safety from API to client code

## [1.23.0] - 2025-05-30

### Added
- Comprehensive example JSON files for receipt and check OCR responses
- Detailed example JSON files demonstrating the API response format
- README file in examples directory explaining the purpose and structure of example files
- Cross-references between example files and schema documentation

### Improved
- Enhanced documentation with links to example JSON files
- Better developer experience with concrete response examples
- More intuitive understanding of API response structure

## [1.22.2] - 2025-05-27

### Fixed
- Resolved Buffer compatibility issues for Cloudflare Workers deployment
- Fixed ArrayBuffer to base64 conversion for Web environments
- Added proper error handling for Mistral API connection
- Enhanced API key validation and debugging
- Updated wrangler.toml configuration for better Workers support

### Improved
- More robust error messaging for deployment troubleshooting
- More detailed logging to diagnose API connection issues
- Better compatibility with edge runtime environments
- Chunked processing for large images to prevent stack overflow

## [1.22.1] - 2025-05-27

### Added
- Detailed Cloudflare account setup guide with step-by-step instructions
- Account creation and configuration walkthrough
- API token generation guide with security best practices
- Custom domain configuration instructions
- Workers pricing plan information with upgrade guidance
- Team access management documentation
- Placeholder images for visual walkthrough of account setup process

### Improved
- Overall deployment documentation clarity and completeness
- First-time user onboarding experience
- More detailed prerequisites section

## [1.22.0] - 2025-05-27

### Added
- Comprehensive Cloudflare Workers deployment guide with detailed instructions
- Step-by-step manual deployment process documentation
- Environment-specific deployment configuration details
- Automated deployment workflow documentation using GitHub Actions
- Troubleshooting guide for common deployment issues
- Visual guide placeholders for Cloudflare deployment steps
- Deployment verification checklist with pre- and post-deployment tasks
- Rollback procedures for failed deployments
- Application monitoring guidance for deployed services

### Improved
- System architecture documentation with links to deployment guide
- README.md with clearer deployment instructions
- Development guidelines with deployment-specific information
- Project documentation cross-references for better navigation

## [1.21.1] - 2025-05-26

### Fixed
- Swift E2E test compilation errors with XCTSkip usage
- Swift async test issues with withTimeout helper implementation
- Nil coalescing warnings in Swift integration tests
- Server startup reliability in Swift E2E test script
- Task cancellation handling for proper timeout implementation
- Fixed server process tracking and shutdown

### Improved
- Swift E2E test reliability with more robust async implementations
- Server script error handling and process management
- Test stability across different Swift compiler versions

## [1.21.0] - 2025-05-26

### Added
- End-to-end integration tests for Swift proxy client
- Automated test script for Swift proxy E2E tests (run-swift-e2e-tests.sh)
- New npm script for running Swift E2E tests (test:swift-e2e)
- Comprehensive test documentation for Swift proxy
- Timeout handling for network operations in Swift tests
- Automatic server lifecycle management for E2E tests

### Improved
- Test coverage for Swift proxy client with real server communication
- Robust error handling in Swift integration tests
- Documentation for Swift E2E test usage and configuration
- Test image path handling with multi-location search

## [1.20.1] - 2025-05-26

### Changed
- Added Swift proxy build directory (.build/) to gitignore
- Improved repository cleanliness by excluding Swift build artifacts

## [1.20.0] - 2025-05-26

### Fixed
- Resolved Swift proxy test issues with duplicate response struct definitions
- Implemented URLSessionProtocol for improved testability and mocking
- Fixed URLSessionMock implementation for async/await tests
- Added support for delegate parameter in async URLSession method calls
- Improved Swift proxy code organization with better protocol-based design

## [1.19.0] - 2025-05-25

### Added
- Swift proxy client now supports modern Swift concurrency with async/await
- Comprehensive example code for async/await usage patterns
- SwiftUI integration example for the Swift proxy client
- Unit tests for async API methods

### Changed
- Refactored Swift proxy client for cleaner, more idiomatic Swift code
- Maintained backward compatibility with completion handlers
- Enhanced error handling for Swift proxy client
- Updated documentation with both async/await and completion handler examples

## [1.18.0] - 2025-05-24

### Added
- Swift proxy client library for easy API integration in iOS/macOS applications
- Comprehensive Swift models matching the API schemas
- Clean API interface with Swift-idiomatic design
- Detailed documentation and usage examples for the Swift client
- Support for all API endpoints in the Swift client

### Changed
- Improved client library experience with Swift-native error handling
- Enhanced developer experience with convenience factory methods
- Better Swift compatibility with modern Swift language features
- Simplified integration for Apple platform developers

## [1.17.0] - 2025-05-22

### Added
- OpenAPI 3.0 specification for the entire API
- Comprehensive documentation for the OpenAPI specification
- Nolock.social company information and API URLs
- Local server startup script for easier development
- Automatic prerequisite checking and installation
- Fallback API key for development environment

### Changed
- Updated company information to Nolock.social
- Changed API URLs to use Nolock.social domain
- Simplified local development workflow
- Improved documentation for API endpoints
- Updated test API key handling for local development

## [1.16.0] - 2025-05-22

### Added
- Local server startup script for easier development
- Automatic prerequisite checking and installation 
- Comprehensive local development documentation
- Fallback API key for development environment

### Changed
- Simplified development workflow with automatic dependency handling
- Improved error handling and colorized output in scripts
- Enhanced developer experience with helpful command suggestions

## [1.15.0] - 2025-05-19

### Added
- Commit message cleanup tools to enforce consistent standards
- Script to automatically clean commit messages with unwanted references
- Comprehensive commit message policy documentation

### Changed
- Enhanced project maintainability with standardized commit message format
- Improved developer workflow with automated commit message cleanup tools

## [1.14.0] - 2025-05-18

### Added
- Comprehensive Cloudflare Workers deployment configuration
- GitHub Actions CI/CD workflows for automated testing and deployment
- Multi-environment deployment support (development, staging, production)
- Automated deployment to Nolock.social domains
- Detailed deployment documentation
- Complete OpenAPI 3.0 specification for all API endpoints

### Changed
- Updated wrangler.toml with environment-specific configurations
- Implemented proper environment variable handling for secure API key management
- Configured routes for api.nolock.social, staging-api.nolock.social, and dev-api.nolock.social
- Updated server information to use Nolock.social domain and contact info

## [1.13.0] - 2025-05-16

### Added
- Changed project license to GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later)
- Added LICENSE file with AGPL license details
- Updated all documentation with AGPL license references
- Improved copyright notices with consistent license information

### Changed
- Updated license field in package.json from ISC to AGPL-3.0-or-later
- Updated README.md with detailed AGPL license explanation and requirements
- Enhanced copyright information across all documentation files

## [1.12.2] - 2025-05-14

### Added
- Comprehensive documentation for all system components
- Test server management documentation with detailed implementation
- Copyright notices for O2.services across all documentation files

### Improved 
- Updated API documentation with detailed examples and responses
- Enhanced testing architecture documentation with server management details
- Fixed broken documentation links and references
- Standardized documentation format across all files

## [1.12.1] - 2025-05-12

### Fixed
- Improved server process management in test scripts
- Added robust server shutdown after integration tests
- Fixed potential "zombie" server processes with improved process tracking
- Enhanced error handling for server startup and shutdown
- Added signal handlers to ensure clean server shutdown on script termination

## [1.12.0] - 2025-05-12

### Changed
- Removed root `/` endpoint in favor of dedicated endpoints
- Simplified API structure with clear, purpose-specific endpoints
- Updated integration tests to focus on dedicated endpoints

### API Changes
- Root endpoint (`/`) no longer supported - use the following endpoints instead:
  - `/process` - Universal document processing endpoint (with type=check|receipt)
  - `/check` - Check-specific processing endpoint
  - `/receipt` - Receipt-specific processing endpoint
  - `/health` - Server status endpoint

## [1.11.0] - 2025-05-10

### Added
- Added unit tests for `io.ts` module
- Added integration tests for health endpoint
- Added integration tests for error handling
- Added documentation of problem-solution patterns in `.claude/rules/` directory
- Created knowledge management system with test framework compatibility rules

### Fixed
- Improved integration test reliability
- Enhanced error handling in test runner script
- Added better error reporting for test failures

### Changed
- Updated health endpoint version to 1.11.0
- Improved test runner script to better handle specific test cases

## [1.10.0] - 2025-05-05

### BREAKING CHANGES
- Removed legacy adapters: `src/json/receipt-extractor.ts` and `src/json/check-extractor.ts`
- Direct imports of these legacy adapters will now fail and must be updated

### Changed
- Simplified codebase by removing all legacy adapter code
- Streamlined imports and API - use extractors directly from src/json/extractors
- Removed potentially confusing duplicate implementations

### Migration Guide
- Update imports to use the new paths:
  ```typescript
  // Old import (no longer works)
  import { ReceiptExtractor } from '../src/json/receipt-extractor';
  
  // New import
  import { ReceiptExtractor } from '../src/json/extractors/receipt-extractor';
  ```
- Make sure your code works with readonly Result tuples (instead of mutable ones)
- If you need both extractors, import them directly from their respective files

## [1.9.5] - 2025-05-04

### Changed
- Improved deprecated code handling with migration notices and console warnings
- Added migration tests to ensure smooth transition from legacy adapters
- Stopped exporting legacy adapters from main index to encourage use of modern implementations
- Removed deprecated `createMistralScanner` method from ScannerFactory

### Migration Guide
- Replace imports from `src/json/receipt-extractor` with `src/json/extractors/receipt-extractor`
- Replace imports from `src/json/check-extractor` with `src/json/extractors/check-extractor`
- Update `ScannerFactory.createMistralScanner()` calls to `ScannerFactory.createMistralReceiptScanner()`
- Adapt your code to use readonly Result tuples instead of mutable tuples

## [1.9.4] - 2025-05-03

### Added
- Added comprehensive tests for factory methods
- Added comprehensive tests for legacy check-extractor adapter

## [1.9.3] - 2025-05-03

### Changed
- Renamed `createMistralScanner` to `createMistralReceiptScanner` for better naming consistency
- Added backward compatibility with deprecated methods
- Created `check-extractor.ts` adapter file for symmetry with `receipt-extractor.ts`
- Updated all references to use the new method names

## [1.9.2] - 2025-05-03

### Fixed
- Completely suppressed ts-node deprecation warnings in all test scripts

## [1.9.1] - 2025-05-03

### Fixed
- Updated Node.js loader approach to eliminate experimental loader warnings
- Fixed server startup script to use correct project root path
- Added proper environment variable passing for integration tests
- Created dedicated receipt scanner test script for better isolation
- Suppressed ts-node deprecation warnings with --no-deprecation flag

## [1.9.0] - 2025-05-02

### Added
- Dedicated `/receipt` endpoint for receipt image processing 
- Receipt scanner integration tests with comprehensive validation
- Receipt API endpoint tests for both dedicated and universal endpoints
- Enhanced receipt schema documentation with validation rules and examples

### Changed
- Updated documentation with detailed receipt processing instructions
- Improved error handling in receipt processing endpoints
- Standardized confidence scoring across all document types

## [1.8.0] - 2025-04-29

### Changed
- Renamed DocumentProcessor interface to DocumentScanner for better clarity
- Renamed processor directory to scanner to better reflect its purpose
- Renamed ProcessorFactory to ScannerFactory for consistent naming
- Renamed createMistralProcessor to createMistralScanner for API consistency
- Moved tests to match new directory structure (scanner instead of processor)

### Fixed
- Fixed DI container TypeScript issues with component instantiation
- Fixed nested OCR result array access in unified processor (now receipt-scanner)
- Improved error handling for API rate limits
- Moved tests from src directory to proper tests/unit directory
- Fixed test interfaces to match implementation
- Added dedicated test script for receipt scanner tests

## [1.7.1] - 2025-04-29

### Fixed
- Type compatibility issue in legacy receipt extractor adapter
- Fixed functional tests for receipt extractor
- Resolved readonly vs mutable tuple type conflict with functionalscript library

## [1.7.0] - 2025-04-29

### Added
- Dependency Injection (DI) system using InversifyJS
- New DIContainer class that manages all service dependencies
- Support for TypeScript decorators and reflection metadata

### Changed
- Renamed `MistralReceiptExtractor` to `ReceiptExtractor` to better reflect its responsibility
- Renamed `UnifiedProcessor` to `ReceiptScanner` for clarity and consistency
- Refactored `ProcessorFactory` to use DIContainer for dependency management
- Updated all references in code and tests to use new class names
- Improved clarity by removing misleading technology references in class names

## [1.6.1] - 2025-05-12

### Changed
- Simplified architecture by directly using the IReceiptExtractor interface
- Renamed imports for better clarity with interface alias patterns
- Improved code readability by removing unnecessary abstraction layers

## [1.6.0] - 2025-05-10

### Added
- New `ReceiptExtractor` interface for better abstraction
- Refactored `MistralReceiptExtractor` to implement the interface
- Added backward compatibility adapter for legacy code

### Changed
- Updated `ReceiptScanner` (formerly `UnifiedProcessor`) to use the new `ReceiptExtractor` interface
- Improved dependency injection following SOLID principles
- Restructured code with dedicated extractors directory

### Fixed
- Improved type safety by using interfaces instead of function types

## [1.5.0] - 2025-05-05

### Added
- ReceiptScanner that encapsulates OCR and JSON extraction in a single component
- New `/process` API endpoint for streamlined document processing
- Factory pattern for easy processor creation
- Comprehensive confidence scoring (OCR, extraction, and overall)
- Documentation with UML diagrams for the new component

### Changed
- Improved architecture following SOLID principles
- Enhanced API response format with confidence metrics

## [1.4.0] - 2025-05-01

### Added
- Comprehensive receipt schema implementation with TypeScript interfaces and enums
- ReceiptExtractor with JSON Schema validation for structured data extraction
- String-based TypeScript enums for improved type safety
- UML diagrams in documentation for visual architecture representation
- Result tuple pattern for consistent error handling (`['ok', value] | ['error', error]`)
- Field validation rules with comprehensive type definitions

### Changed
- Updated receipt-extractor.ts to use JsonExtractor interface instead of JsonExtractorProvider
- Improved integration test stability through enhanced server URL detection
- Reorganized schema definitions with logical field grouping
- Enhanced documentation with code examples and implementation details

### Fixed
- Schema inconsistencies between field names (e.g., totalAmount vs totals.total)
- Mermaid diagram syntax for proper rendering in documentation
- Improved error handling for OCR text processing

## [1.3.0] - 2025-04-30

### Added
- JSON extraction capability from OCR text
- Confidence scoring for extraction reliability
- Schema validation for extracted JSON data

### Changed
- Enhanced JSON extraction design with detailed implementation
- Simplified MistralJsonExtractorProvider implementation
- Improved prompt formatting with code blocks for schemas

### Fixed
- Removed unnecessary parameters from Mistral API calls
- Fixed JSON schema formatting in prompts for better extraction

## [1.2.0] - 2025-04-29

### Added
- Comprehensive testing architecture with four test types
- Dedicated test fixtures directory for images and expected results
- Custom mock function implementation for unit and functional tests
- Detailed testing documentation in docs/testing.md

### Changed
- Reorganized project structure for better maintainability
- Moved all test files to dedicated directories by test type (unit, functional, semi, integration)
- Moved check images to tests/fixtures/images/
- Created unified test runners in scripts/ directory
- Updated package.json scripts to use new test runners
- Enhanced documentation with detailed test structure information
- Improved error handling in test runners

### Fixed
- Test timeout issues with explicit jasmine timeout configuration
- Semi-integration test reliability with proper directory structure

## [1.1.0] - 2025-04-28

### Added
- Semi-integration test for Mistral OCR provider
- Jasmine timeout configuration for API tests

### Changed
- Simplified MistralOCRProvider implementation
- Removed redundant model property in provider class
- Made Mistral client a required dependency
- Improved test structure with cleaner organization
- Explicitly use "mistral-ocr-latest" model in API calls

### Removed
- Redundant integration test files
- Unused config parameter from MistralOCRProvider

## [1.0.0] - Initial Release

### Added
- Initial implementation of OCR Checks Worker
- Mistral AI integration for OCR processing
- API endpoint for check image processing
- Unit tests for all components
EOF < /dev/null