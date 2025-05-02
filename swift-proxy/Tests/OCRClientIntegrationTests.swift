import XCTest
@testable import NolockOCR
import Foundation

/// Integration tests for OCRClient
/// These tests communicate with a running server and require:
/// 1. A local server running on http://localhost:8787
/// 2. Test images available in the fixtures directory
///
/// Run the server using: npm run dev
/// Then run these tests: cd swift-proxy && swift test
class OCRClientIntegrationTests: XCTestCase {
    
    // The environment to test against
    private let testEnvironment = OCRClient.Environment.local
    
    // Test timeout interval (allows for network latency)
    private let testTimeoutInterval: TimeInterval = 60.0 // 60 seconds
    
    // Check if integration tests should be skipped
    private var shouldSkipIntegrationTests: Bool {
        // Check if OCR_SKIP_INTEGRATION_TESTS environment variable is set
        if let skipTests = ProcessInfo.processInfo.environment["OCR_SKIP_INTEGRATION_TESTS"],
           ["1", "true", "yes"].contains(skipTests.lowercased()) {
            return true
        }
        
        // These tests require a local server running
        guard let url = URL(string: "http://localhost:8787/health") else {
            return true
        }
        
        // Try to reach the server
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.timeoutInterval = 5.0 // 5 seconds timeout for health check
        
        let semaphore = DispatchSemaphore(value: 0)
        var serverIsRunning = false
        
        let task = URLSession.shared.dataTask(with: request) { _, response, _ in
            if let httpResponse = response as? HTTPURLResponse,
               (200...299).contains(httpResponse.statusCode) {
                serverIsRunning = true
            }
            semaphore.signal()
        }
        task.resume()
        
        // Wait for the request to complete with a timeout
        _ = semaphore.wait(timeout: .now() + 5.0)
        
        return !serverIsRunning
    }
    
    // Helper function to load test image
    private func loadTestImage() -> Data? {
        // Construct path to the test image in the project
        // The image path depends on where the tests are running
        let possibleImagePaths = [
            // When running from swift-proxy directory
            "../tests/fixtures/images/IMG_2388.jpg",
            // When running from project root
            "tests/fixtures/images/IMG_2388.jpg",
            // When running from Xcode
            "../../tests/fixtures/images/IMG_2388.jpg"
        ]
        
        for path in possibleImagePaths {
            if let imageData = try? Data(contentsOf: URL(fileURLWithPath: path)) {
                return imageData
            }
        }
        
        return nil
    }
    
    // Integration test for health endpoint
    func testGetHealthEndpoint() async throws {
        // Skip if we can't run integration tests
        if shouldSkipIntegrationTests {
            XCTSkip("Integration tests are skipped because the server is not running")
        }
        
        // Create client using the local environment
        let client = OCRClient(environment: testEnvironment)
        
        do {
            // Call health endpoint
            let result = try await XCTUnwrap(
                try await withTimeout(seconds: testTimeoutInterval) {
                    try await client.getHealth()
                }
            )
            
            // Verify we got a valid response
            XCTAssertEqual(result.status, "ok")
            XCTAssert(!result.version.isEmpty, "Version should not be empty")
            XCTAssert(!result.timestamp.isEmpty, "Timestamp should not be empty")
            
            // Log the response for debugging
            print("Health response: status=\(result.status), version=\(result.version), timestamp=\(result.timestamp)")
        } catch {
            XCTFail("Health check failed: \(error)")
        }
    }
    
    // Integration test for check processing endpoint
    func testProcessCheckEndpoint() async throws {
        // Skip if we can't run integration tests
        if shouldSkipIntegrationTests {
            XCTSkip("Integration tests are skipped because the server is not running")
        }
        
        // Load test image
        guard let imageData = loadTestImage() else {
            XCTFail("Could not load test image")
            return
        }
        
        // Create client using the local environment
        let client = OCRClient(environment: testEnvironment)
        
        do {
            // Process the check image
            let result = try await XCTUnwrap(
                try await withTimeout(seconds: testTimeoutInterval) {
                    try await client.processCheck(
                        imageData: imageData,
                        format: .image,
                        filename: "test-check.jpg"
                    )
                }
            )
            
            // Verify the response structure
            XCTAssertNotNil(result.data.checkNumber, "Check number should be present")
            XCTAssertNotNil(result.data.date, "Date should be present")
            XCTAssertNotNil(result.data.payee, "Payee should be present")
            XCTAssertGreaterThan(result.data.amount, 0, "Amount should be positive")
            
            // Verify confidence scores
            XCTAssertGreaterThan(result.confidence.ocr, 0, "OCR confidence should be positive")
            XCTAssertGreaterThan(result.confidence.extraction, 0, "Extraction confidence should be positive")
            XCTAssertGreaterThan(result.confidence.overall, 0, "Overall confidence should be positive")
            
            // Log the response for debugging
            print("Check processing result: number=\(result.data.checkNumber ?? "N/A"), amount=\(result.data.amount)")
        } catch {
            XCTFail("Check processing failed: \(error)")
        }
    }
    
    // Integration test for receipt processing endpoint
    func testProcessReceiptEndpoint() async throws {
        // Skip if we can't run integration tests
        if shouldSkipIntegrationTests {
            XCTSkip("Integration tests are skipped because the server is not running")
        }
        
        // Load test image
        guard let imageData = loadTestImage() else {
            XCTFail("Could not load test image")
            return
        }
        
        // Create client using the local environment
        let client = OCRClient(environment: testEnvironment)
        
        do {
            // Process the receipt image
            let result = try await XCTUnwrap(
                try await withTimeout(seconds: testTimeoutInterval) {
                    try await client.processReceipt(
                        imageData: imageData,
                        format: .image,
                        filename: "test-receipt.jpg"
                    )
                }
            )
            
            // Verify the response structure
            XCTAssertNotNil(result.data.merchant.name, "Merchant name should be present")
            XCTAssertNotNil(result.data.timestamp, "Timestamp should be present")
            XCTAssertGreaterThan(result.data.totals.total, 0, "Total amount should be positive")
            
            // Verify confidence scores
            XCTAssertGreaterThan(result.confidence.ocr, 0, "OCR confidence should be positive")
            XCTAssertGreaterThan(result.confidence.extraction, 0, "Extraction confidence should be positive")
            XCTAssertGreaterThan(result.confidence.overall, 0, "Overall confidence should be positive")
            
            // Log the response for debugging
            print("Receipt processing result: merchant=\(result.data.merchant.name), total=\(result.data.totals.total)")
        } catch {
            XCTFail("Receipt processing failed: \(error)")
        }
    }
    
    // Integration test for universal document processing endpoint
    func testProcessDocumentEndpoint() async throws {
        // Skip if we can't run integration tests
        if shouldSkipIntegrationTests {
            XCTSkip("Integration tests are skipped because the server is not running")
        }
        
        // Load test image
        guard let imageData = loadTestImage() else {
            XCTFail("Could not load test image")
            return
        }
        
        // Create client using the local environment
        let client = OCRClient(environment: testEnvironment)
        
        do {
            // Process the document as a check
            let result = try await XCTUnwrap(
                try await withTimeout(seconds: testTimeoutInterval) {
                    try await client.processDocument(
                        imageData: imageData,
                        type: .check,
                        format: .image,
                        filename: "test-document.jpg"
                    )
                }
            )
            
            // Verify the response structure
            XCTAssertEqual(result.documentType, .check, "Document type should be check")
            
            // Verify confidence scores
            XCTAssertGreaterThan(result.confidence.ocr, 0, "OCR confidence should be positive")
            XCTAssertGreaterThan(result.confidence.extraction, 0, "Extraction confidence should be positive")
            XCTAssertGreaterThan(result.confidence.overall, 0, "Overall confidence should be positive")
            
            // Log the response for debugging
            print("Document processing result: type=\(result.documentType.rawValue)")
        } catch {
            XCTFail("Document processing failed: \(error)")
        }
    }
}

// Helper extension for adding timeouts to async operations
extension OCRClientIntegrationTests {
    func withTimeout<T>(seconds: TimeInterval, operation: () async throws -> T) async throws -> T {
        return try await withThrowingTaskGroup(of: T.self) { group in
            group.addTask {
                return try await operation()
            }

            group.addTask {
                try await Task.sleep(nanoseconds: UInt64(seconds * 1_000_000_000))
                throw NSError(domain: "OCRClientIntegrationTests", code: -1, userInfo: [
                    NSLocalizedDescriptionKey: "Operation timed out after \(seconds) seconds"
                ])
            }
            
            let result = try await group.next()!
            group.cancelAll()
            return result
        }
    }
}