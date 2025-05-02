# NolockOCR Swift Package

A Swift client for the Nolock OCR Checks Server API. This package provides a simple interface for processing check and receipt images, extracting structured data from them.

## Installation

Add the package to your project using Swift Package Manager:

```swift
dependencies: [
    .package(url: "https://github.com/nolock/ocr-swift-proxy.git", from: "1.0.0"),
]
```

## Requirements

- iOS 15.0+ / macOS 12.0+
- Swift 5.9+

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

### Process a Check

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

### Process a Receipt

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

### Use the Universal Document Processing Endpoint

```swift
// Get your document image data
let imageData = // ... your image data

// Process as a receipt but let the API determine the actual type
client.processDocument(imageData: imageData, type: .receipt) { result in
    switch result {
    case .success(let response):
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
        
    case .failure(let error):
        print("Error processing document: \(error)")
    }
}
```

### Check API Health

```swift
client.getHealth { result in
    switch result {
    case .success(let health):
        print("API Status: \(health.status)")
        print("Version: \(health.version)")
        print("Server Time: \(health.timestamp)")
        
    case .failure(let error):
        print("Error checking health: \(error)")
    }
}
```

## Advanced Usage

### Specify Document Format and Filename

```swift
client.processCheck(
    imageData: imageData,
    format: .image,
    filename: "business_check.jpg"
) { result in
    // Handle result
}
```

## Error Handling

All API methods return a `Result` type with either the successful response or an error:

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

## License

This package is available under the AGPL-3.0-or-later license.