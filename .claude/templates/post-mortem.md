# Feature Post-Mortem: [Feature Name]

## Summary
Brief summary of the feature and its implementation status.

## Issues Encountered
- [List key issues encountered during development]
- [Include both technical challenges and process issues]
- [Be specific about error messages and unexpected behaviors]

## Root Causes
- [Analysis of root causes for each issue]
- [Include both immediate and underlying factors]
- [Note any patterns that emerge across multiple issues]

## Solutions Applied
- [How issues were resolved]
- [Include code changes, process changes, and workarounds]
- [Reference specific commits or PRs when applicable]

## Lessons Learned
- [General lessons applicable to future development]
- [Patterns to recognize in similar situations]
- [Techniques that proved effective or ineffective]

## Rule Updates
- [New rules created based on these lessons]
- [Existing rules modified or clarified]
- [Documentation improvements]

## Follow-up Actions
- [Any remaining work or tech debt to address]
- [Potential improvements for future iterations]
- [Areas requiring additional exploration]

## Process Requirements for Implementation
- Implementation MUST be done within a GitFlow feature branch
- Create architectural design document before implementation (if applicable)
- Use Test-Driven Development (TDD) approach:
  - Write failing tests first
  - Implement code to make tests pass
  - Refactor while maintaining tests
- Follow SOLID principles:
  - Single Responsibility Principle
  - Open/Closed Principle
  - Liskov Substitution Principle
  - Interface Segregation
  - Dependency Inversion
- Apply KISS principle:
  - Choose the simplest solution
  - Avoid unnecessary complexity
  - Prioritize readability and maintainability