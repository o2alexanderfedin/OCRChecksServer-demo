# iOS Testing Guide for Swift Packages

This guide shows how to test the NolockOCR and NolockCapture Swift packages on real iOS devices.

## Overview

Our project includes two Swift packages that may need testing on iOS devices:

1. **NolockOCR** (`swift-proxy`) - Client for interacting with the OCR API
2. **NolockCapture** (`nolock-capture`) - Document capture functionality with depth sensing

To test these packages on a real device, you'll need to create an iOS application that incorporates these packages.

## Prerequisites

- Xcode 15.0 or later
- An Apple Developer account (free account works for development)
- iPhone running iOS 15.0 or later
- A Mac with macOS 12.0 or later
- The OCRChecksServer repository with submodules initialized

## Step 1: Create an iOS Test App

1. Open Xcode and select "Create a new Xcode project"
2. Choose "App" under the iOS tab
3. Set the following options:
   - Product Name: `NolockSwiftTester`
   - Interface: SwiftUI
   - Language: Swift
   - Deployment Target: iOS 15.0
4. Choose a location to save the project (preferably near but not inside the OCRChecksServer repository)

## Step 2: Add Swift Packages

### Method 1: Local Package References

1. In Xcode, select your project in the Project Navigator
2. Select the `NolockSwiftTester` target
3. Go to the "Package Dependencies" tab
4. Click the "+" button
5. Choose "Add Local..."
6. Navigate to and select:
   - `/Users/alexanderfedin/Projects/OCRChecksServer/swift-proxy`
   - `/Users/alexanderfedin/Projects/OCRChecksServer/nolock-capture`
7. Click "Add Package" for each package

### Method 2: Remote Package References

Alternatively, you can use the GitHub URLs:

1. Follow steps 1-4 from Method 1
2. In the search field, enter:
   - `https://github.com/o2alexanderfedin/nolock-ocr-swift.git` for NolockOCR
   - `https://github.com/o2alexanderfedin/nolock-capture.git` for NolockCapture
3. Choose "Up to Next Major Version" for dependency rule
4. Click "Add Package"

## Step 3: Configure Code Signing

1. Select your project in the Project Navigator
2. Select the `NolockSwiftTester` target
3. Go to the "Signing & Capabilities" tab
4. Check "Automatically manage signing"
5. Select your Apple Developer Team
6. If you don't have a team, click "Add an Account..." and sign in with your Apple ID

## Step 4: Create a Simple Test UI

Replace the contents of `ContentView.swift` with the following code to test both packages:

```swift
import SwiftUI
import NolockOCR
import NolockCapture

struct ContentView: View {
    @State private var ocrStatus = "NolockOCR not tested"
    @State private var captureStatus = "NolockCapture not tested"
    
    var body: some View {
        VStack(spacing: 20) {
            Text("Swift Package Tester")
                .font(.title)
            
            Divider()
            
            VStack(alignment: .leading) {
                Text("NolockOCR Package")
                    .font(.headline)
                Text(ocrStatus)
                    .font(.body)
                    .foregroundColor(ocrStatus.contains("working") ? .green : .red)
                
                Button("Test NolockOCR") {
                    testOCRPackage()
                }
                .buttonStyle(.bordered)
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(10)
            
            VStack(alignment: .leading) {
                Text("NolockCapture Package")
                    .font(.headline)
                Text(captureStatus)
                    .font(.body)
                    .foregroundColor(captureStatus.contains("working") ? .green : .red)
                
                Button("Test NolockCapture") {
                    testCapturePackage()
                }
                .buttonStyle(.bordered)
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(10)
        }
        .padding()
    }
    
    func testOCRPackage() {
        do {
            // Create NolockOCR client
            let client = OCRClient(apiURL: URL(string: "https://api.nolock.social")!)
            
            // If we got here, basic initialization is working
            ocrStatus = "NolockOCR is working! Client initialized successfully."
        } catch {
            ocrStatus = "Error: \(error.localizedDescription)"
        }
    }
    
    func testCapturePackage() {
        do {
            // Create CaptureController
            let config = CaptureConfig(
                enableDepthCapture: true,
                preferredResolution: .high,
                autoCorrectPerspective: true
            )
            
            // Just initialize the controller to verify the package works
            let controller = DocumentCaptureController()
            controller.config = config
            
            captureStatus = "NolockCapture is working! Controller initialized."
        } catch {
            captureStatus = "Error: \(error.localizedDescription)"
        }
    }
}

// Sample structures to match the packages
// (Replace these with actual classes from your packages)

// For NolockCapture
struct CaptureConfig {
    var enableDepthCapture: Bool
    var preferredResolution: Resolution
    var autoCorrectPerspective: Bool
}

enum Resolution {
    case low, medium, high
}

class DocumentCaptureController {
    var config: CaptureConfig?
}

#Preview {
    ContentView()
}
```

**Note**: You will need to modify the above code to match your actual package structures.

## Step 5: Run the App on a Device

1. Connect your iPhone to your Mac
2. In Xcode, select your iPhone from the device dropdown in the toolbar
3. Click the Play button to build and run the app
4. If prompted on your device, trust the developer certificate

## Advanced Testing: Camera and Document Capture

To fully test the NolockCapture functionality with camera access:

1. Add a "Camera Usage Description" to your `Info.plist`:
   - Key: `NSCameraUsageDescription`
   - Value: "This app needs access to the camera to capture documents"

2. Update the test function to create a more complete capture implementation:

```swift
func testCapturePackage() {
    // This will be called when the user taps the "Test NolockCapture" button
    let controller = DocumentCaptureController()
    
    // Create a UIViewController to present the capture interface
    let hostingController = UIHostingController(rootView: CaptureView(controller: controller))
    
    // Get the current window scene
    if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
       let rootViewController = windowScene.windows.first?.rootViewController {
        rootViewController.present(hostingController, animated: true)
    }
}

// Create a SwiftUI view for the capture interface
struct CaptureView: View {
    var controller: DocumentCaptureController
    @Environment(\.presentationMode) var presentationMode
    @State private var captureResult: String = "Ready to capture"
    
    var body: some View {
        VStack {
            Text("Document Capture")
                .font(.title)
            
            Spacer()
            
            Text(captureResult)
                .padding()
            
            Button("Start Capture") {
                // Start the capture session
                controller.startSession()
                captureResult = "Session started. Point camera at document."
            }
            .buttonStyle(.borderedProminent)
            
            Button("Capture Document") {
                // Implement your actual capture logic
                captureResult = "Document captured successfully!"
            }
            .buttonStyle(.bordered)
            .padding(.top)
            
            Button("Close") {
                controller.stopSession()
                presentationMode.wrappedValue.dismiss()
            }
            .padding()
        }
        .padding()
    }
}
```

## Troubleshooting

### Package Not Found
- Ensure you've initialized submodules: `git submodule update --init --recursive`
- Check package paths are correct
- Try using the GitHub URL instead of local path

### Build Errors
- Clean the build folder: Xcode > Product > Clean Build Folder
- Check Swift language version compatibility
- Ensure minimum deployment target matches the packages (iOS 15.0)

### Code Signing Issues
- Use "Automatically manage signing"
- Add your Apple ID in Xcode > Preferences > Accounts
- Verify your device is trusted on the Mac

### Camera Access Issues
- Add `NSCameraUsageDescription` to Info.plist
- Check if camera access was denied in iOS Settings

## Next Steps

After basic verification, you can expand the testing app to:

1. Test more specific functionality of each package
2. Create a complete document scanning and OCR workflow
3. Add UI for displaying OCR results
4. Test performance on various device models

Remember to commit your testing app separately from the main OCRChecksServer repository.