# Project Status Management Rules

## Overview

This rule establishes strict guidelines for managing GitHub project issue statuses to maintain hierarchical consistency and accurately reflect implementation reality.

## The Problem

On 2025-06-07, during CloudflareLlama33JsonExtractor implementation, parent issues (Epic #1, User Stories #4, #5) were incorrectly marked as "Done" while their child dependencies (Issues #10, #11, #12) remained "Todo". This created logical inconsistencies and misrepresented project completion status.

## Core Principles

### 1. Hierarchical Dependency Rule
**Parent issues CANNOT be marked "Done" if ANY child dependency is incomplete.**

```
Epic (Parent)
├── User Story A ✅ Done (all children complete)
├── User Story B 🔄 In Progress (some children incomplete)
│   ├── Task B1 ✅ Done
│   ├── Task B2 ❌ Todo  ← Blocks parent completion
│   └── Task B3 ✅ Done
└── User Story C 📋 Todo (not started)
```

**Result**: Epic must be "In Progress" because User Story B and C are incomplete.

### 2. Status Inheritance Rule
Child task status determines parent status:
- **Done**: All children must be "Done"
- **In Progress**: At least one child is "Done" or "In Progress", others may be "Todo"
- **Todo**: All children are "Todo" or not yet created

### 3. Implementation Verification Rule
**Status must match actual code implementation, not planned work.**

Before marking any issue as "Done":
1. ✅ Verify the code exists in the repository
2. ✅ Verify all tests pass for that functionality
3. ✅ Verify all acceptance criteria are met
4. ✅ Verify all child dependencies are complete

## Status Definitions

### ✅ Done
- **Code**: Feature is fully implemented and merged
- **Tests**: All tests pass, including new tests for the feature
- **Dependencies**: ALL child tasks are marked "Done"
- **Quality**: Code follows project standards (SOLID, KISS, DRY)
- **Documentation**: Required documentation is complete

### 🔄 In Progress
- **Code**: Implementation has started
- **Dependencies**: Some child tasks are "Done", others remain "Todo"
- **Epic/User Story**: Has at least one completed child task
- **Engineering Task**: Work is actively being performed

### 📋 Todo
- **Code**: No implementation exists yet
- **Dependencies**: May have prerequisites that need completion first
- **Planning**: Requirements and scope are defined

## Verification Process

### Before Updating Status to "Done"

1. **Code Verification**:
   ```bash
   # Verify file exists and has expected functionality
   ls -la src/path/to/feature.ts
   grep -r "FeatureName" src/
   ```

2. **Test Verification**:
   ```bash
   # Run specific tests for the feature
   npm test -- --grep "FeatureName"
   # Verify test coverage
   npm run test:coverage
   ```

3. **Dependency Verification**:
   ```bash
   # Check all child issues via GitHub API
   gh api graphql -f query='...' | jq '...'
   ```

4. **Integration Verification**:
   ```bash
   # Verify feature works end-to-end
   npm run test:integration
   ```

### Status Update Script Template

```bash
#!/bin/bash
# Always verify dependencies before updating parent status

verify_issue_complete() {
    local issue_number=$1
    echo "Verifying Issue #$issue_number completion..."
    
    # Check code implementation
    # Check test coverage
    # Check child dependencies
    # Return true/false
}

update_parent_only_if_children_complete() {
    local parent_issue=$1
    local child_issues=("${@:2}")
    
    for child in "${child_issues[@]}"; do
        if ! verify_issue_complete "$child"; then
            echo "❌ Cannot mark Issue #$parent_issue as Done - Issue #$child incomplete"
            return 1
        fi
    done
    
    echo "✅ All children complete, updating parent Issue #$parent_issue"
    # Update parent status
}
```

## Common Anti-Patterns to Avoid

### ❌ Don't: Mark Parent Done with Incomplete Children
```
Epic #1: "Done" ❌
├── User Story #4: "Done" ❌
│   ├── Task #8: "Done" ✅
│   └── Task #11: "Todo" ❌  ← Breaks hierarchy
```

### ❌ Don't: Assume Optional Tasks Don't Block Parents
```
User Story: "Add Feature X" - "Done" ❌
├── Core Implementation: "Done" ✅
└── Performance Tests: "Todo" ❌  ← Still blocks completion
```

### ❌ Don't: Update Status Without Code Verification
```bash
# Wrong approach
gh project item update --status "Done"  # Without checking code
```

### ✅ Do: Maintain Consistent Hierarchy
```
Epic #1: "In Progress" ✅
├── User Story #2: "Done" ✅ (all children complete)
├── User Story #4: "In Progress" ✅ (some children incomplete)
│   ├── Task #8: "Done" ✅
│   └── Task #11: "Todo" ✅
```

## Implementation Checklist

When updating project statuses:

- [ ] List all child dependencies for each parent issue
- [ ] Verify code implementation exists for each "Done" issue
- [ ] Check that all tests pass for completed features
- [ ] Ensure parent status reflects most restrictive child status
- [ ] Document reasoning for status changes
- [ ] Use verification scripts, not manual assumptions

## Recovery Process

When status inconsistencies are discovered:

1. **Audit Current Status**:
   ```bash
   # Get all issues with status and dependencies
   ./scripts/audit-project-status.sh
   ```

2. **Identify Inconsistencies**:
   - Parents marked "Done" with "Todo" children
   - Issues marked "Done" without code implementation
   - Missing test coverage for "Done" issues

3. **Correct Status Bottom-Up**:
   - Start with engineering tasks (leaf nodes)
   - Move up to user stories
   - Finally update epics

4. **Verify Corrections**:
   - Run verification scripts
   - Check project board consistency
   - Document changes made

## Tools and Scripts

### Status Verification Script
```bash
./scripts/verify-project-status.sh
# Checks all issues against actual implementation
```

### Dependency Checker
```bash
./scripts/check-dependencies.sh <issue_number>
# Verifies all child dependencies are complete
```

### Status Corrector
```bash
./scripts/fix-project-status.sh
# Corrects inconsistent statuses based on dependencies
```

## Success Criteria

A well-managed project status board should:
- ✅ Show realistic completion percentage
- ✅ Allow accurate project planning and estimates
- ✅ Reflect actual development progress
- ✅ Maintain stakeholder trust through accurate reporting
- ✅ Enable effective sprint planning and resource allocation

## References

- [GitHub Projects v2 GraphQL API](https://docs.github.com/en/graphql/guides/forming-calls-with-graphql)
- [Agile Project Management Best Practices](https://www.atlassian.com/agile/project-management)
- [GitFlow Branch Management](./.claude/rules/gitflow-branch-management.md)

## Maintenance

This rule should be:
- Reviewed quarterly for effectiveness
- Updated when project management tools change
- Referenced during sprint planning and retrospectives
- Used to train new team members on status management

---

**Created**: 2025-06-07  
**Last Updated**: 2025-06-07  
**Next Review**: 2025-09-07