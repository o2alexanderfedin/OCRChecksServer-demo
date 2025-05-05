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
    
    // MARK: - Test Case Data Structures
    
    /// Defines a test image case
    struct TestImage {
        let filename: String
        let format: DocumentFormat
        let shouldConvert: Bool
        
        // Default values assume JPEG format
        init(filename: String, format: DocumentFormat = .image, shouldConvert: Bool = false) {
            self.filename = filename
            self.format = format
            self.shouldConvert = shouldConvert
        }
    }
    
    /// Defines a test endpoint case
    enum TestEndpoint {
        case check
        case receipt
        case document(DocumentType)
        
        var displayName: String {
            switch self {
            case .check:
                return "check"
            case .receipt:
                return "receipt"
            case .document(let docType):
                return "document-\(docType.rawValue)"
            }
        }
    }
    
    /// Defines a test case for OCR processing
    struct OCRTestCase {
        let name: String
        let image: TestImage
        let endpoint: TestEndpoint
        let expectedValues: [String: Any]
        
        init(name: String, 
             image: TestImage, 
             endpoint: TestEndpoint, 
             expectedValues: [String: Any] = [:]) {
            self.name = name
            self.image = image
            self.endpoint = endpoint
            self.expectedValues = expectedValues
        }
    }
    
    // MARK: - Available Test Images
    
    /// Available test images for data-driven tests
    static let testImages: [String: TestImage] = [
        "standardJPEG": TestImage(filename: "IMG_2388.jpg"),
        "heicImage": TestImage(filename: "IMG_2388.HEIC", shouldConvert: true),
        "telegramImage1": TestImage(filename: "telegram-cloud-photo-size-1-4915775046379745521-y.jpg"),
        "telegramImage2": TestImage(filename: "telegram-cloud-photo-size-1-4915775046379745522-y.jpg")
    ]
    
    // MARK: - Test Cases
    
    /// Test cases for data-driven tests
    lazy var testCases: [OCRTestCase] = [
        // Check endpoint tests
        OCRTestCase(
            name: "Standard JPEG Check Processing",
            image: Self.testImages["standardJPEG"]!,
            endpoint: .check,
            expectedValues: ["amount": 3399.21]
        ),
        OCRTestCase(
            name: "HEIC Format Check Processing",
            image: Self.testImages["heicImage"]!,
            endpoint: .check,
            expectedValues: ["amount": 3399.21]
        ),
        OCRTestCase(
            name: "Telegram Image Check Processing",
            image: Self.testImages["telegramImage1"]!,
            endpoint: .check
        ),
        
        // Receipt endpoint tests
        OCRTestCase(
            name: "Standard JPEG Receipt Processing",
            image: Self.testImages["standardJPEG"]!,
            endpoint: .receipt,
            expectedValues: ["merchant.name": "San Jose Water Company"]
        ),
        OCRTestCase(
            name: "HEIC Format Receipt Processing",
            image: Self.testImages["heicImage"]!,
            endpoint: .receipt
        ),
        
        // Universal endpoint tests
        OCRTestCase(
            name: "Standard JPEG Check Document Processing",
            image: Self.testImages["standardJPEG"]!,
            endpoint: .document(.check)
        ),
        OCRTestCase(
            name: "Standard JPEG Receipt Document Processing",
            image: Self.testImages["standardJPEG"]!,
            endpoint: .document(.receipt)
        ),
        OCRTestCase(
            name: "HEIC Format Document Processing",
            image: Self.testImages["heicImage"]!,
            endpoint: .document(.check)
        )
    ]
    
    // MARK: - Test Configuration
    
    // The environment to test against
    // Get the environment from the OCR_API_URL environment variable
    private var testEnvironment: OCRClient.Environment {
        if let apiUrlString = ProcessInfo.processInfo.environment["OCR_API_URL"] {
            if let apiUrl = URL(string: apiUrlString) {
                return .custom(apiUrl)
            }
        }
        return .local
    }
    
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
        // Get the server URL from environment variable
        let serverUrlString = ProcessInfo.processInfo.environment["OCR_API_URL"] ?? "http://localhost:8789"
        guard let url = URL(string: "\(serverUrlString)/health") else {
            print("Failed to create URL for health check: \(serverUrlString)/health")
            return false
        }
        
        print("Checking server availability at: \(url.absoluteString)")
        
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
    private func loadTestImage(filename: String = "IMG_2388.jpg") -> Data? {
        // Base directories to search for test images
        let baseDirectories = [
            // When running from swift-proxy directory
            "../tests/fixtures/images",
            // When running from project root
            "tests/fixtures/images",
            // When running from Xcode
            "../../tests/fixtures/images",
            // Absolute path (for debugging)
            "/Users/alexanderfedin/Projects/OCRChecksServer/tests/fixtures/images"
        ]
        
        for baseDir in baseDirectories {
            let path = "\(baseDir)/\(filename)"
            if let imageData = try? Data(contentsOf: URL(fileURLWithPath: path)) {
                print("Successfully loaded image from path: \(path)")
                return imageData
            } else {
                print("Failed to load image from path: \(path)")
            }
        }
        
        print("ERROR: Could not find test image \(filename) in any location")
        return nil
    }
    
    // MARK: - Legacy Tests (Kept for backward compatibility)
    
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
    
    // MARK: - Data-Driven Tests
    
    /// Run all test cases using data-driven approach
    func testAllEndpointsWithMultipleImages() async throws {
        // Skip if server is unavailable
        try await skipIfServerUnavailable()
        
        // Create client using the configured environment
        let client = OCRClient(environment: testEnvironment)
        
        // Run each test case individually wrapped in its own try-catch
        // so that one failure doesn't stop all tests
        for testCase in testCases {
            do {
                try await runTestCase(testCase, with: client)
            } catch {
                // Log the error but continue with other test cases
                print("Error in test case \(testCase.name): \(error)")
                XCTFail("Test case \(testCase.name) failed with error: \(error)")
            }
        }
    }
    
    /// Run an individual test case
    private func runTestCase(_ testCase: OCRTestCase, with client: OCRClient) async throws {
        print("\n--- Running test case: \(testCase.name) ---")
        
        // Skip the test if the image file is not available
        guard let imageData = loadTestImage(filename: testCase.image.filename) else {
            print("Skipping \(testCase.name) - Image not available: \(testCase.image.filename)")
            return
        }
        
        // Generate a descriptive filename for the server
        let serverFilename = "test-\(testCase.endpoint.displayName)-\(UUID().uuidString.prefix(8)).\(testCase.image.filename.split(separator: ".").last ?? "jpg")"
        
        // Process the image with the appropriate endpoint
        switch testCase.endpoint {
        case .check:
            let result = try await processCheck(client: client, 
                                               imageData: imageData, 
                                               format: testCase.image.format, 
                                               filename: serverFilename)
            verifyCheckResult(result, expectedValues: testCase.expectedValues)
            
        case .receipt:
            let result = try await processReceipt(client: client, 
                                                 imageData: imageData, 
                                                 format: testCase.image.format, 
                                                 filename: serverFilename)
            verifyReceiptResult(result, expectedValues: testCase.expectedValues)
            
        case .document(let docType):
            let result = try await processDocument(client: client, 
                                                  imageData: imageData, 
                                                  type: docType,
                                                  format: testCase.image.format, 
                                                  filename: serverFilename)
            verifyDocumentResult(result, expectedValues: testCase.expectedValues)
        }
        
        print("✓ Test case passed: \(testCase.name)")
    }
    
    // MARK: - Processing Methods
    
    /// Process an image as a check
    private func processCheck(client: OCRClient, 
                             imageData: Data, 
                             format: DocumentFormat, 
                             filename: String) async throws -> CheckResponse {
        return try await runWithTimeout(seconds: testTimeoutInterval) {
            return try await client.processCheck(
                imageData: imageData,
                format: format,
                filename: filename
            )
        }
    }
    
    /// Process an image as a receipt
    private func processReceipt(client: OCRClient, 
                               imageData: Data, 
                               format: DocumentFormat, 
                               filename: String) async throws -> ReceiptResponse {
        return try await runWithTimeout(seconds: testTimeoutInterval) {
            return try await client.processReceipt(
                imageData: imageData,
                format: format,
                filename: filename
            )
        }
    }
    
    /// Process an image as a universal document
    private func processDocument(client: OCRClient, 
                                imageData: Data, 
                                type: DocumentType,
                                format: DocumentFormat, 
                                filename: String) async throws -> DocumentResponse {
        return try await runWithTimeout(seconds: testTimeoutInterval) {
            return try await client.processDocument(
                imageData: imageData,
                type: type,
                format: format,
                filename: filename
            )
        }
    }
    
    // MARK: - Verification Methods
    
    /// Verify check processing results
    private func verifyCheckResult(_ result: CheckResponse, expectedValues: [String: Any]) {
        // Common validations
        XCTAssertGreaterThan(result.confidence.ocr, 0, "OCR confidence should be positive")
        XCTAssertGreaterThan(result.confidence.extraction, 0, "Extraction confidence should be positive")
        XCTAssertGreaterThan(result.confidence.overall, 0, "Overall confidence should be positive")
        
        // Specific validations from expected values
        for (key, expectedValue) in expectedValues {
            switch key {
            case "checkNumber":
                if let expected = expectedValue as? String {
                    XCTAssertEqual(result.data.checkNumber, expected, "Check number should match expected value")
                }
            case "amount":
                if let expected = expectedValue as? Double {
                    XCTAssertEqual(result.data.amount, expected, accuracy: 0.01, "Amount should match expected value")
                }
            case "date":
                if let expected = expectedValue as? String {
                    XCTAssertEqual(result.data.date, expected, "Date should match expected value")
                }
            case "payee":
                if let expected = expectedValue as? String {
                    XCTAssertEqual(result.data.payee, expected, "Payee should match expected value")
                }
            default:
                print("Warning: Unhandled expected value key for check: \(key)")
            }
        }
        
        // Log the response for debugging
        print("Check processing result: number=\(result.data.checkNumber), amount=\(result.data.amount)")
    }
    
    /// Verify receipt processing results
    private func verifyReceiptResult(_ result: ReceiptResponse, expectedValues: [String: Any]) {
        // Common validations
        XCTAssertGreaterThan(result.confidence.ocr, 0, "OCR confidence should be positive")
        XCTAssertGreaterThan(result.confidence.extraction, 0, "Extraction confidence should be positive")
        XCTAssertGreaterThan(result.confidence.overall, 0, "Overall confidence should be positive")
        
        // Specific validations from expected values
        for (key, expectedValue) in expectedValues {
            switch key {
            case "merchant.name":
                if let expected = expectedValue as? String {
                    XCTAssertEqual(result.data.merchant.name, expected, "Merchant name should match expected value")
                }
            case "totals.total":
                if let expected = expectedValue as? Double {
                    XCTAssertEqual(result.data.totals.total, expected, accuracy: 0.01, "Total amount should match expected value")
                }
            case "timestamp":
                if let expected = expectedValue as? String {
                    XCTAssertEqual(result.data.timestamp, expected, "Timestamp should match expected value")
                }
            default:
                print("Warning: Unhandled expected value key for receipt: \(key)")
            }
        }
        
        // Log the response for debugging
        print("Receipt processing result: merchant=\(result.data.merchant.name), total=\(result.data.totals.total)")
    }
    
    /// Verify document processing results
    private func verifyDocumentResult(_ result: DocumentResponse, expectedValues: [String: Any]) {
        // Common validations
        XCTAssertGreaterThan(result.confidence.ocr, 0, "OCR confidence should be positive")
        XCTAssertGreaterThan(result.confidence.extraction, 0, "Extraction confidence should be positive")
        XCTAssertGreaterThan(result.confidence.overall, 0, "Overall confidence should be positive")
        
        // Specific validations from expected values
        for (key, expectedValue) in expectedValues {
            switch key {
            case "documentType":
                if let expected = expectedValue as? String, let expectedType = DocumentType(rawValue: expected) {
                    XCTAssertEqual(result.documentType, expectedType, "Document type should match expected value")
                }
            default:
                print("Warning: Unhandled expected value key for document: \(key)")
            }
        }
        
        // Log the response for debugging
        print("Document processing result: type=\(result.documentType.rawValue)")
    }
    
    // MARK: - Timeout Handling
    
    // Timeout helper for async operations
    private func runWithTimeout<T>(seconds: TimeInterval, operation: @escaping () async throws -> T) async throws -> T {
        // Create a new task for the operation
        let operationTask = Task {
            do {
                return try await operation()
            } catch {
                print("Original error: \(error)")
                if let ocrError = error as? OCRError {
                    print("OCR Error details: \(ocrError.error)")
                }
                throw error
            }
        }
        
        // Create a timeout task
        let timeoutTask = Task {
            try await Task.sleep(nanoseconds: UInt64(seconds * 1_000_000_000))
            print("TIMEOUT: Operation took longer than \(seconds) seconds")
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
            print("Operation was cancelled - likely due to timeout")
            throw TimeoutError(seconds: seconds)
        } catch {
            // Operation failed with some other error
            timeoutTask.cancel()
            print("Operation failed with error: \(error)")
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