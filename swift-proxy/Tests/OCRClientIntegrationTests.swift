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
    
    // Tests to skip if server is not available
    private func skipIfServerUnavailable() async throws {
        // Skip tests if environment variable is set
        if let skipTests = ProcessInfo.processInfo.environment["OCR_SKIP_INTEGRATION_TESTS"],
           ["1", "true", "yes"].contains(skipTests.lowercased()) {
            throw XCTSkip("Integration tests are skipped by environment variable")
        }
        
        // Skip tests if server is not available
        if !(await isServerAvailable()) {
            throw XCTSkip("Integration tests are skipped because the server is not running")
        }
    }
    
    // Check if the server is available
    private func isServerAvailable() async -> Bool {
        guard let url = URL(string: "http://localhost:8787/health") else {
            return false
        }
        
        do {
            let (_, response) = try await URLSession.shared.data(from: url, delegate: nil)
            guard let httpResponse = response as? HTTPURLResponse else {
                return false
            }
            return (200...299).contains(httpResponse.statusCode)
        } catch {
            return false
        }
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
        // Skip if server is unavailable
        try await skipIfServerUnavailable()
        
        // Create client using the local environment
        let client = OCRClient(environment: testEnvironment)
        
        // Run with timeout
        let result = try await runWithTimeout(seconds: testTimeoutInterval) {
            return try await client.getHealth()
        }
        
        // Verify we got a valid response
        XCTAssertEqual(result.status, "ok")
        XCTAssert(!result.version.isEmpty, "Version should not be empty")
        XCTAssert(!result.timestamp.isEmpty, "Timestamp should not be empty")
        
        // Log the response for debugging
        print("Health response: status=\(result.status), version=\(result.version), timestamp=\(result.timestamp)")
    }
    
    // Integration test for check processing endpoint
    func testProcessCheckEndpoint() async throws {
        // Skip if server is unavailable
        try await skipIfServerUnavailable()
        
        // Load test image
        guard let imageData = loadTestImage() else {
            XCTFail("Could not load test image")
            return
        }
        
        // Create client using the local environment
        let client = OCRClient(environment: testEnvironment)
        
        // Process the check image with timeout
        let result = try await runWithTimeout(seconds: testTimeoutInterval) {
            return try await client.processCheck(
                imageData: imageData,
                format: .image,
                filename: "test-check.jpg"
            )
        }
        
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
        print("Check processing result: number=\(result.data.checkNumber), amount=\(result.data.amount)")
    }
    
    // Integration test for receipt processing endpoint
    func testProcessReceiptEndpoint() async throws {
        // Skip if server is unavailable
        try await skipIfServerUnavailable()
        
        // Load test image
        guard let imageData = loadTestImage() else {
            XCTFail("Could not load test image")
            return
        }
        
        // Create client using the local environment
        let client = OCRClient(environment: testEnvironment)
        
        // Process the receipt image with timeout
        let result = try await runWithTimeout(seconds: testTimeoutInterval) {
            return try await client.processReceipt(
                imageData: imageData,
                format: .image,
                filename: "test-receipt.jpg"
            )
        }
        
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
    }
    
    // Integration test for universal document processing endpoint
    func testProcessDocumentEndpoint() async throws {
        // Skip if server is unavailable
        try await skipIfServerUnavailable()
        
        // Load test image
        guard let imageData = loadTestImage() else {
            XCTFail("Could not load test image")
            return
        }
        
        // Create client using the local environment
        let client = OCRClient(environment: testEnvironment)
        
        // Process the document as a check with timeout
        let result = try await runWithTimeout(seconds: testTimeoutInterval) {
            return try await client.processDocument(
                imageData: imageData,
                type: .check,
                format: .image,
                filename: "test-document.jpg"
            )
        }
        
        // Verify the response structure
        XCTAssertEqual(result.documentType, .check, "Document type should be check")
        
        // Verify confidence scores
        XCTAssertGreaterThan(result.confidence.ocr, 0, "OCR confidence should be positive")
        XCTAssertGreaterThan(result.confidence.extraction, 0, "Extraction confidence should be positive")
        XCTAssertGreaterThan(result.confidence.overall, 0, "Overall confidence should be positive")
        
        // Log the response for debugging
        print("Document processing result: type=\(result.documentType.rawValue)")
    }
    
    // Replacement for the previous withTimeout helper
    private func runWithTimeout<T>(seconds: TimeInterval, operation: @escaping () async throws -> T) async throws -> T {
        // Create a new task for the operation
        let operationTask = Task {
            return try await operation()
        }
        
        // Create a timeout task
        let timeoutTask = Task {
            try await Task.sleep(nanoseconds: UInt64(seconds * 1_000_000_000))
            operationTask.cancel()
            throw TimeoutError(seconds: seconds)
        }
        
        do {
            // Wait for the operation to complete
            let result = try await operationTask.value
            // Cancel the timeout task
            timeoutTask.cancel()
            return result
        } catch is CancellationError {
            // If the operation was cancelled, it was likely due to timeout
            throw TimeoutError(seconds: seconds)
        } catch {
            // Operation failed with some other error
            timeoutTask.cancel()
            throw error
        }
    }
    
    // Custom error type for timeout errors
    struct TimeoutError: LocalizedError {
        let seconds: TimeInterval
        
        var errorDescription: String? {
            return "Operation timed out after \(seconds) seconds"
        }
    }
}