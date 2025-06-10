# CLAUDE.md - General guidelines for the development process

## Development Workflow Guidelines

1. **Always Work Within Git Flow Feature Scope**
   - All changes should be made within a dedicated feature branch created using `git flow feature start`
   - Complete features should be finished using `git flow feature finish` to merge back to develop
   - Never work directly on main or develop branches
   - Follow the [Gitflow Branch Management](./.claude/rules/gitflow-branch-management.md) rules to maintain proper branch structure
   - IMPORTANT: Never delete release branches, as they represent historical snapshots
   - When tests fail, ALWAYS create a feature branch before fixing issues - follow the [Gitflow Testing Workflow](./.claude/rules/gitflow-testing-workflow.md) to avoid premature fixes

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

8. **Continuously Improve Tools and Documentation**
   - When you discover that a tool, recommendation, or documented process doesn't work as expected, and you find a solution, you MUST update the corresponding tools and documentation
   - Don't leave broken processes or misleading documentation in place
   - Update both the code (scripts, tools) and the documentation to reflect the correct approach
   - See [Continuous Improvement](./.claude/rules/continuous-improvement.md) for a detailed process

9. **Document Problem-Solution Patterns**
   - When you solve a challenging problem that required multiple attempts, document the solution
   - Create a new rule file in the `.claude/rules/` directory with a descriptive name
   - Include the problem context, solution approach, and prevention strategies
   - Reference the rule file from CLAUDE.md with a brief description of the problem
   - This creates an easily searchable knowledge base for future similar issues
   - Example: [Gitflow Branch Management](./.claude/rules/gitflow-branch-management.md) documents the correct branch management practices, including why release branches must be preserved
   - Example: [Integration Problem Solving](./.claude/rules/integration-problem-solving.md) provides a framework for addressing cross-platform integration challenges
   - Example: [Software Problem Solving](./.claude/rules/software-problem-solving.md) offers a comprehensive approach to tackling diverse technical challenges
   - Example: [Submodule Management](./.claude/rules/submodule-management.md) establishes best practices for working with Git submodules
   - Example: [Continuous Improvement](./.claude/rules/continuous-improvement.md) guides the evolution of tools and documentation based on experience
   - Example: [Technical Debt Tracking](./.claude/rules/technical-debt-tracking.md) provides a framework for systematically managing technical debt
   - Example: [GitHub Project Management](./.claude/rules/github-project-management.md) establishes best practices for creating and managing GitHub Projects v2 with proper issue hierarchy, field configuration, and API usage
   - Example: [Kanban Execution Flow](./.claude/rules/kanban-execution-flow.md) defines task selection criteria, status transitions, and work-in-progress management for efficient project execution
   - Example: [Project Status Management](./.claude/rules/project-status-management.md) ensures correct hierarchical status management to prevent parent issues being marked "Done" while child dependencies remain incomplete
   - Example: [GitFlow Release Management](./.claude/rules/gitflow-release-management.md) establishes comprehensive release process including version management, tagging, documentation, and GitHub project integration
   - Example: [Defensive Problem Solving](./.claude/rules/defensive-problem-solving.md) prevents reactive changes to working code by requiring evidence-based analysis before making modifications in response to user frustration

10. **Maintain Accurate Project Status**
   - Before marking any issue as "Done", verify ALL child dependencies are complete
   - Parent issues (Epics, User Stories) cannot be "Done" if any child tasks are still "Todo" or "In Progress"
   - Always verify code implementation exists before updating status
   - Follow the [Project Status Management](./.claude/rules/project-status-management.md) rules to maintain consistency
   - Use verification scripts to check dependencies before status updates

11. **Follow Proper Release Management**
   - Use GitFlow release process for all version releases
   - Update package.json version numbers following semantic versioning
   - Create comprehensive release summaries documenting all changes
   - Ensure all GitHub project issues are marked as "Done" before release
   - Follow the [GitFlow Release Management](./.claude/rules/gitflow-release-management.md) process for complete workflow
   - Tag releases with comprehensive descriptions including features and achievements
   - Push all branches and tags to remote repository after successful release

12. **Perform Post-Mortem Analysis**
   - After each feature completion, conduct a post-mortem analysis using the [post-mortem template](./.claude/templates/post-mortem.md)
   - Document all issues encountered, root causes, and solutions applied
   - Extract reusable lessons and create or update rule files
   - Store post-mortems in the `.claude/post-mortems/` directory with a descriptive filename
   - Link relevant post-mortems in related documentation
   - Example: [Type Safety for API Responses](./.claude/rules/type-safety-api-responses.md) documents how to prevent "unknown errors" by properly typing API responses

## Testing Guidelines

1. **Maintain GitFlow Process When Fixing Test Failures**
   - NEVER fix failing tests while on develop or main branches
   - Create a feature branch IMMEDIATELY when tests fail: `git flow feature start fix-issue-name`
   - See [Gitflow Testing Workflow](./.claude/rules/gitflow-testing-workflow.md) for the detailed process
   - Run `./scripts/pre-test-check.sh` before running tests to verify you're on the correct branch

2. **Don't Test Standard Library Functions**
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
- Deploy with secrets: `npm run deploy:with-secrets`

## Deployment Guidelines

1. **Manage API Keys Securely**
   - Always use the deployment script that handles secrets: `npm run deploy:with-secrets`
   - Never commit actual API keys to the repository (except in .dev.vars for development)
   - Follow the [Cloudflare Mistral API Key Setup](./.claude/rules/Cloudflare_Mistral_API_Key_Setup.md) guide for configuring API keys
   - Use environment-specific configurations in wrangler.toml for different environments