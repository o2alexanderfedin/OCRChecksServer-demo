# NolockCapture Package

## Overview

NolockCapture is a Swift package that provides advanced document capture capabilities with depth sensing support. It's designed to improve OCR accuracy by detecting and flattening curved or wrinkled documents using depth data from device cameras.

The package is included as a Git submodule in this repository to maintain proper version management while allowing for independent development.

## Key Features

- Depth-aware document capture using device cameras (LiDAR or dual camera systems)
- Automatic document plane detection and perspective correction
- Surface flattening to improve OCR processing accuracy
- Seamless integration with NolockOCR for end-to-end document processing

## Directory Structure

```
nolock-capture-lib/
├── Examples/          # Example code and demo applications
├── Package.swift      # Swift Package Manager configuration
├── README.md          # Package documentation
├── Sources/
│   ├── Core/          # Core public APIs and controllers
│   ├── Processing/    # Image and depth processing algorithms
│   └── Internal/      # Internal implementation details
└── Tests/             # Unit and integration tests
```

## Working with the Submodule

### Cloning the Repository with Submodules

When cloning this repository, use the `--recurse-submodules` flag to automatically initialize and update the submodule:

```bash
git clone --recurse-submodules https://github.com/your-username/OCRChecksServer.git
```

### Initializing Submodules (if already cloned)

If you've already cloned the repository without submodules, initialize and update them with:

```bash
git submodule update --init --recursive
```

### Updating the Submodule

To update the submodule to the latest version:

```bash
git submodule update --remote nolock-capture-lib
```

### Making Changes to the Submodule

1. Navigate to the submodule directory:
   ```bash
   cd nolock-capture-lib
   ```

2. Create a branch for your changes:
   ```bash
   git checkout -b your-feature-branch
   ```

3. Make your changes, commit them, and push to the submodule repository:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin your-feature-branch
   ```

4. Create a pull request in the submodule repository

5. After merging, update the main repository to point to the new commit:
   ```bash
   cd ..  # Back to main repository
   git add nolock-capture-lib
   git commit -m "Update NolockCapture submodule to latest version"
   git push
   ```

## Integration with OCR Processing

The NolockCapture package is designed to work seamlessly with NolockOCR. Here's a simplified integration flow:

1. User captures document with depth-aware camera
2. NolockCapture processes the image using depth data to flatten curved surfaces
3. Processed image is passed to NolockOCR for text extraction
4. Extracted data is returned as structured information

See the [NolockCapture README](../nolock-capture-lib/README.md) for detailed API usage and examples.