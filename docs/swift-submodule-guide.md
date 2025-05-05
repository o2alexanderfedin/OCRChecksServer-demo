# Swift Proxy Submodule Guide

This guide explains how to work with the Swift proxy which is now maintained as a separate GitHub repository and included as a Git submodule in the main OCRChecksServer repository.

## Overview

The Swift proxy client for the OCR service has been moved to its own GitHub repository at:
- https://github.com/o2alexanderfedin/nolock-ocr-swift

This provides several benefits:
- Separate version control for the Swift code
- Cleaner project organization
- Ability to use the Swift package independently in other projects
- Better separation of concerns

## Cloning the Repository with Submodules

When cloning the OCRChecksServer repository, you need to include the submodules:

```bash
# Clone the repository with submodules
git clone --recurse-submodules https://github.com/o2alexanderfedin/OCRChecksServer.git

# Or, if you've already cloned the repository without submodules:
git submodule init
git submodule update
```

## Updating the Swift Submodule

To update the Swift submodule to the latest version:

```bash
# Navigate to the main repository
cd OCRChecksServer

# Update all submodules
git submodule update --remote

# Or specifically update the Swift submodule
git submodule update --remote swift-proxy

# Then commit the submodule update
git add swift-proxy
git commit -m "chore: update Swift proxy submodule to latest version"
```

## Making Changes to the Swift Code

When you need to make changes to the Swift code:

1. Navigate to the submodule directory:
   ```bash
   cd swift-proxy
   ```

2. Create and checkout a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. Make your changes to the Swift code

4. Commit and push your changes to the Swift repository:
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature-name
   ```

5. Create a pull request in the Swift repository

6. After your PR is merged, update the submodule in the main repository:
   ```bash
   # Go back to the main repository
   cd ..
   
   # Update the submodule to point to the latest version
   git submodule update --remote swift-proxy
   
   # Commit the submodule update
   git add swift-proxy
   git commit -m "chore: update Swift proxy submodule"
   ```

## Troubleshooting Submodule Issues

If you encounter issues with the submodule:

### Detached HEAD State

If you find yourself in a detached HEAD state in the submodule:

```bash
cd swift-proxy
git checkout main
git pull
```

### Submodule Not Updating

If the submodule isn't updating properly:

```bash
git submodule sync
git submodule update --init --recursive
```

### Discarding Submodule Changes

To discard changes in the submodule:

```bash
cd swift-proxy
git checkout -- .
cd ..
git submodule update
```

## Best Practices

1. **Always create feature branches** when making changes to the Swift code
2. **Never commit directly to main** in either repository
3. **Keep the submodule up-to-date** with regular updates
4. **Document significant changes** in both repositories' CHANGELOG files
5. **Follow GitFlow workflow** in both repositories consistently

## References

- [Git Submodules Documentation](https://git-scm.com/book/en/v2/Git-Tools-Submodules)
- [Swift Package Manager Documentation](https://www.swift.org/package-manager/)