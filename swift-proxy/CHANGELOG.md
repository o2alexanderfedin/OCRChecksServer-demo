# Changelog

All notable changes to the NolockOCR Swift package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Improved HEIC image conversion to use PNG format instead of JPEG for better quality
- Updated Content-Type headers to reflect PNG image format
- Removed compression quality settings as PNG is a lossless format

## [1.0.0] - 2025-05-06

### Added
- Initial release of the NolockOCR Swift package
- Support for modern Swift concurrency (async/await)
- Support for traditional completion handlers for backward compatibility
- Type-safe models for check and receipt data
- Comprehensive error handling
- Environment configuration (development, staging, production)
- Support for HEIC image format with automatic conversion
- Confidence scoring for OCR and extraction quality
- Health check API
- Comprehensive documentation
- Example application demonstrating all features
- SwiftUI integration examples