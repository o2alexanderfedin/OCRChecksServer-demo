# Type Safety for API Responses

## Problem
When working with API responses in TypeScript, we encountered "unknown error" exceptions during test execution. These errors occurred when tests attempted to access properties on untyped JSON responses. Because TypeScript's type checking doesn't persist at runtime, accessing properties on objects of type `unknown` or `any` can lead to runtime errors that are difficult to diagnose.

## Solution Pattern
1. Always use explicit type assertions when parsing API responses:
   ```typescript
   // ❌ INCORRECT: No type assertion
   const data = await response.json();
   expect(data.status).toBe('ok');  // May cause runtime error if status doesn't exist
   
   // ✅ CORRECT: With type assertion
   const data = await response.json() as HealthResponse;
   expect(data.status).toBe('ok');  // TypeScript ensures status exists
   ```

2. Define interfaces for all API responses in a centralized location (src/types/api-responses.ts):
   ```typescript
   // Define interfaces that match the expected response structure
   export interface HealthResponse {
     status: string;
     version: string;
     timestamp: string;
   }
   
   export interface ErrorResponse {
     error: string;
     hint?: string;
   }
   ```

3. Import and use these interfaces in both implementation and test code:
   ```typescript
   import { HealthResponse, ErrorResponse } from '../../src/types/api-responses';
   
   // Use with type assertions
   const healthData = await response.json() as HealthResponse;
   ```

4. For module resolution issues, use local type definitions if imports fail:
   ```typescript
   // Define locally if imports are problematic in the testing environment
   interface HealthResponse {
     status: string;
     version: string;
     timestamp: string;
   }
   ```

## Prevention Strategy
1. Use the ESLint rule `@typescript-eslint/no-explicit-any` to prevent use of `any` type
2. Add `noImplicitAny: true` and `strictNullChecks: true` to tsconfig.json
3. Create test helpers that automatically type API responses
4. Implement a pre-commit hook that validates type safety

## Benefits
- Catches type mismatch errors at compile time rather than runtime
- Provides better error messages that point directly to the issue
- Documents the expected shape of API responses
- Enables IDE autocompletion and refactoring support
- Prevents the misleading "unknown error" during test execution

## Related Resources
- [TypeScript Handbook: Type Assertions](https://www.typescriptlang.org/docs/handbook/basic-types.html#type-assertions)
- [TypeScript Deep Dive: Types](https://basarat.gitbook.io/typescript/type-system)