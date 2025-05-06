# Technical Debt Tracking Rule

## Problem Context

Software development often involves making trade-offs between immediate delivery and long-term code quality. When time constraints require expedient solutions, technical debt accumulates. Additionally, during development, teams often identify improvements that cannot be immediately implemented.

Without a systematic approach to tracking this technical debt:
- Important improvements are forgotten
- The same issues are repeatedly discovered and rediscovered
- Technical debt compounds silently until it becomes unmanageable
- There's no visibility into the "hidden costs" of the codebase
- Prioritization becomes difficult without a consolidated view

## Solution Approach

### Essential Rule: Maintain a Persistent Technical Debt Tracker

**IMPORTANT**: All identified technical debt, potential improvements, and "TODO" items that cannot be immediately addressed MUST be documented in the central Technical Debt Tracking document.

The document is located at:
```
.claude/TECHNICAL_DEBT.md
```

### Implementation Process

1. **When to Add Items**
   - During code reviews when issues are noticed but fixing is out of scope
   - When implementing expedient solutions due to time constraints
   - When discovering improvements that aren't part of the current work
   - When identifying future enhancements during technical discussions

2. **How to Add Items**
   - Add to the appropriate section in TECHNICAL_DEBT.md
   - Include a unique identifier (e.g., CODE-001, PERF-002)
   - Provide a clear description of the issue
   - Assign an appropriate priority level
   - Document the creation date
   - Add any relevant contextual notes

3. **Assigning Priority Levels**
   - **P0 (Critical)**: Serious issues requiring immediate attention
   - **P1 (High)**: Important issues to address in next 1-2 cycles
   - **P2 (Medium)**: Should be addressed when resources permit
   - **P3 (Low)**: Nice-to-have improvements

4. **Update Status Regularly**
   - Move items to "In Progress" when work begins
   - Add owner information when someone takes responsibility
   - Move to "Resolved" with resolution details when complete

## Application Examples

### Example 1: Expedient Implementation

```
When implementing feature X, you choose to use a simpler but less efficient algorithm due to time constraints.

Action: Add to TECHNICAL_DEBT.md under "Performance" section
PERF-003 | Optimize algorithm in feature X processing | P2 | 2025-05-07 | - | Open | Current implementation has O(n²) complexity, should be O(n log n)
```

### Example 2: Discovered Improvement Opportunity

```
While working on the API, you notice that error responses lack standardization.

Action: Add to TECHNICAL_DEBT.md under "Code Quality" section
CODE-003 | Standardize API error response format | P1 | 2025-05-07 | - | Open | Currently inconsistent between endpoints, should follow RFC7807
```

### Example 3: Required Refactoring

```
You notice the codebase has significant duplication in validation logic.

Action: Add to TECHNICAL_DEBT.md under "Architecture" section
ARCH-003 | Extract common validation logic to shared module | P2 | 2025-05-07 | - | Open | Currently duplicated across 5+ files
```

## Prevention Strategies

To ensure effective technical debt management:

1. **Regular Reviews**
   - Review the Technical Debt document at the start of each sprint
   - Incorporate high-priority items into sprint planning

2. **Allocation Strategy**
   - Dedicate a consistent percentage of development time (e.g., 20%) to addressing technical debt
   - Address debt related to areas being actively developed

3. **Clear Communication**
   - Discuss significant technical debt items in team meetings
   - Ensure management understands the impact of accumulated debt

4. **Avoiding Accumulation**
   - When adding new technical debt, consider if it can be avoided
   - Document the rationale for accepting the debt

## Benefits

This systematic tracking approach:
- Prevents important improvements from being forgotten
- Provides visibility into the "hidden costs" in the codebase
- Enables informed prioritization of refactoring efforts
- Creates accountability for technical quality
- Balances immediate delivery needs with long-term sustainability

## Reference

For the technical debt tracking document and current items, see:
- [Technical Debt Tracker](./.claude/TECHNICAL_DEBT.md) - The central tracking document