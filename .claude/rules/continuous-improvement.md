# Continuous Improvement Rule

This rule establishes guidelines for continuous improvement of our tools, documentation, and processes.

## Problem Context

Software development tools, scripts, and documentation naturally degrade over time if not regularly updated based on real-world experience. Issues we've encountered include:

- Documentation becoming outdated as processes evolve
- Helper scripts that don't address common pain points
- Knowledge siloing when solutions to complex problems aren't shared
- Repeating the same mistakes because lessons learned aren't documented
- Inefficient workflows that could be automated

## Rule Statement

To maintain high-quality tools and documentation, team members MUST:

1. **Update Documentation When Facing Challenges**
   - When you encounter difficulty understanding or following a documented process
   - Immediately update the relevant documentation with clarifications
   - Add common pitfalls and their solutions

2. **Enhance Helper Scripts Based on Experience**
   - When you identify repetitive or error-prone tasks
   - Extend existing helper scripts or create new ones to automate them
   - Document the script's purpose and usage in both code comments and README files

3. **Create Rules for Recurring Problems**
   - When team members repeatedly encounter the same issues
   - Create a new rule file in .claude/rules/ with a descriptive name
   - Include problem context, solution approach, and prevention strategies

4. **Document Lessons in Post-Mortems**
   - After resolving complex issues, create a post-mortem in .claude/post-mortems/
   - Extract reusable lessons and update or create rule files accordingly
   - Link relevant post-mortems in related documentation

5. **Track Technical Debt Systematically**
   - Record technical debt items in .claude/TECHNICAL_DEBT.md
   - Include priority levels and potential resolution approaches
   - Update the status of items as they're addressed

6. **Cross-Reference Related Materials**
   - When creating or updating documentation or rules
   - Add references to related materials (other docs, scripts, etc.)
   - Ensure a complete knowledge path is available for future developers

## Violation Consequences

Failure to follow this rule leads to:
- Increased onboarding time for new team members
- Repeated mistakes and inefficiencies
- Knowledge loss when team members transition
- Frustration with outdated or misleading documentation
- Missed opportunities for process improvement

## Resolution Strategies

If you notice outdated or incomplete documentation/tools:
1. Update it immediately as part of your current task
2. Create a technical debt item if a more thorough update is needed
3. Communicate the changes to the team

## Related Resources

- [Technical Debt Tracking](./../TECHNICAL_DEBT.md)
- [Post-Mortem Template](./../templates/post-mortem.md)
- [Software Problem Solving](./software-problem-solving.md)