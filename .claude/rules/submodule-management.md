# Git Submodule Management Rule

## Problem Context

Working with Git submodules introduces multiple steps and potential pitfalls that can lead to broken references, missed commits, and integration problems. Common issues include:

- Forgetting to push submodule changes before pushing the main repository
- Working with detached HEAD state in submodules
- Submodule references pointing to commits that don't exist in remote repositories
- Accidental modification of submodule files without proper branching
- Incorrect GitFlow process when dealing with submodules

## Solution Approach

### Always Use the Submodule Helper Script

IMPORTANT: Whenever working with submodules in this repository, use the provided helper script:

```bash
./scripts/submodule-helper.sh
```

This interactive script automates and guides through the proper sequence of operations for various submodule tasks.

### Key Principles

1. **Two-Step Commit Process** 
   - First commit changes within the submodule
   - Then commit the updated submodule reference in the main repository

2. **Push Sequence Matters**
   - Always push submodule changes before pushing the main repository
   - Use the "Complete workflow" option in the helper script to automate this sequence

3. **Proper Branch Management**
   - Create dedicated branches for submodule changes
   - When using GitFlow, create corresponding feature branches in both main repo and submodules

4. **Regular Status Checks**
   - Use the "Check submodule status" option regularly
   - Review submodule status before finalizing PRs

## Prevention Strategies

1. **Automate Where Possible**
   - Use the helper script for all submodule operations
   - Let the script handle the proper sequence of operations

2. **One Task at a Time**
   - Complete one submodule task before starting another
   - Avoid working on multiple submodules simultaneously

3. **Clear Communication**
   - Document submodule changes clearly in commit messages
   - Alert team members when making significant submodule changes

4. **Regular Verification**
   - Regularly check submodule status with the helper script
   - Verify submodule references point to accessible commits

## Example Workflows

### Adding a Feature That Spans Main Repository and Submodules

```bash
# 1. Create feature branch in main repository
git flow feature start new-feature

# 2. Use helper script to manage submodule operations
./scripts/submodule-helper.sh
# Select options for:
# - Checking submodule status
# - Making changes in submodules (which includes creating branches)
# - Committing changes in correct sequence
# - Pushing in correct sequence

# 3. Finish the feature with GitFlow
git flow feature finish new-feature
```

### Updating Submodules to Latest Commits

```bash
# Use helper script for a simplified process
./scripts/submodule-helper.sh
# Select "Update all submodules" option
# Follow by "Push main repository" to update references
```

## Reference Documentation

For more detailed information, refer to these project-specific resources:

- [Git Submodule Guide](../docs/git-submodule-guide.md) - Comprehensive documentation
- [Swift Submodule Guide](../docs/swift-submodule-guide.md) - Swift-specific guidance
- [NolockCapture Guide](../docs/nolock-capture-guide.md) - NolockCapture package details