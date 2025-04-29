# Changelog

All notable changes to this project will be documented in this file.

## [1.8.0] - 2025-04-29

### Fixed
- Fixed DI container TypeScript issues with component instantiation
- Fixed nested OCR result array access in unified processor
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