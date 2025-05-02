# Test Framework Compatibility Patterns

## Problem

When writing tests for an existing codebase, you may encounter compatibility issues between different testing frameworks or testing styles. For example, if you write tests using Jest-style mocking and assertions but the project uses Jasmine, your tests will fail with errors like:

- `Cannot find name 'jest'`
- `Property 'toHaveProperty' does not exist on type 'Matchers<unknown>'`

## Solution

1. **Study Existing Tests First**: Before writing new tests, analyze existing test files to understand:
   - Which testing framework is in use (Jest, Jasmine, Mocha, etc.)
   - How assertions are structured
   - How mocks are created and used
   - Common patterns for async tests

2. **Framework-Specific Patterns**:

   **Jasmine Pattern**: Instead of Jest's mock functions:
   ```typescript
   // Don't use Jest-style mocks
   const mockFn = jest.fn().mockReturnValue('value');
   expect(mock).toHaveBeenCalledTimes(1);

   // Instead, use this Jasmine approach
   let fnCalled = false;
   let fnArg = null;
   const mockFn = (arg) => {
     fnCalled = true;
     fnArg = arg;
     return 'value';
   };
   
   // Then assert
   expect(fnCalled).toBe(true);
   expect(fnArg).toBe('expected value');
   ```

3. **Assertion Style**:
   - Stick to basic assertions that work across frameworks: `.toBe()`, `.toEqual()`, etc.
   - For object property checking, use explicit property access instead of `.toHaveProperty()`:
   ```typescript
   // Don't use
   expect(obj).toHaveProperty('key', 'value');
   
   // Instead use
   expect(obj.key).toBe('value');
   // Or for type safety
   expect(typeof obj === 'object' && obj !== null).toBe(true);
   const typedObj = obj as {key: string};
   expect(typedObj.key).toBe('value');
   ```

4. **Fix Typed Objects**:
   - When dealing with API responses or other dynamically typed objects, use type assertions:
   ```typescript
   const body = await response.json();
   // Type assertion
   const typedBody = body as {status: string; timestamp: string};
   expect(typedBody.status).toBe('ok');
   ```

## Preventing Recurrence

- Create a "test style guide" document for the project
- Add example test patterns that new contributors should follow
- Consider adding type definitions or utilities specific to your testing framework
- Create shared testing utilities to centralize common testing functionality