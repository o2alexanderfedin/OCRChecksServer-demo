# Changelog

All notable changes to this project will be documented in this file.

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