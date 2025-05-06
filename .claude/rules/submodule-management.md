# Git Submodule Management Rule

This rule establishes best practices for working with Git submodules in our codebase.

## Problem Context

Git submodules introduce complexity in repository management, particularly when:
- Multiple team members work on both main and submodule repositories
- Changes need to be coordinated across repositories
- Merge conflicts arise involving submodule references
- GitFlow processes need to integrate with submodule changes

## Rule Statement

When working with submodules in this project, developers MUST:

1. **Use the Submodule Helper Script for Complex Operations**
   - The script at `./scripts/submodule-helper.sh` automates common submodule tasks
   - For quick tasks, manual git commands may be used, but the helper is preferred

2. **Follow the Two-Step Commit Process**
   - First commit changes within the submodule repository
   - Then commit the reference changes in the main repository

3. **Push in the Correct Sequence**
   - Always push submodule changes before pushing the main repository
   - Failure to do this will cause reference errors for other developers

4. **Update Submodules After Pulling**
   - Run `git submodule update --recursive` after pulling changes
   - Or use the helper script's update function

5. **Create Corresponding Feature Branches**
   - When creating a feature branch in the main repo that requires submodule changes
   - Create matching feature branches in affected submodules

6. **Resolve Conflicts Carefully**
   - Submodule conflicts must be resolved with special attention
   - Follow the conflict resolution steps in the git-submodule-guide.md documentation
   - When in doubt, use the "fix broken submodule" procedure in the guide

7. **Document New Submodules**
   - Update the git-submodule-guide.md to include any new submodules
   - Include details on purpose, branch structure, and special considerations

## Violation Consequences

Failure to follow these rules may result in:
- Broken builds when submodule references point to non-existent commits
- Complex merge conflicts that are difficult to resolve
- Loss of work if submodule changes aren't properly committed or pushed
- Project-wide development delays

## Resolution Strategies

If submodule issues occur:
1. Use the cleanup procedures in git-submodule-guide.md
2. In extreme cases, consider re-cloning the repository with fresh submodules
3. Document the issue and resolution in a post-mortem

## Related Resources

- [Git Submodule Guide](../../docs/git-submodule-guide.md)
- [Submodule Helper Script](../../scripts/submodule-helper.sh)
- [Git Submodule Documentation](https://git-scm.com/book/en/v2/Git-Tools-Submodules)