# Gitflow Branch Management Rules

## Problem Context

Inconsistent branch management practices can lead to challenges in maintenance and conflicts with standard git flow workflows. Specifically:

- Not following standard git flow process can cause confusion
- Accumulating many release branches clutters the repository
- Historical information should be preserved with tags, not branches
- Standard git flow tools expect release branches to be temporary

## Solution Approach

Follow these specific gitflow branch management rules for this repository:

1. **Release Branches Are Temporary**
   - Release branches (e.g., `release/1.12.0`, `release/1.12.1`) should be deleted after completing the release
   - Release history is preserved through proper version tags
   - Release tags may be needed for:
     - Backporting critical fixes to specific versions
     - Understanding the exact state of a particular release
     - Maintaining long-term support for specific versions
   - After merging to main and develop, delete release branches both locally and remotely

2. **Standard Git Flow Process for Releases**
   - Start release branch: `git flow release start v1.xx.0`
   - Update version in package.json and CHANGELOG.md
   - Commit changes: `git add package.json CHANGELOG.md && git commit -m "chore: bump version to 1.xx.0 and update changelog"`
   - Finish release: `git flow release finish v1.xx.0` (this will merge to main, tag, merge back to develop, and delete the release branch)
   - Push all changes: `git push origin develop && git push origin main && git push --tags`

3. **Feature Branches Lifecycle**
   - Feature branches can be deleted after they have been properly merged
   - Ensure merges happen in the correct order: feature → develop → release → main → develop
   - Before deleting, confirm the feature branch has been fully integrated into both main and develop

4. **Hotfix Branch Handling**
   - When creating hotfixes, branch from main or the appropriate tag
   - Merge hotfixes back to both main and develop
   - Delete hotfix branches after they have been properly merged

5. **Branch Naming Conventions**
   - Release branches: `release/x.y.z` or `release/vx.y.z`
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