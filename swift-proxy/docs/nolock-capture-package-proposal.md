# NolockCapture Package Proposal

## Overview

This document proposes creating a separate Swift package called `NolockCapture` to implement the advanced receipt capture functionality with depth mapping described in the architectural design document. This package would be maintained in its own GitHub repository but would integrate seamlessly with the existing NolockOCR package.

## Rationale

### Benefits of a Separate Package

1. **Focused Development**: 
   - The depth capture functionality is complex and specialized with its own development lifecycle
   - Enables independent versioning without affecting the core OCR client
   - Provides clear boundaries for this specialized functionality

2. **Reusability**:
   - Could be used in other applications beyond receipt OCR
   - Makes it easier for other developers to adopt just the camera component
   - Allows for more general document scanning applications

3. **Reduced Dependencies**:
   - Core OCR client wouldn't require camera/AVFoundation dependencies
   - Better for apps that already have their own image capture
   - Keeps the main OCR package lightweight

4. **Testing Isolation**:
   - Camera functionality requires device testing, while OCR can be tested with static images
   - Separates UI testing concerns from data processing tests
   - Makes simulator testing easier for core OCR functionality

5. **Deployment Flexibility**:
   - Could be integrated via Swift Package Manager, CocoaPods, or as a framework
   - Enables independent releases when camera capabilities change
   - Accommodates different deployment schedules

## Proposed Package Structure

```
NolockCapture/
├── Sources/
│   ├── Core/
│   │   ├── ReceiptCaptureController.swift
│   │   ├── ReceiptCaptureError.swift
│   │   └── ReceiptCaptureConfiguration.swift
│   ├── Internal/
│   │   ├── DepthCapturePipeline.swift
│   │   ├── ImageProcessingEngine.swift
│   │   ├── AVCaptureSessionManager.swift
│   │   └── DepthDataExtractor.swift
│   └── Processing/
│       ├── PointCloudGenerator.swift
│       ├── PlaneEstimator.swift
│       └── ImageWarper.swift
├── Tests/
│   ├── UnitTests/
│   │   ├── PointCloudGeneratorTests.swift
│   │   ├── PlaneEstimatorTests.swift
│   │   └── ImageWarperTests.swift
│   └── IntegrationTests/
│       ├── DepthCapturePipelineTests.swift
│       └── FullCaptureTests.swift
├── Examples/
│   ├── BasicCapture/          // Simple receipt capture example
│   ├── DepthVisualization/    // Example showing depth map visualization
│   └── FullIntegration/       // Example integrating with NolockOCR
├── Package.swift
└── README.md
```

## Dependencies

The package would have the following dependencies:

1. **Swift Standard Library**: Core Swift functionality
2. **AVFoundation**: For camera and media capture capabilities
3. **CoreImage**: For image processing operations
4. **Accelerate**: For high-performance vector and matrix operations
5. **simd**: For 3D mathematics and transformations
6. **Metal** (optional): For GPU-accelerated image processing

The package would not depend on NolockOCR, ensuring it remains independent and usable without the OCR component.

## Integration with NolockOCR

Integration would be straightforward for client applications:

```swift
// In your Swift app's Package.swift
dependencies: [
    .package(url: "https://github.com/nolock/NolockOCR.git", from: "1.0.0"),
    .package(url: "https://github.com/nolock/NolockCapture.git", from: "1.0.0")
]

// Target dependencies
targets: [
    .target(
        name: "MyApp",
        dependencies: [
            .product(name: "NolockOCR", package: "NolockOCR"),
            .product(name: "NolockCapture", package: "NolockCapture")
        ]
    )
]

// In your application code
import NolockOCR
import NolockCapture

func captureAndProcess() {
    let captureController = ReceiptCaptureController()
    let ocrClient = OCRClient()
    
    captureController.captureReceiptWithDepth { result in
        if case .success(let image) = result {
            ocrClient.processReceipt(image: image) { ocrResult in
                // Handle OCR result
            }
        }
    }
}
```

## Implementation Plan following GitFlow

The implementation would follow the GitFlow workflow:

1. **Initial Setup Phase**:
   - Create a new repository on GitHub for NolockCapture
   - Set up GitFlow branch structure (main, develop)
   - Create initial package structure and Package.swift
   - Implement basic README and documentation

2. **Core Implementation Phase**:
   - Create feature branches for each major component:
     - `feature/receipt-capture-controller`
     - `feature/depth-capture-pipeline`
     - `feature/image-processing-engine`
     - `feature/point-cloud-generation`
     - `feature/plane-estimation`
     - `feature/image-warping`
   - Implement tests alongside each component
   - Merge each completed feature into develop using GitFlow

3. **Integration Phase**:
   - Create feature branch for OCR integration examples
   - Implement examples demonstrating usage with NolockOCR
   - Document integration patterns

4. **Release Process**:
   - Create release branches following semantic versioning
   - Ensure comprehensive documentation and examples
   - Create GitHub releases with detailed release notes
   - Tag releases appropriately

5. **Maintenance Plan**:
   - Hotfixes for critical issues using GitFlow hotfix branches
   - Regular releases for new features and improvements
   - Maintain compatibility with NolockOCR updates

## Timeline and Resources

**Estimated Timeline**:
- Repository setup and initial structure: 1 week
- Core implementation of all components: 4-6 weeks
- Testing and refinement: 2 weeks
- Documentation and examples: 1 week
- Initial release: End of week 8-10

**Required Resources**:
- iOS developer with AVFoundation expertise
- Access to LiDAR-equipped iOS devices for testing
- Variety of receipt types for validation testing
- CI/CD setup for automated testing

## Conclusion

Creating a separate `NolockCapture` package would provide significant benefits in terms of modularity, reusability, and maintenance. It would allow for specialized development of the capture functionality while maintaining clean integration with the existing OCR system. This approach follows best practices for package design and dependency management in the Swift ecosystem.

This proposal recommends proceeding with the creation of this package while adhering to the GitFlow process to ensure proper version control and release management.