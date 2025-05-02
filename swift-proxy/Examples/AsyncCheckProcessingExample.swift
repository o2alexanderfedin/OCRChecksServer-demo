import Foundation
import NolockOCR

// Example of processing a check image using async/await
func processCheckExampleAsync() async {
    // Create an OCR client for development environment
    let client = NolockOCR.developmentClient()
    
    // Get your check image data
    guard let url = Bundle.main.url(forResource: "sample_check", withExtension: "jpg"),
          let imageData = try? Data(contentsOf: url) else {
        print("Could not load sample check image")
        return
    }
    
    do {
        // Process the check image
        let response = try await client.processCheck(imageData: imageData)
        
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
    } catch {
        print("Error processing check: \(error)")
    }
}

// Example of processing a receipt image using async/await
func processReceiptExampleAsync() async {
    // Create an OCR client
    let client = NolockOCR.createClient(environment: .development)
    
    // Get your receipt image data
    guard let url = Bundle.main.url(forResource: "sample_receipt", withExtension: "jpg"),
          let imageData = try? Data(contentsOf: url) else {
        print("Could not load sample receipt image")
        return
    }
    
    do {
        // Process the receipt image
        let response = try await client.processReceipt(imageData: imageData)
        
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
    } catch {
        print("Error processing receipt: \(error)")
    }
}

// Example of using the universal document processing endpoint with async/await
func processDocumentExampleAsync() async {
    // Create a client
    let client = NolockOCR.createClient()
    
    // Get your document image data
    guard let url = Bundle.main.url(forResource: "unknown_document", withExtension: "jpg"),
          let imageData = try? Data(contentsOf: url) else {
        print("Could not load document image")
        return
    }
    
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
        
        print("Overall Confidence: \(response.confidence.overall)")
    } catch {
        print("Error processing document: \(error)")
    }
}

// Example of checking API health with async/await
func checkHealthExampleAsync() async {
    let client = NolockOCR.productionClient()
    
    do {
        let health = try await client.getHealth()
        
        print("API Status: \(health.status)")
        print("Version: \(health.version)")
        print("Server Time: \(health.timestamp)")
    } catch {
        print("Error checking health: \(error)")
    }
}

// Example demonstrating both backward compatibility and async/await
// Shows how to integrate async code with existing completion handler-based code
func mixedExampleWithBothStyles() {
    // Create a client for the development environment
    let client = NolockOCR.developmentClient()
    
    // Legacy approach with completion handler
    func processWithCompletionHandler() {
        guard let url = Bundle.main.url(forResource: "sample_check", withExtension: "jpg"),
              let imageData = try? Data(contentsOf: url) else {
            print("Could not load sample check image")
            return
        }
        
        client.processCheck(imageData: imageData) { result in
            switch result {
            case .success(let response):
                print("[Completion] Check Number: \(response.data.checkNumber)")
            case .failure(let error):
                print("[Completion] Error: \(error)")
            }
        }
    }
    
    // Modern approach using Swift concurrency
    func processWithAsyncAwait() {
        // We need to use Task since this function is not async itself
        Task {
            guard let url = Bundle.main.url(forResource: "sample_check", withExtension: "jpg"),
                  let imageData = try? Data(contentsOf: url) else {
                print("Could not load sample check image")
                return
            }
            
            do {
                let response = try await client.processCheck(imageData: imageData)
                print("[Async/Await] Check Number: \(response.data.checkNumber)")
            } catch {
                print("[Async/Await] Error: \(error)")
            }
        }
    }
    
    // Call both methods to see they work in parallel
    processWithCompletionHandler()
    processWithAsyncAwait()
}