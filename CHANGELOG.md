# Changelog

All notable changes to this project will be documented in this file.

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