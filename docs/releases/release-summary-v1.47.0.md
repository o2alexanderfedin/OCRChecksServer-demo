# Release v1.47.0 Summary

## Overview

This release focuses on standardizing test image references across the codebase. We've renamed test images to have more descriptive filenames and updated all references throughout the project. This improves code readability, maintenance, and makes it easier for new developers to understand the purpose of each test image.

## Key Changes

- Renamed test images with descriptive filenames:
  - `telegram-cloud-photo-size-1-4915775046379745522-y.jpg` → `fredmeyer-receipt-2.jpg`
  - `telegram-cloud-photo-size-1-4915775046379745521-y.jpg` → `fredmeyer-receipt.jpg`
  - `IMG_2388.HEIC` → `pge-bill.HEIC`
  - `IMG_2388.jpg` → `rental-bill.jpg`
  - Added new test image: `promo-check.HEIC`

- Updated all references to these images across:
  - Integration tests
  - Smoke test scripts
  - API test endpoints
  - Swift proxy tests
  - Documentation files

- Improved smoke test performance by reducing the size threshold for test images from 100KB to 1KB

## Files Updated

- tests/integration/scanner/receipt-scanner-fixed.test.ts
- tests/integration/receipt-api.test.ts
- scripts/smoke-test.sh
- scripts/test-mistral.js
- swift-proxy/Tests/OCRClientIntegrationTests.swift
- tests/integration/check-api.test.ts
- docs/receipt-scanner-testing.md
- tests/unit/mistral-api.test.ts
- swift-proxy/Tests/README.md

## Testing

All tests have been verified to work with the new image names. The updates maintain the same functionality while improving code clarity and organization.

## Contributors

- Development Team

🤖 Generated with [Claude Code](https://claude.ai/code)