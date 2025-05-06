# Swift Submodule Guide

This guide provides specific instructions for working with the Swift submodules in our project: `swift-proxy` and `nolock-capture`.

## Swift Submodules Overview

Our project includes two Swift submodules:

1. **swift-proxy**: Contains the NolockOCR Swift client for interacting with our OCR API
2. **nolock-capture**: Contains the NolockCapture package for advanced document capture

These submodules are maintained as separate repositories but included in the main OCRChecksServer project using Git submodules.

## Initial Setup

When you first clone the repository, initialize the submodules:

```bash
git clone https://github.com/o2alexanderfedin/OCRChecksServer.git
cd OCRChecksServer
git submodule update --init --recursive
```

This will download both Swift submodules to their respective directories.

## Opening Swift Projects

### In Xcode

To open a Swift submodule in Xcode:

1. Navigate to the submodule directory:
   ```bash
   cd swift-proxy  # or cd nolock-capture
   ```

2. Open the package in Xcode:
   ```bash
   open Package.swift
   ```

3. Xcode will open the Swift package and resolve its dependencies

### Command Line Development

For command line development:

```bash
cd swift-proxy  # or cd nolock-capture-lib
swift build
swift test
```

## Making Changes to Swift Submodules

When making changes to a Swift submodule:

1. **Ensure you're on a branch**:
   ```bash
   cd swift-proxy
   git checkout main  # or create a feature branch
   ```

2. **Make your changes in Xcode or your preferred editor**

3. **Build and test your changes**:
   ```bash
   swift build
   swift test
   ```

4. **Commit your changes within the submodule**:
   ```bash
   git add .
   git commit -m "Description of your changes"
   ```

5. **Return to the main repository and update the reference**:
   ```bash
   cd ..
   git add swift-proxy  # or nolock-capture
   git commit -m "Update Swift submodule reference"
   ```

6. **Push changes in the correct order**:
   ```bash
   cd swift-proxy
   git push
   cd ..
   git push
   ```

## Swift Submodule Versioning

Each Swift submodule follows semantic versioning:

- **Major version** (x.0.0): Breaking API changes
- **Minor version** (0.x.0): New features in a backward-compatible manner
- **Patch version** (0.0.x): Backward-compatible bug fixes

When updating the Swift packages:

1. Update the version in the respective `Package.swift` file
2. Update the `CHANGELOG.md` in the submodule
3. Create a git tag in the submodule repository:
   ```bash
   git tag v1.2.3
   git push --tags
   ```

## Swift Package Dependencies

### NolockOCR Package

The `swift-proxy` (NolockOCR) package has the following dependencies:

- **Foundation**: Standard library functionality
- **URLSession**: Network operations

### NolockCapture Package

The `nolock-capture` (NolockCapture) package has the following dependencies:

- **Foundation**: Standard library functionality
- **CoreImage**: Image processing
- **AVFoundation**: Camera access and frame capture
- **ARKit** (iOS only): For depth information on LiDAR-equipped devices
- **Vision**: For document detection

## Common Issues and Solutions

### Build Errors After Updating Submodules

If you encounter build errors after updating submodules:

```bash
# Clean build folder
cd swift-proxy  # or nolock-capture
rm -rf .build

# Resolve package dependencies
swift package resolve

# Build again
swift build
```

### Detached HEAD in Swift Submodules

After updating submodules, you might end up with a detached HEAD:

```bash
cd swift-proxy
git checkout main  # or the appropriate branch
```

### Xcode Doesn't See Latest Changes

If Xcode doesn't reflect the latest changes:

1. Close the project in Xcode
2. Clean Xcode's derived data:
   ```bash
   rm -rf ~/Library/Developer/Xcode/DerivedData
   ```
3. Reopen the package in Xcode

## Integration Testing

To test the integration between the main project and Swift submodules:

```bash
# Run Swift E2E tests
./scripts/run-swift-e2e-tests.sh
```

## Related Resources

- [Git Submodule Guide](./git-submodule-guide.md)
- [NolockCapture Guide](./nolock-capture-guide.md)
- [Submodule Helper Script](../scripts/submodule-helper.sh)