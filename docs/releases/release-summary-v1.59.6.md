# Release Summary for v1.59.6

## Overview
This release improves the prompt handling mechanism in the JSON extractor to prevent prompt formatting issues. It fixes an issue where domain-specific prompts from the receipt and check extractors were being unnecessarily wrapped with generic instructions.

## Changes
- Enhanced the JSON extractor's prompt handling to detect if the incoming markdown already contains formatted instructions
- Implemented smart prompt detection for receipt and check extraction prompts
- Fixed issues with request timeouts caused by excessively nested prompts

## Technical Details
- The `constructPrompt` method in `MistralJsonExtractorProvider` now checks if the input markdown already contains specific markers like "## Instructions" or domain-specific headers
- For already formatted prompts, the method now passes them through directly without additional wrapping
- Generic formatting is still applied for raw text inputs that don't have instructions

## Testing
- Extensively tested with both receipt and check endpoints on the staging environment
- Verified that the prompt detection logic works correctly for different input types
- Confirmed no regressions in the extraction functionality

## Deployment Instructions
Standard deployment process:
```
npm run deploy:with-secrets
```