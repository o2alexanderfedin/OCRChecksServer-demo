# Kanban Execution Flow for GitHub Projects v2

## Overview

This document defines the execution flow and task selection criteria for implementing software projects using Kanban methodology with GitHub Projects v2.

## Status Field Configuration

### Current Status Options
- **Todo**: Ready to start, all dependencies met
- **In Progress**: Currently being worked on
- **Done**: Completed and verified

### Recommended Enhanced Status Options
For better Kanban flow visibility, consider adding:
- **Blocked**: Waiting for dependencies or external factors
- **Ready for Review**: Implementation complete, awaiting review
- **In Testing**: Being validated/tested

## Kanban Board Columns and Criteria

### 1. Todo (Backlog)
**Criteria for items in Todo:**
- All dependencies are in "Done" status
- Requirements are clearly defined
- Acceptance criteria are documented
- Story points are assigned
- Priority is set

**Entry Criteria:**
- Issue created with all mandatory requirements
- Parent issue (if any) is in progress or done
- Dependencies identified and tracked

### 2. In Progress (WIP)
**WIP Limits:**
- **Engineering Tasks**: 1 item per developer (focus on single task)
- **User Stories**: 2 items max (allows for coordination tasks)
- **Epic**: 1 item (coordination and planning)

**Criteria for moving to In Progress:**
- Developer assigned
- GitFlow feature branch created
- Dependencies met or in parallel progress
- Clear definition of done established

**Work Process:**
1. Create GitFlow feature branch
2. Write failing tests (TDD Red phase)
3. Implement minimal solution (TDD Green phase)
4. Refactor and optimize (TDD Refactor phase)
5. Ensure SOLID, KISS, DRY principles
6. Pair programming sessions conducted

### 3. Done
**Definition of Done Criteria:**
- All tests pass (unit, integration, e2e where applicable)
- Code follows SOLID, KISS, DRY principles
- GitFlow feature merged to develop
- Documentation updated
- Acceptance criteria met
- No critical issues or technical debt introduced

## Task Selection Algorithm

### Priority-Based Selection Matrix

| Priority | Dependencies Met | Story Points | Selection Order |
|----------|------------------|--------------|-----------------|
| Critical | ✅ Yes | Any | 1st (Immediate) |
| High | ✅ Yes | 1-3 | 2nd |
| High | ✅ Yes | 5+ | 3rd (requires planning) |
| Medium | ✅ Yes | 1-3 | 4th |
| Critical | ❌ No | Any | 5th (work on dependencies) |
| Medium | ✅ Yes | 5+ | 6th |
| Low | ✅ Yes | Any | 7th |
| Any | ❌ No | Any | Last (blocked) |

### Dependency-Driven Selection Rules

**Rule 1: Foundation First**
```
1. Start with utilities and shared components
2. Then core implementation
3. Then integration (DI configuration, factory pattern)
4. Finally validation (testing, benchmarking)
```

**Rule 2: Parallel Work Opportunities**
- Utility components can be developed in parallel with each other
- Performance benchmarking can start once core implementation is done
- End-to-end tests can be developed in parallel with integration work

**Rule 3: Blocking Prevention**
- Never start a task if its dependencies are not at least "In Progress"
- Always check parent issue status before starting child tasks
- Prioritize unblocking other tasks over starting new work

## Execution Flow Phases

### Phase 1: Foundation (Weeks 1-2)
**Goal**: Build shared utilities and core components

**Execution Order:**
1. **Utility Component A**: Extract shared utility (3 points, High)
2. **Utility Component B**: Extract shared utility (3 points, High)
3. **Core Implementation**: Main feature implementation (3 points, Critical)

**Status Transitions:**
```
Todo → In Progress → Done
```

**Parallel Work:**
- Utility components can be worked on simultaneously by different developers
- Core implementation waits for utilities to reach "In Progress" or "Done"

### Phase 2: Integration (Week 3)
**Goal**: Configure dependency injection and factory patterns

**Execution Order:**
1. **Configuration Task**: Configure DI container (3 points, Medium)
2. **Pattern Implementation**: Create factory pattern (3 points, Medium)

**Dependencies:**
- Both require core implementation to be "Done"
- Can be worked on in parallel

### Phase 3: Validation (Week 4)
**Goal**: Comprehensive testing and performance validation

**Execution Order:**
1. **Performance Task**: Performance benchmarking (3 points, Low)
2. **Testing Task**: End-to-end integration tests (3 points, Low)

**Dependencies:**
- Both require configuration and pattern implementation to be "Done"
- Can be worked on in parallel

## Daily Kanban Practices

### Daily Standup Questions
1. **What did I complete yesterday?** (move to Done)
2. **What am I working on today?** (keep in In Progress)
3. **What's blocking me?** (identify dependencies, move to Blocked if needed)
4. **What can I start next?** (apply selection algorithm)

### Board Updates
- **Morning**: Review and update status based on work completed
- **During work**: Move items as they progress through phases
- **End of day**: Update with current reality, note any blockers

### WIP Limit Enforcement
- **Before starting new work**: Check WIP limits
- **If at limit**: Focus on moving current work to Done
- **If blocked**: Help unblock others or work on different priority items

## Metrics and Flow Optimization

### Key Kanban Metrics

**Lead Time**: Time from Todo to Done
- **Target**: 2-3 days for 3-point engineering tasks
- **Target**: 5-7 days for user stories
- **Target**: 2-3 weeks for epic

**Cycle Time**: Time from In Progress to Done
- **Target**: 1-2 days for engineering tasks
- **Target**: 3-5 days for user stories

**Throughput**: Items completed per week
- **Target**: 2-3 engineering tasks per developer per week

**Work In Progress**: Active items per person
- **Target**: 1 engineering task per developer

### Flow Efficiency Indicators

**Blocked Time Percentage**
- **Good**: <10% of total time
- **Concerning**: >20% of total time
- **Action**: Review dependencies and planning process

**Rework Rate**
- **Good**: <5% of tasks require significant rework
- **Concerning**: >15% require rework
- **Action**: Improve definition of done and review process

## Advanced Selection Strategies

### When Multiple Items Have Same Priority

**Tie-Breaking Criteria (in order):**
1. **Dependency impact**: Choose items that unblock most other work
2. **Story points**: Prefer smaller items for faster feedback
3. **Risk level**: Choose less risky items when uncertain
4. **Team capacity**: Match to available developer skills
5. **Customer value**: Prefer user-facing functionality

### Handling Blocked Items

**Immediate Actions:**
1. **Identify blocker**: Update issue with specific blocking condition
2. **Move to Blocked status**: Make visible on board
3. **Work on blocker**: Switch to resolving dependency
4. **Communicate**: Update team on impact and timeline

**Escalation Process:**
- **Same day**: Try to resolve within team
- **Next day**: Escalate to project lead
- **3+ days**: Consider alternative approaches or scope changes

### Context Switching Management

**Minimize Context Switching:**
- Complete current task before starting new one
- Batch similar types of work (all testing tasks together)
- Limit active branches per developer

**When Context Switching is Necessary:**
- Document current state thoroughly
- Create detailed handoff notes
- Update issue with current progress
- Set clear restart criteria

## Integration with GitFlow

### Status-Branch Alignment

**Todo Status:**
- No branch exists yet
- Planning and preparation phase

**In Progress Status:**
- Feature branch created: `feature/task-description`
- Active development occurring
- Regular commits and pushes

**Done Status:**
- Feature branch merged to develop
- Branch cleaned up locally
- All acceptance criteria verified

### Branch Naming Convention
```
feature/issue-{number}-{short-description}
```

Examples:
- `feature/issue-6-extract-utility-component`
- `feature/issue-8-implement-core-feature`

## Quality Gates

### Before Moving to In Progress
- [ ] Dependencies identified and tracked
- [ ] Acceptance criteria defined
- [ ] Test approach planned
- [ ] Time estimate validated

### Before Moving to Done
- [ ] All tests pass
- [ ] Code review completed
- [ ] Documentation updated
- [ ] GitFlow process completed
- [ ] No new technical debt introduced

### Epic Completion Criteria
- [ ] All user stories completed
- [ ] Integration testing passed
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] Ready for production deployment

## Troubleshooting Common Flow Issues

### Issue: Items stuck in In Progress
**Symptoms**: Tasks remain in progress for >3 days
**Causes**: Scope creep, unclear requirements, technical obstacles
**Solutions**: Break down into smaller tasks, pair programming, seek help

### Issue: Too many blocked items
**Symptoms**: >30% of backlog is blocked
**Causes**: Poor dependency planning, external dependencies
**Solutions**: Improve planning process, identify alternatives, escalate blockers

### Issue: Low throughput
**Symptoms**: <1 task completed per developer per week
**Causes**: Large task sizes, context switching, technical debt
**Solutions**: Break down tasks, enforce WIP limits, address technical debt

## Related Documentation

- [GitHub Project Management](./.claude/rules/github-project-management.md)
- [GitFlow Branch Management](./.claude/rules/gitflow-branch-management.md)
- [Technical Debt Tracking](./.claude/rules/technical-debt-tracking.md)

## Example Application

**Sample Project Structure**:
- **Total effort**: 43 story points
- **Estimated duration**: 4 weeks (3 developers)
- **First task**: Extract utility components
- **Critical path**: Utilities → Core → Integration → Validation