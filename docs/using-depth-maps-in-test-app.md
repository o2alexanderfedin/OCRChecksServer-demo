# Using Depth Maps in the NolockSwiftTester App

This guide explains how to extend the NolockSwiftTester app to test the depth sensing capabilities of the `nolock-capture` package using HEIC images with depth maps.

## Prerequisites

- Completed the NolockSwiftTester app setup as described in the iOS Testing Guide
- Captured HEIC images with depth maps as described in the [Capturing Depth Map HEIC Images](./capturing-depth-map-heic-images.md) guide
- Basic understanding of SwiftUI and UIKit integration

## Adding HEIC Processing Functionality

Update your ContentView.swift file with the following additions to test depth map processing:

```swift
import SwiftUI
import NolockOCR
import NolockCapture
import UIKit
import AVFoundation

struct ContentView: View {
    @State private var ocrStatus = "NolockOCR not tested"
    @State private var captureStatus = "NolockCapture not tested"
    @State private var selectedImage: UIImage?
    @State private var depthMapImage: UIImage?
    @State private var isShowingImagePicker = false
    @State private var processingStatus = "No image processed"
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Original test buttons
                Button("Test NolockOCR") {
                    testOCRClient()
                }
                Text(ocrStatus)
                    .padding()
                    .background(Color.gray.opacity(0.2))
                    .cornerRadius(8)
                
                Button("Test NolockCapture") {
                    testCaptureController()
                }
                Text(captureStatus)
                    .padding()
                    .background(Color.gray.opacity(0.2))
                    .cornerRadius(8)
                
                Divider()
                
                // New depth testing section
                Text("Depth Map Testing")
                    .font(.headline)
                
                Button("Select HEIC Image with Depth") {
                    isShowingImagePicker = true
                }
                .padding()
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(8)
                
                if let image = selectedImage {
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFit()
                        .frame(height: 200)
                        .cornerRadius(8)
                        .padding()
                }
                
                Button("Process Depth Map") {
                    processDepthMap()
                }
                .padding()
                .background(Color.green)
                .foregroundColor(.white)
                .cornerRadius(8)
                .disabled(selectedImage == nil)
                
                Text(processingStatus)
                    .padding()
                    .background(Color.gray.opacity(0.2))
                    .cornerRadius(8)
                
                if let depthImage = depthMapImage {
                    Text("Visualized Depth Map:")
                    Image(uiImage: depthImage)
                        .resizable()
                        .scaledToFit()
                        .frame(height: 200)
                        .cornerRadius(8)
                        .padding()
                }
            }
            .padding()
        }
        .sheet(isPresented: $isShowingImagePicker) {
            ImagePicker(selectedImage: $selectedImage)
        }
    }
    
    // Original test functions
    func testOCRClient() {
        // Same as before
    }
    
    func testCaptureController() {
        // Same as before
    }
    
    // New depth processing functions
    func processDepthMap() {
        guard let image = selectedImage else {
            processingStatus = "No image selected"
            return
        }
        
        processingStatus = "Processing depth map..."
        
        // Create a ReceiptCaptureController instance from NolockCapture
        let captureController = ReceiptCaptureController()
        
        // Prepare the HEIC data from the selected image
        guard let heicData = image.heicData() else {
            processingStatus = "Failed to get HEIC data from image"
            return
        }
        
        // Use NolockCapture to extract and process the depth map
        captureController.processImageWithDepth(heicData: heicData) { result in
            DispatchQueue.main.async {
                switch result {
                case .success(let processedResult):
                    processingStatus = "Success! Depth map extracted and processed."
                    
                    // If NolockCapture provides a visualized depth map, display it
                    if let depthVisualization = processedResult.depthVisualization {
                        self.depthMapImage = UIImage(data: depthVisualization)
                    } else {
                        // Otherwise create a simple visualization
                        self.depthMapImage = createDepthMapVisualization(from: processedResult.depthMap)
                    }
                    
                    // Log additional depth info if available
                    if let stats = processedResult.depthStats {
                        processingStatus += "\nMin depth: \(stats.minDepth)"
                        processingStatus += "\nMax depth: \(stats.maxDepth)"
                        processingStatus += "\nAvg depth: \(stats.avgDepth)"
                    }
                    
                case .failure(let error):
                    processingStatus = "Error processing depth map: \(error.localizedDescription)"
                }
            }
        }
    }
    
    // Helper function to visualize a depth map
    func createDepthMapVisualization(from depthMap: Data?) -> UIImage? {
        guard let depthData = depthMap else { return nil }
        
        // Basic visualization implementation
        // This will be replaced by NolockCapture's actual visualization method
        // This is just a placeholder for testing purposes
        
        // Simplified implementation that converts depth data to a grayscale image
        // In a real implementation, you would use NolockCapture's built-in visualization
        return UIImage(data: depthData)
    }
}

// UIImage extension to get HEIC data
extension UIImage {
    func heicData() -> Data? {
        return self.jpegData(compressionQuality: 1.0)  // Fallback to JPEG for testing
        // In real implementation, you would extract actual HEIC data
    }
}

// Image Picker component
struct ImagePicker: UIViewControllerRepresentable {
    @Binding var selectedImage: UIImage?
    @Environment(\.presentationMode) var presentationMode
    
    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.delegate = context.coordinator
        picker.sourceType = .photoLibrary
        return picker
    }
    
    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {
        // Nothing to update
    }
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let parent: ImagePicker
        
        init(_ parent: ImagePicker) {
            self.parent = parent
        }
        
        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey : Any]) {
            if let image = info[.originalImage] as? UIImage {
                parent.selectedImage = image
            }
            
            parent.presentationMode.wrappedValue.dismiss()
        }
        
        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            parent.presentationMode.wrappedValue.dismiss()
        }
    }
}
```

## Implementation Notes

1. The code assumes the `NolockCapture` package has a `ReceiptCaptureController` class with a method like `processImageWithDepth()`. Adjust according to the actual API.

2. The `UIImage.heicData()` extension is a placeholder. For real implementation, you'll need proper HEIC data extraction.

3. Some functions like `createDepthMapVisualization()` are simplified placeholders. The actual implementation will depend on how `NolockCapture` processes and returns depth information.

## Testing Process

1. Build and run the NolockSwiftTester app on your device
2. Tap "Select HEIC Image with Depth" to choose a HEIC image with depth map
3. The selected image will be displayed on screen
4. Tap "Process Depth Map" to process the image with NolockCapture
5. The app will display the processing status and visualized depth map if successful

## Troubleshooting

- **Image Selection Issues**: If the image picker doesn't return the HEIC file correctly, try using Files app integration instead.
- **Depth Map Processing Failures**: Ensure the selected image actually contains depth data. Not all HEIC images have depth maps.
- **Memory Issues**: Processing large HEIC files with depth maps can be memory-intensive. Consider implementing memory optimization techniques.

## Next Steps

After successfully testing with pre-captured HEIC images, you can extend the app to:

1. Capture HEIC images with depth directly within the app
2. Implement more sophisticated depth map visualization
3. Add document boundary detection using depth information
4. Test different depth-based document flattening algorithms

These enhancements will provide comprehensive testing of the `nolock-capture` package's depth-sensing capabilities.