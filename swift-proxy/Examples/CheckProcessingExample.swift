import Foundation
import NolockOCR

// Example of processing a check image
func processCheckExample() {
    // Create an OCR client for development environment
    let client = NolockOCR.developmentClient()
    
    // Get your check image data
    guard let url = Bundle.main.url(forResource: "sample_check", withExtension: "jpg"),
          let imageData = try? Data(contentsOf: url) else {
        print("Could not load sample check image")
        return
    }
    
    // Process the check image
    client.processCheck(imageData: imageData) { result in
        switch result {
        case .success(let response):
            // Access check data
            let check = response.data
            print("Check processed successfully:")
            print("Check Number: \(check.checkNumber)")
            print("Date: \(check.date)")
            print("Payee: \(check.payee)")
            print("Amount: $\(check.amount)")
            print("Bank Name: \(check.bankName ?? "Unknown")")
            
            // Access confidence scores
            let confidence = response.confidence
            print("OCR Confidence: \(confidence.ocr)")
            print("Extraction Confidence: \(confidence.extraction)")
            print("Overall Confidence: \(confidence.overall)")
            
        case .failure(let error):
            print("Error processing check: \(error)")
        }
    }
}

// Example of processing a receipt image
func processReceiptExample() {
    // Create an OCR client
    let client = NolockOCR.createClient(environment: .development)
    
    // Get your receipt image data
    guard let url = Bundle.main.url(forResource: "sample_receipt", withExtension: "jpg"),
          let imageData = try? Data(contentsOf: url) else {
        print("Could not load sample receipt image")
        return
    }
    
    // Process the receipt image
    client.processReceipt(imageData: imageData) { result in
        switch result {
        case .success(let response):
            // Access receipt data
            let receipt = response.data
            print("Receipt processed successfully:")
            print("Merchant: \(receipt.merchant.name)")
            print("Date: \(receipt.timestamp)")
            print("Total: \(receipt.totals.total) \(receipt.currency)")
            
            // Print line items if available
            if let items = receipt.items {
                print("\nItems:")
                for item in items {
                    print("- \(item.description): $\(item.totalPrice)")
                }
            }
            
            // Access confidence scores
            let confidence = response.confidence
            print("\nConfidence Scores:")
            print("OCR: \(confidence.ocr)")
            print("Extraction: \(confidence.extraction)")
            print("Overall: \(confidence.overall)")
            
        case .failure(let error):
            print("Error processing receipt: \(error)")
        }
    }
}

// Example of using the universal document processing endpoint
func processDocumentExample() {
    // Create a client
    let client = NolockOCR.createClient()
    
    // Get your document image data
    guard let url = Bundle.main.url(forResource: "unknown_document", withExtension: "jpg"),
          let imageData = try? Data(contentsOf: url) else {
        print("Could not load document image")
        return
    }
    
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
            
            print("Overall Confidence: \(response.confidence.overall)")
            
        case .failure(let error):
            print("Error processing document: \(error)")
        }
    }
}

// Example of checking API health
func checkHealthExample() {
    let client = NolockOCR.productionClient()
    
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
}