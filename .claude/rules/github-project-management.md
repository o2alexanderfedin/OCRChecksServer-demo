# GitHub Project Management Best Practices

## Overview

This document establishes best practices for creating and managing GitHub Projects v2 for software development projects, based on lessons learned from implementing the CloudflareLlama33JsonExtractor project structure.

## Project Setup Requirements

### 1. Repository-Project Ownership Alignment

**Problem**: GitHub Projects v2 can only be linked to repositories owned by the same entity.

**Solution**:
- Create projects under the same organization/user that owns the repository
- Use `gh project create --owner "organization-name"` for organization repositories
- Verify ownership before attempting to link with `linkProjectV2ToRepository` mutation

**Implementation**:
```bash
# ✅ Correct - Organization project for organization repository
gh project create --owner "organization-name" --title "Project Name"

# ❌ Incorrect - Personal project for organization repository  
gh project create --owner "@me" --title "Project Name"
```

### 2. Issue Creation and Conversion Workflow

**Best Practice**: Use draft issues first, then convert to real issues for proper GitHub integration.

**Workflow**:
1. Create GitHub Project v2
2. Add draft issues using `gh project item-create`
3. Convert drafts to real issues using `convertProjectV2DraftIssueItemToIssue` mutation
4. Link project to repository using `linkProjectV2ToRepository` mutation

**Example**:
```graphql
mutation {
  convertProjectV2DraftIssueItemToIssue(input: {
    itemId: "PVTI_xxx"
    repositoryId: "R_xxx"
  }) {
    item {
      content {
        ... on Issue {
          id
          number
          title
        }
      }
    }
  }
}
```

## Issue Hierarchy and Structure

### 3. Three-Tier Issue Hierarchy

**Structure**:
- **Epic** (Feature type): High-level business objective or architectural change
- **User Stories** (Feature type): User-focused requirements that deliver value
- **Engineering Tasks** (Task type): Technical implementation work (1-2 hour scope)

**Parent-Child Relationships**:
- Use GitHub's native sub-issues API with `addSubIssue` mutation
- Requires `GraphQL-Features: sub_issues` header
- Epic → User Stories → Engineering Tasks

**Example**:
```graphql
mutation {
  addSubIssue(input: {
    issueId: "I_epicId"
    subIssueId: "I_userStoryId"
  }) {
    issue {
      title
    }
    subIssue {
      title
    }
  }
}
```

### 4. Issue Type Assignment

**Required Setup**:
- Epic and User Stories: Set as "Feature" type using `updateIssueIssueType`
- Engineering Tasks: Set as "Task" type using `updateIssueIssueType`

**Rationale**:
- Features represent user-facing value
- Tasks represent internal technical work

## Field Management Standards

### 5. Priority Field Configuration

**Required Options**:
- **Critical**: Must be completed immediately (RED)
- **High**: Important and should be completed soon (ORANGE)  
- **Medium**: Normal priority (YELLOW)
- **Low**: Can be completed when time allows (GRAY)

**Assignment Logic**:
- Critical: Core implementation that everything depends on
- High: Foundational utilities needed by main implementation
- Medium: Configuration and integration work
- Low: Testing and validation work

### 6. Story Points Field Configuration

**Fibonacci Scale Options**:
- **1 point**: Very small (< 30 minutes) - GREEN
- **2 points**: Small (30-60 minutes) - GREEN
- **3 points**: Medium (1-2 hours) - YELLOW
- **5 points**: Large (2-4 hours) - ORANGE
- **8 points**: Very large (4-8 hours) - RED
- **13 points**: Extra large (>8 hours, should be split) - PURPLE

**Hierarchical Point Assignment**:
- **Engineering Tasks**: Base effort estimates (typically 3 points for 1-2 hour scope)
- **User Stories**: Sum of child engineering task points
- **Epic**: Sum of all user story points (use closest Fibonacci number)

**Example Calculation**:
```
Epic (13 points)
├── User Story 1 (3 points)
│   └── Engineering Task 1 (3 points)
├── User Story 2 (3 points)  
│   └── Engineering Task 2 (3 points)
└── User Story 3 (5 points)
    ├── Engineering Task 3 (3 points)
    └── Engineering Task 4 (3 points → closest to 6 is 5)
```

## Task Requirements Documentation

### 7. Mandatory Task Requirements

**Every Engineering Task Must Include**:
- **GitFlow Requirement**: "Must be executed in GitFlow feature branch scope"
- **TDD Process**: "Must follow TDD (Test-Driven Development) process"
- **Pair Programming**: "Must simulate pair programming (implementer + observer roles)"
- **Code Quality**: "Must apply SOLID, KISS, DRY principles in both implementation and tests"
- **Time Scope**: "Task scope: 1-2 hours"
- **Effort Estimate**: "Estimated effort: X.X hours"

**File Reference Requirements**:
- **Files to Create/Modify**: Explicit list of new and modified files
- **Reference Files**: Existing files to study for patterns and integration
- **Dependencies**: Other tasks that must be completed first

### 8. Architecture Documentation Integration

**Required References**:
- Link to technical architecture documents
- Reference to design validation documents (SOLID/KISS/DRY analysis)
- Point to existing implementation patterns
- Include DI container configuration files

**Example**:
```markdown
Files to Reference:
- Interface: src/json/types.ts:JsonExtractor
- Existing implementation: src/json/mistral.ts
- Architecture: docs/features/json-extraction/cloudflare-json-extractor-design.md
- DI container: src/di/container.ts
```

## API Usage Guidelines

### 9. GraphQL API Best Practices

**Required Headers**:
- Use `GraphQL-Features: sub_issues` for sub-issue operations
- Authenticate properly for organization repositories

**Field Creation**:
- Add descriptions to single-select options for clarity
- Use semantic colors (RED for critical, GREEN for small tasks, etc.)
- Validate field names aren't reserved (avoid "Type", use "Item Type")

**Batch Operations**:
- Use mutation aliases for multiple operations in single request
- Handle rate limiting appropriately
- Verify mutations with return field validation

### 10. Error Handling and Validation

**Common Issues and Solutions**:
- **Ownership Errors**: Verify project and repository have same owner
- **Field Validation**: Check required fields before mutation attempts
- **ID Management**: Use correct ID types (Issue IDs vs Project Item IDs)
- **Permission Issues**: Ensure appropriate access levels for organization projects

## Continuous Improvement Process

### 11. Documentation Maintenance

**When to Update This Document**:
- New GitHub Projects v2 features become available
- API changes affect established workflows
- Team feedback identifies process improvements
- Project management anti-patterns are discovered

**Update Process**:
1. Create GitFlow feature branch for documentation updates
2. Test changes with small-scale project implementation
3. Validate with team review process
4. Update CLAUDE.md to reference new guidelines
5. Create examples in `.claude/examples/` directory if complex

## Implementation Checklist

### 12. Project Setup Verification

- [ ] Project created under correct organization/user
- [ ] Repository linked successfully
- [ ] Priority field created with standard options
- [ ] Story Points field created with Fibonacci scale
- [ ] All issues converted from drafts to real issues
- [ ] Issue types assigned (Feature/Task)
- [ ] Parent-child relationships established
- [ ] Priorities assigned based on dependencies
- [ ] Story points calculated hierarchically
- [ ] All engineering tasks include mandatory requirements
- [ ] Architecture documentation properly referenced

## Related Documentation

- [GitFlow Branch Management](./.claude/rules/gitflow-branch-management.md)
- [Continuous Improvement](./.claude/rules/continuous-improvement.md)
- [Technical Debt Tracking](./.claude/rules/technical-debt-tracking.md)

## Examples

Reference implementation: CloudflareLlama33JsonExtractor Epic
- Project URL: https://github.com/orgs/nolock-social/projects/1
- Architecture Docs: docs/features/json-extraction/
- Total Effort: 43 story points across 12 issues with proper hierarchy