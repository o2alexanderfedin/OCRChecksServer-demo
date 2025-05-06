# Technical Debt Tracking

This document tracks technical debt, pending improvements, and future tasks that have been identified but not yet implemented. This ensures important work is not forgotten even when it can't be addressed immediately.

## How to Use This Document

1. **Add Items**: When you identify technical debt or improvement opportunities that can't be addressed right away, add them to the appropriate section below
2. **Prioritize**: Assign a priority level to each item (P0 - Critical, P1 - High, P2 - Medium, P3 - Low)
3. **Status Updates**: Update the status of items as they progress
4. **Resolution**: When an item is resolved, move it to the "Resolved Items" section with the resolution date and summary

## Active Technical Debt

### Architecture

| ID | Description | Priority | Created | Owner | Status | Notes |
|---|---|---|---|---|---|---|
| ARCH-001 | Consider extracting common OCR processing logic into a separate module to reduce duplication | P2 | 2025-05-07 | - | Open | Will improve maintainability and testing |
| ARCH-002 | Implement proper dependency injection for Mistral client configuration | P2 | 2025-05-07 | - | Open | Currently using singleton patterns in some places |

### Testing

| ID | Description | Priority | Created | Owner | Status | Notes |
|---|---|---|---|---|---|---|
| TEST-001 | Increase unit test coverage for json/extractors modules (currently at ~75%) | P1 | 2025-05-07 | - | Open | Focus on error handling paths |
| TEST-002 | Create end-to-end test suite with real-world document examples | P2 | 2025-05-07 | - | Open | Should include various check and receipt types |

### Performance

| ID | Description | Priority | Created | Owner | Status | Notes |
|---|---|---|---|---|---|---|
| PERF-001 | Optimize base64 encoding process for large images | P2 | 2025-05-07 | - | Open | Current implementation can be slow for images >5MB |
| PERF-002 | Implement request caching for repeated OCR operations | P2 | 2025-05-07 | - | Open | Would reduce API costs and improve performance |

### Security

| ID | Description | Priority | Created | Owner | Status | Notes |
|---|---|---|---|---|---|---|
| SEC-001 | Implement API key rotation mechanism | P1 | 2025-05-07 | - | Open | Should follow security best practices |
| SEC-002 | Add rate limiting to protect against DoS attacks | P2 | 2025-05-07 | - | Open | Consider using Cloudflare's built-in tools |

### Documentation

| ID | Description | Priority | Created | Owner | Status | Notes |
|---|---|---|---|---|---|---|
| DOC-001 | Create comprehensive API reference with Swagger/OpenAPI | P1 | 2025-05-07 | - | Open | Will help API consumers |
| DOC-002 | Add architecture diagrams to system-architecture.md | P2 | 2025-05-07 | - | Open | Use mermaid.js for maintainable diagrams in markdown |

### Code Quality

| ID | Description | Priority | Created | Owner | Status | Notes |
|---|---|---|---|---|---|---|
| CODE-001 | Migrate to TypeScript strict mode | P2 | 2025-05-07 | - | Open | Will improve type safety but requires significant refactoring |
| CODE-002 | Standardize error handling across the codebase | P1 | 2025-05-07 | - | Open | Current approach is inconsistent |

### DevOps

| ID | Description | Priority | Created | Owner | Status | Notes |
|---|---|---|---|---|---|---|
| OPS-001 | Set up continuous deployment pipeline for staging environment | P1 | 2025-05-07 | - | Open | Should run after test success on develop branch |
| OPS-002 | Implement automated canary deployments | P3 | 2025-05-07 | - | Open | Reduces risk in production deployments |

### Swift Libraries

| ID | Description | Priority | Created | Owner | Status | Notes |
|---|---|---|---|---|---|---|
| SWIFT-001 | Enhance Swift proxy library with comprehensive logging system | P2 | 2025-05-07 | - | Open | Would aid in client-side debugging |
| SWIFT-002 | Optimize NolockCapture for devices without LiDAR | P2 | 2025-05-07 | - | Open | Should have better fallback for older devices |

## In Progress Items

| ID | Description | Priority | Created | Owner | Status | Notes |
|---|---|---|---|---|---|---|
| DOC-003 | Create comprehensive guide for Git submodule management | P1 | 2025-05-07 | Claude | In Progress | Initial documentation created, needs review |

## Resolved Items

| ID | Description | Priority | Created | Resolved | Resolution |
|---|---|---|---|---|---|
| TOOL-001 | Create helper script for Git submodule management | P1 | 2025-05-07 | 2025-05-07 | Created submodule-helper.sh with interactive menu for common submodule operations |

## Notes on Technical Debt Management

- Review this document at the start of each sprint to identify items that should be addressed
- Consider dedicating a percentage of each sprint (e.g., 20%) to addressing technical debt
- When implementing new features, be aware of these items to avoid compounding technical debt
- Update this document when new technical debt is incurred due to expedient delivery needs

## References

- [Martin Fowler on Technical Debt](https://martinfowler.com/bliki/TechnicalDebt.html)
- [Technical Debt Quadrant](https://martinfowler.com/bliki/TechnicalDebtQuadrant.html)
- [Code Refactoring Guidelines](docs/code-refactoring-guidelines.md)