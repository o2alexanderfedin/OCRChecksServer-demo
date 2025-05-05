# NolockOCR Swift Package

[![Swift](https://img.shields.io/badge/Swift-5.9-orange.svg)](https://swift.org)
[![Platforms](https://img.shields.io/badge/Platforms-iOS%2015.0+%20|%20macOS%2012.0+-4BC51D.svg)](https://www.apple.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A Swift client library for the Nolock OCR API that extracts structured data from check and receipt images. This package provides an elegant, type-safe interface for OCR processing with support for modern Swift features.

## Features

- ✅ **Modern Swift Concurrency** with async/await support
- ✅ **Backward Compatibility** with completion handler APIs
- ✅ **Type-Safe Models** for check and receipt data
- ✅ **SwiftUI Integration** ready
- ✅ **Comprehensive Error Handling**
- ✅ **Confidence Scoring** for OCR and extraction quality
- ✅ **Environment Configuration** for development, staging, and production
- ✅ **HEIC Image Support** with automatic conversion
- ✅ **Lightweight** with zero external dependencies

## Installation

### Swift Package Manager

Add the package to your project using Swift Package Manager:

#### In Xcode:
1. Go to **File** > **Add Package Dependencies...**
2. Enter the package URL: `https://github.com/o2alexanderfedin/OCRChecksServer.git`
3. Select the version rule (Exact, Up to Next Major, etc.)
4. Click **Add Package**

#### In Package.swift:
```swift
dependencies: [
    .package(url: "https://github.com/o2alexanderfedin/OCRChecksServer.git", from: "1.45.0"),
],
targets: [
    .target(
        name: "YourTarget",
        dependencies: [
            .product(name: "NolockOCR", package: "OCRChecksServer")
        ]
    )
]
```

## Requirements

- iOS 15.0+ / macOS 12.0+
- Swift 5.9+
- Xcode 15.0+

## Usage

### Initialize the client

```swift
import NolockOCR

// Create a client using one of the convenience methods
let client = NolockOCR.productionClient()

// Or specify a custom environment
let customClient = NolockOCR.createClient(environment: .development)

// For local testing
let localClient = NolockOCR.localClient()

// With a custom URL and session configuration
let sessionConfig = URLSessionConfiguration.default
sessionConfig.timeoutIntervalForRequest = 30
let session = URLSession(configuration: sessionConfig)

let customUrlClient = NolockOCR.createClient(
    environment: .custom(URL(string: "https://my-ocr-api.example.com")!),
    session: session
)
```

## Modern Swift Concurrency (async/await)

All API methods support Swift's modern concurrency model with async/await, making your code cleaner and easier to follow.

### Process a Check with async/await

```swift
// Get your check image data
let imageData = // ... your image data

do {
    let response = try await client.processCheck(imageData: imageData)
    
    // Access check data
    let check = response.data
    print("Check Number: \(check.checkNumber)")
    print("Date: \(check.date)")
    print("Payee: \(check.payee)")
    print("Amount: $\(check.amount)")
    
    // Access confidence scores
    let confidence = response.confidence
    print("Overall Confidence: \(confidence.overall)")
} catch {
    print("Error processing check: \(error)")
}
```

### Process a Receipt with async/await

```swift
// Get your receipt image data
let imageData = // ... your image data

do {
    let response = try await client.processReceipt(imageData: imageData)
    
    // Access receipt data
    let receipt = response.data
    print("Merchant: \(receipt.merchant.name)")
    print("Total: \(receipt.totals.total) \(receipt.currency)")
    
    // Print line items if available
    if let items = receipt.items {
        for item in items {
            print("- \(item.description): $\(item.totalPrice)")
        }
    }
} catch {
    print("Error processing receipt: \(error)")
}
```

### Use the Universal Document Processing Endpoint with async/await

```swift
// Get your document image data
let imageData = // ... your image data

do {
    // Process as a receipt but let the API determine the actual type
    let response = try await client.processDocument(imageData: imageData, type: .receipt)
    
    print("Document processed as: \(response.documentType)")
    
    // Handle the data based on document type
    switch response.documentType {
    case .check:
        if let check = response.data as? Check {
            print("Check Number: \(check.checkNumber)")
            print("Amount: $\(check.amount)")
        }
        
    case .receipt:
        if let receipt = response.data as? Receipt {
            print("Merchant: \(receipt.merchant.name)")
            print("Total: \(receipt.totals.total) \(receipt.currency)")
        }
    }
} catch {
    print("Error processing document: \(error)")
}
```

### Check API Health with async/await

```swift
do {
    let health = try await client.getHealth()
    print("API Status: \(health.status)")
    print("Version: \(health.version)")
    print("Server Time: \(health.timestamp)")
} catch {
    print("Error checking health: \(error)")
}
```

## Legacy Completion Handlers (Backward Compatibility)

For backward compatibility, the library also supports traditional completion handler-based APIs.

### Process a Check with Completion Handler

```swift
// Get your check image data
let imageData = // ... your image data

client.processCheck(imageData: imageData) { result in
    switch result {
    case .success(let response):
        // Access check data
        let check = response.data
        print("Check Number: \(check.checkNumber)")
        print("Date: \(check.date)")
        print("Payee: \(check.payee)")
        print("Amount: $\(check.amount)")
        
        // Access confidence scores
        let confidence = response.confidence
        print("Overall Confidence: \(confidence.overall)")
        
    case .failure(let error):
        print("Error processing check: \(error)")
    }
}
```

### Process a Receipt with Completion Handler

```swift
// Get your receipt image data
let imageData = // ... your image data

client.processReceipt(imageData: imageData) { result in
    switch result {
    case .success(let response):
        // Access receipt data
        let receipt = response.data
        print("Merchant: \(receipt.merchant.name)")
        print("Total: \(receipt.totals.total) \(receipt.currency)")
        
        // Print line items if available
        if let items = receipt.items {
            for item in items {
                print("- \(item.description): $\(item.totalPrice)")
            }
        }
        
    case .failure(let error):
        print("Error processing receipt: \(error)")
    }
}
```

## Advanced Usage

### Specify Document Format and Filename

```swift
// With async/await
let response = try await client.processCheck(
    imageData: imageData,
    format: .image,
    filename: "business_check.jpg"
)

// With completion handler
client.processCheck(
    imageData: imageData,
    format: .image,
    filename: "business_check.jpg"
) { result in
    // Handle result
}
```

## Error Handling

All API methods return proper Swift errors that you can catch and handle:

### With async/await

```swift
do {
    let response = try await client.processReceipt(imageData: imageData)
    // Handle successful response
} catch let error as OCRError {
    // Handle API-specific error
    print("API Error: \(error.error)")
} catch {
    // Handle other errors (network, decoding, etc.)
    print("Error: \(error.localizedDescription)")
}
```

### With completion handlers

```swift
client.processReceipt(imageData: imageData) { result in
    switch result {
    case .success(let response):
        // Handle successful response
        
    case .failure(let error):
        if let ocrError = error as? OCRError {
            // Handle API-specific error
            print("API Error: \(ocrError.error)")
        } else {
            // Handle other errors (network, decoding, etc.)
            print("Error: \(error.localizedDescription)")
        }
    }
}
```

## Integration with SwiftUI

The async/await API makes integration with SwiftUI seamless:

```swift
struct CheckScannerView: View {
    @State private var checkData: Check?
    @State private var isLoading = false
    @State private var error: Error?
    
    let client = NolockOCR.productionClient()
    let imageData: Data
    
    var body: some View {
        VStack {
            if isLoading {
                ProgressView("Processing check...")
            } else if let check = checkData {
                VStack(alignment: .leading) {
                    Text("Check Number: \(check.checkNumber)")
                    Text("Payee: \(check.payee)")
                    Text("Amount: $\(check.amount, specifier: "%.2f")")
                    // More fields...
                }
            } else if let error = error {
                Text("Error: \(error.localizedDescription)")
                    .foregroundColor(.red)
            }
            
            Button("Scan Check") {
                Task {
                    await scanCheck()
                }
            }
            .disabled(isLoading)
        }
        .padding()
    }
    
    func scanCheck() async {
        isLoading = true
        error = nil
        
        do {
            let response = try await client.processCheck(imageData: imageData)
            checkData = response.data
        } catch {
            self.error = error
        }
        
        isLoading = false
    }
}
```

## License

This package is available under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact & Support

- **Website**: [https://nolock.social](https://nolock.social)
- **Support**: [support@nolock.social](mailto:support@nolock.social)
- **Documentation**: [https://docs.nolock.social/ocr-api](https://docs.nolock.social/ocr-api)
- **Repository**: [https://github.com/o2alexanderfedin/OCRChecksServer](https://github.com/o2alexanderfedin/OCRChecksServer)

## Authors

- [Nolock.social Team](https://nolock.social)
- Development by [O2.services](https://o2.services)

## Acknowledgments

This library uses the Mistral AI OCR backend service for image processing.