# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2025-04-28

### Added
- Semi-integration test for Mistral OCR provider
- Test step scripts for easier testing and debugging
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