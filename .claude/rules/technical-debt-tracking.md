# Technical Debt Tracking Rule

This rule establishes guidelines for tracking and managing technical debt in our project.

## Problem Context

As the project evolves, we accumulate technical debt in various forms:
- Quick fixes that need proper solutions later
- Architecture decisions that need revisiting as requirements change
- Areas of code that need refactoring but aren't immediate priorities
- Known inefficiencies or limitations that should be addressed

Without a systematic approach to tracking these items:
- Issues are forgotten over time
- New team members aren't aware of known limitations
- Technical debt grows without visibility
- It's difficult to prioritize improvements

## Rule Statement

Team members MUST:

1. **Record Technical Debt Items**
   - Document all identified technical debt in the `.claude/TECHNICAL_DEBT.md` file
   - Categorize the item appropriately (Architecture, Testing, Performance, etc.)
   - Assign a unique identifier (e.g., A001 for Architecture item #1)
   - Include a clear description, priority, status, and resolution approach

2. **Update Status Regularly**
   - When beginning work on a technical debt item, mark it as "In Progress"
   - When completing work, mark it as "Resolved" with resolution details
   - Review and update the technical debt tracker at least monthly

3. **Reference in Code and Commit Messages**
   - When committing code that creates technical debt, reference the ID in the commit message
   - Add code comments with the technical debt ID where applicable
   - When resolving technical debt, reference the ID in the commit message

4. **Consider in Planning**
   - Review open technical debt items during sprint planning
   - Allocate time specifically for addressing high-priority technical debt
   - Consider technical debt impact when estimating new features

5. **Document Resolution Approaches**
   - Include specific approaches for resolving the debt
   - Document alternatives considered
   - Provide links to relevant documentation or research

## Violation Consequences

Failure to follow this rule results in:
- Accumulation of unknown or forgotten technical debt
- Reduced development velocity over time
- Increased bugs and system instability
- Difficulty onboarding new team members
- Challenges in planning and estimating future work

## Resolution Strategies

If technical debt tracking has been neglected:
1. Schedule a technical debt discovery session with the team
2. Create entries for all identified items
3. Establish regular review cadence

## Related Resources

- [Technical Debt Tracker](./../TECHNICAL_DEBT.md)
- [Continuous Improvement Rule](./continuous-improvement.md)
- [Post-Mortem Template](./../templates/post-mortem.md)