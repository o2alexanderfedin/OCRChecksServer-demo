# Git Submodule Management Guide

This guide explains how to work with Git submodules in the OCRChecksServer project. We use submodules to maintain separate repositories for our Swift components while keeping them integrated with the main project.

## Current Submodules

Our project includes the following submodules:

1. **swift-proxy** - The Swift client for the OCR API (NolockOCR)
2. **nolock-capture** - The Swift package for document capture (NolockCapture)
3. **auth-service** - Experimental authentication and authorization for Cloudflare Workers

## Submodule Helper Script

We've created a helper script to simplify submodule operations. You can run it with:

```bash
./scripts/submodule-helper.sh
```

This interactive script provides options for common submodule tasks like updating, committing, and pushing changes.

## Manual Submodule Operations

If you prefer to manage submodules manually, here are the essential commands:

### Initial Setup

When you first clone the repository, you need to initialize the submodules:

```bash
git clone --recurse-submodules https://github.com/o2alexanderfedin/OCRChecksServer.git

# Or if you've already cloned without submodules:
git submodule update --init --recursive
```

### Updating Submodules

To update submodules to their latest commits:

```bash
git submodule update --remote --merge
```

### Making Changes to Submodules

When making changes to a submodule, you need to:

1. **Enter the submodule directory**:
   ```bash
   cd swift-proxy  # or nolock-capture
   ```

2. **Make sure you're on a branch** (submodules are often in detached HEAD state):
   ```bash
   git checkout main  # or another branch
   ```

3. **Make and commit your changes**:
   ```bash
   # Make your changes...
   git add .
   git commit -m "Your changes in the submodule"
   ```

4. **Return to the main repository and update the reference**:
   ```bash
   cd ..
   git add swift-proxy  # commits the updated submodule reference
   git commit -m "Update swift-proxy submodule reference"
   ```

### Pushing Changes

When pushing changes that include submodule updates:

1. **Push submodule changes first**:
   ```bash
   cd swift-proxy
   git push
   cd ..
   ```

2. **Then push the main repository**:
   ```bash
   git push
   ```

Or use the recursive push option:
```bash
git push --recurse-submodules=on-demand
```

## Common Issues and Solutions

### Detached HEAD in Submodules

Submodules typically start in a "detached HEAD" state. Before making changes, check out a branch:

```bash
cd submodule-directory
git checkout main  # or create a new branch
```

### Untracked Submodule Content

If Git shows the entire submodule as untracked:

```bash
# First, ensure the submodule is properly initialized:
git submodule update --init --recursive

# If that doesn't work, sometimes a clean approach helps:
rm -rf submodule-directory
git submodule update --init --recursive
```

### Conflicting Submodule Files

If you get errors about untracked files that would be overwritten:

```bash
# First try cleaning just the submodule
git clean -fdx submodule-directory

# If needed, reset and update
git submodule update --init --recursive
```

### Fixing a Broken Submodule

If a submodule becomes completely broken:

```bash
# Remove the submodule entry
git submodule deinit -f submodule-directory
git rm -f submodule-directory
rm -rf .git/modules/submodule-directory

# Commit the removal
git commit -m "Removed broken submodule"

# Re-add the submodule
git submodule add https://github.com/o2alexanderfedin/submodule-repo.git submodule-directory
git submodule update --init --recursive
git commit -m "Re-added submodule"
```

## Best Practices

1. **Always update submodules after pulling**:
   ```bash
   git pull
   git submodule update --recursive
   ```

2. **Use the helper script for complex operations**

3. **Commit submodule changes before committing in the main repository**

4. **Communicate with team members when updating submodules**

5. **Consider creating dedicated branches for submodule updates**

## GitFlow and Submodules

When using GitFlow with submodules:

1. GitFlow operations only affect the main repository, not submodules
2. Submodules have their own branch structure and GitFlow process
3. When creating a feature branch with submodule changes:
   - Create a feature branch in the main repo
   - Create corresponding feature branches in submodules as needed
   - When finishing the feature, ensure submodule changes are pushed first

## Additional Resources

- [Git Submodules Documentation](https://git-scm.com/book/en/v2/Git-Tools-Submodules)
- [Advanced Git Submodules](https://git-scm.com/docs/gitsubmodules)
- [Swift Submodule Guide](./swift-submodule-guide.md) - Specific to our Swift proxy
- [NolockCapture Guide](./nolock-capture-guide.md) - Details on the NolockCapture package