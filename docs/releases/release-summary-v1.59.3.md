# Release Summary: v1.59.3

## Release Date
May 22, 2025

## Overview
This minor release improves the load testing capabilities of the OCR Checks Server by enhancing the test-all-environments.sh script to support longer test durations and more frequent request intervals.

## Changes

### Enhancements
- Updated the test-all-environments.sh script to run for 10 minutes by default
- Reduced the interval between requests to 1/3 of a second for more intensive testing
- Added timestamps to test output for better monitoring
- Added request rate tracking (requests per minute) to help analyze performance
- Improved output formatting for better readability

### Bug Fixes
- Fixed linting issues in src/json/mistral.ts file
- Updated tag message format for consistency

## Deployment Instructions
No special deployment steps are needed for this release, as the changes are primarily for testing tools.

The test script can be run as follows:

```bash
./scripts/test-all-environments.sh             # Run for 10 minutes
./scripts/test-all-environments.sh 1800        # Run for 30 minutes (specify seconds)
```

## Testing Instructions
The improved test script provides more detailed output and supports longer durations:

- Default testing duration is now 10 minutes (was 5 minutes)
- Requests are sent every 1/3 second (was 1 second)
- Output includes timestamps, request counts, and request rates
- Error responses show detailed error messages

## Known Issues
- None

## Contributors
- Alexander Fedin