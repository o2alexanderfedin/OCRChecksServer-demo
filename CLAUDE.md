# CLAUDE.md - Guidelines for OCR Checks Server

## Development Workflow Guidelines

1. **Always Work Within Git Flow Feature Scope**
   - All changes should be made within a dedicated feature branch created using `git flow feature start`
   - Complete features should be finished using `git flow feature finish` to merge back to develop
   - Never work directly on main or develop branches

2. **Use Test-Driven Development (TDD)**
   - Write tests before implementing functionality
   - Follow the Red-Green-Refactor cycle:
     - Red: Write a failing test
     - Green: Implement minimal code to make it pass
     - Refactor: Clean up the code while maintaining passing tests
   - Run ALL tests after each change to ensure no regressions are introduced
   - Use `npm test` to verify the entire test suite passes

3. **Apply SOLID and KISS Principles**
   - **Single Responsibility Principle**: Each class/module should have only one reason to change
   - **Open/Closed Principle**: Open for extension, closed for modification
   - **Liskov Substitution Principle**: Subtypes must be substitutable for their base types
   - **Interface Segregation**: Prefer multiple specific interfaces over one general-purpose interface
   - **Dependency Inversion**: Depend on abstractions, not concretions
   - **Keep It Simple**: Choose the simplest solution that meets the requirements

4. **Commit and Push Frequently**
   - Commit after each successful test implementation
   - Use descriptive commit messages explaining what and why, not how
   - Push regularly to share progress and create remote backups

5. **Work in Small, Incremental Steps**
   - Break down large tasks into smaller, manageable pieces
   - Work iteratively with "baby steps" rather than large-scale changes
   - Complete and test one small change before moving to the next

6. **Don't Break What Works**
   - Maintain backward compatibility whenever possible
   - When modifying existing code, verify that all previous functionality still works
   - Add new tests for bug fixes to prevent regressions
   - Be cautious when refactoring, ensuring tests pass before and after changes

7. **Minimize Changes to Unrelated Code**
   - Keep changes focused on the feature/fix at hand
   - Avoid making unrelated "improvements" in the same commit
   - If you notice unrelated issues, create separate tasks or tickets for them
   - When in doubt, follow the Single Responsibility Principle for commits

8. **Document Problem-Solution Patterns**
   - When you solve a challenging problem that required multiple attempts, document the solution
   - Create a new rule file in the `.claude/rules/` directory with a descriptive name
   - Include the problem context, solution approach, and prevention strategies
   - Reference the rule file from CLAUDE.md with a brief description of the problem
   - This creates an easily searchable knowledge base for future similar issues

## Testing Guidelines

1. **Don't Test Standard Library Functions**
   - Avoid writing tests for functionality that's already provided by the runtime or standard libraries
   - Examples: base64 encoding/decoding (btoa/atob), standard array methods, built-in type conversions
   - Focus testing efforts on custom business logic and application-specific code

2. **Evaluate Custom Implementations**
   - Before testing utility functions, determine if they're custom implementations or wrappers around standard functionality
   - If a function is simply wrapping a standard library function, focus tests on the added value, not the underlying implementation

3. **Test Strategy Prioritization**
   - Focus on testing business logic and domain-specific code first
   - Prioritize testing error handling paths and edge cases in custom code
   - Test integration points between components rather than standard libraries

4. **Match Testing Framework Styles**
   - See [Testing Framework Compatibility](./.claude/rules/test-framework-compatibility.md) for detailed guidelines
   - We encountered Jest vs. Jasmine compatibility issues when creating new tests
   - Study existing tests to understand framework conventions before writing new tests

## Runtime Environment Commands

- Run all tests: `npm test`
- Run unit tests: `npm run test:unit`
- Run integration tests: `npm run test:integration`