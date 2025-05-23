# Release Summary for v1.59.4

## Overview
This release includes a fix for JSON extraction functionality in the Mistral API integration. It improves the prompt construction for JSON extraction to ensure proper instructions are provided.

## Changes
- Fixed the MistralJsonExtractor to include explicit extraction instructions in the prompt
- Enhanced test coverage by ensuring all functional tests pass successfully

## Technical Details
- The `constructPrompt` method in `src/json/mistral.ts` now properly formats prompts with clear extraction instructions
- Improved prompt format:
  ```
  Extract the following information from this markdown text as JSON:
  
  [markdown content]
  
  Return valid JSON that matches the provided schema.
  ```

## Testing
- All functional tests are now passing
- The fix addresses a specific test failure in `mistral.f.test.ts` related to prompt construction

## Deployment Instructions
Standard deployment process:
```
npm run deploy:with-secrets
```