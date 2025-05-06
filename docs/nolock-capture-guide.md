# NolockCapture Package Guide

This document provides an overview of the NolockCapture Swift package, which offers advanced document capture capabilities with depth sensing support.

## Overview

NolockCapture is a Swift package designed to provide high-quality document capture functionality with the following features:

- Automatic document edge detection
- Perspective correction
- Enhanced image quality
- Depth-aware capture for devices with LiDAR sensors
- Multi-platform support (iOS, macOS)

## Package Structure

The package is organized as follows:

```
NolockCapture/
├── Sources/
│   ├── Core/            # Core capture functionality
│   ├── Processing/      # Image processing algorithms
│   └── Internal/        # Internal utilities
├── Examples/            # Example applications
│   └── CaptureExamples  # Simple example app
└── Tests/               # Unit and integration tests
    └── NolockCaptureTests
```

## Integration

To integrate NolockCapture into your Swift project:

### Swift Package Manager

Add the following to your `Package.swift` file:

```swift
dependencies: [
    .package(url: "https://github.com/o2alexanderfedin/nolock-capture.git", .upToNextMajor(from: "1.0.0"))
]
```

For your targets:

```swift
targets: [
    .target(
        name: "YourApp",
        dependencies: ["NolockCapture"]
    )
]
```

### Xcode Project

1. In Xcode, select File > Add Package Dependencies
2. Enter the repository URL: `https://github.com/o2alexanderfedin/nolock-capture.git`
3. Select the version rule (e.g., Up to Next Major)
4. Click Add Package

## Basic Usage

Here's a simple example of using NolockCapture to capture a document:

```swift
import NolockCapture

// Initialize the capture controller
let captureController = DocumentCaptureController()

// Set configuration
captureController.config = CaptureConfig(
    enableDepthCapture: true,
    preferredResolution: .high,
    autoCorrectPerspective: true
)

// Start capture session
captureController.startSession()

// Capture document
captureController.captureDocument { result in
    switch result {
    case .success(let documentImage):
        // Process the captured document image
        processImage(documentImage)
    case .failure(let error):
        // Handle error
        print("Capture error: \(error)")
    }
}

// Clean up when done
captureController.stopSession()
```

## Advanced Features

### Depth-Aware Capture

For devices with LiDAR sensors (iPhone 12 Pro and newer, iPad Pro), you can enhance document capture with depth data:

```swift
// Enable depth sensing
captureController.config.enableDepthCapture = true

// Set depth quality (trade-off between accuracy and performance)
captureController.config.depthQuality = .balanced

// Access depth data from capture
captureController.captureDocumentWithDepth { result in
    switch result {
    case .success(let captureResult):
        let documentImage = captureResult.image
        let depthData = captureResult.depthMap
        
        // Use both image and depth data
        processImageWithDepth(documentImage, depthData)
    case .failure(let error):
        print("Depth capture error: \(error)")
    }
}
```

### Custom Processing Pipelines

You can customize the image processing pipeline:

```swift
import NolockCapture.Processing

// Create custom processing pipeline
let pipeline = ProcessingPipeline()
    .add(EdgeDetectionProcessor())
    .add(PerspectiveTransformProcessor())
    .add(CustomProcessor()) // Your custom processor
    .add(EnhancementProcessor(contrast: 1.2, brightness: 0.1))

// Apply pipeline to an image
let processedImage = try pipeline.process(inputImage)
```

## Performance Considerations

- Depth sensing increases CPU and battery usage
- For optimal performance on devices without LiDAR, disable depth features
- Use `.medium` or `.low` resolution for real-time previews
- Consider using `.high` resolution only for final capture

## Troubleshooting

Common issues:

1. **Poor edge detection**: Ensure adequate lighting and contrast between document and background
2. **Slow capture performance**: Lower the resolution or disable depth sensing
3. **Memory warnings**: Dispose of capture sessions when not in use

## Development and Contributing

For information on developing and contributing to NolockCapture, see the [README.md](https://github.com/o2alexanderfedin/nolock-capture) in the repository.

## Related Resources

- [Swift Proxy Documentation](./swift-submodule-guide.md)
- [Git Submodule Guide](./git-submodule-guide.md)