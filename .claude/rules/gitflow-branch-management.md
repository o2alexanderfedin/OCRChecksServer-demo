# Gitflow Branch Management Rules

## Problem Context

Inconsistent branch management practices can lead to loss of historical information and challenges in maintenance. Specifically:

- Deleting release branches after merging removes important historical snapshots
- Loss of released versions makes backporting fixes more difficult
- Breaks established branch structure and conventions in the repository

## Solution Approach

Follow these specific gitflow branch management rules for this repository:

1. **Release Branches Must Be Preserved**
   - Release branches (e.g., `release/1.12.0`, `release/1.12.1`) should NEVER be deleted
   - These branches represent historical snapshots of specific releases
   - They may be needed for:
     - Backporting critical fixes to specific versions
     - Understanding the exact state of a particular release
     - Maintaining long-term support for specific versions
   - Even after merging to main and develop, keep the release branches intact

2. **Feature Branches Lifecycle**
   - Feature branches can be deleted after they have been properly merged
   - Ensure merges happen in the correct order: feature → develop → release → main → develop
   - Before deleting, confirm the feature branch has been fully integrated into both main and develop

3. **Hotfix Branch Handling**
   - When creating hotfixes, branch from the appropriate release branch
   - Merge hotfixes back to both the release branch and develop
   - Maintain hotfix branches for historical reference

4. **Branch Naming Conventions**
   - Release branches: `release/x.y.z`
   - Feature branches: `feature/descriptive-name`
   - Hotfix branches: `hotfix/x.y.z-issue-description`

## Prevention Strategies

1. **Observe Repository Structure**
   - Before making branch management decisions, observe existing patterns
   - Note how branches are currently organized and maintained
   - Follow established conventions rather than imposing external practices

2. **Ask Before Deleting**
   - Never delete shared branches (main, develop, releases) without explicit approval
   - When unsure, ask for confirmation before deleting any branch

3. **Regularly Review Branch Structure**
   - Periodically examine the branch structure to ensure it remains organized
   - Clean up stale feature branches only after confirming they've been fully merged

## Related References

- [Gitflow Workflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow)
- [A Successful Git Branching Model](https://nvie.com/posts/a-successful-git-branching-model/)