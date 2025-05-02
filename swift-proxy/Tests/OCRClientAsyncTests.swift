import XCTest
@testable import NolockOCR

class OCRClientAsyncTests: XCTestCase {
    static var allTests = [
        ("testGetHealthAsync", testGetHealthAsync),
        ("testProcessCheckAsync", testProcessCheckAsync),
        ("testCompletionHandlerCompatibility", testCompletionHandlerCompatibility)
    ]
    // Mock success response to simulate URLSession responses
    private func mockSuccessResponse<T: Encodable>(data: T) -> (Data, URLResponse) {
        let jsonData = try! JSONEncoder().encode(data)
        let response = HTTPURLResponse(
            url: URL(string: "https://api.nolock.social")!,
            statusCode: 200,
            httpVersion: nil,
            headerFields: ["Content-Type": "application/json"]
        )!
        return (jsonData, response)
    }
    
    // Test the getHealth async method
    func testGetHealthAsync() async throws {
        // Create a mock URLSession
        let mockSession = URLSessionMock()
        let client = OCRClient(environment: .production, session: mockSession)
        
        // Mock response
        let healthResponse = HealthResponse(
            status: "ok",
            timestamp: "2025-05-24T10:30:00Z",
            version: "1.18.0"
        )
        mockSession.nextResponse = mockSuccessResponse(data: healthResponse)
        
        // Test the async method
        let result = try await client.getHealth()
        
        // Verify results
        XCTAssertEqual(result.status, "ok")
        XCTAssertEqual(result.version, "1.18.0")
        XCTAssertEqual(result.timestamp, "2025-05-24T10:30:00Z")
    }
    
    // Test the processCheck async method
    func testProcessCheckAsync() async throws {
        // Create a mock URLSession
        let mockSession = URLSessionMock()
        let client = OCRClient(environment: .production, session: mockSession)
        
        // Mock response
        let checkData = Check(
            checkNumber: "1234",
            date: "2025-05-01",
            payee: "John Doe",
            payer: "ACME Corp",
            amount: 250.00,
            amountText: "Two hundred fifty dollars",
            memo: "Invoice #12345",
            bankName: "First Bank",
            routingNumber: "123456789",
            accountNumber: "987654321",
            checkType: nil,
            accountType: nil,
            signature: true,
            signatureText: nil,
            fractionalCode: nil,
            micrLine: nil,
            metadata: nil,
            confidence: 0.95
        )
        
        let confidence = Confidence(ocr: 0.98, extraction: 0.95, overall: 0.92)
        let checkResponse = CheckResponse(data: checkData, confidence: confidence)
        
        mockSession.nextResponse = mockSuccessResponse(data: checkResponse)
        
        // Test the async method with some image data
        let imageData = Data([0, 1, 2, 3, 4]) // Dummy image data
        let result = try await client.processCheck(imageData: imageData)
        
        // Verify results
        XCTAssertEqual(result.data.checkNumber, "1234")
        XCTAssertEqual(result.data.payee, "John Doe")
        XCTAssertEqual(result.data.amount, 250.00)
        XCTAssertEqual(result.confidence.overall, 0.92)
    }
    
    // Test the backward compatibility with completion handlers
    func testCompletionHandlerCompatibility() async throws {
        // Create a mock URLSession
        let mockSession = URLSessionMock()
        let client = OCRClient(environment: .production, session: mockSession)
        
        // Mock response
        let healthResponse = HealthResponse(
            status: "ok",
            timestamp: "2025-05-24T10:30:00Z",
            version: "1.18.0"
        )
        mockSession.nextResponse = mockSuccessResponse(data: healthResponse)
        
        // Test using completion handler
        let expectation = XCTestExpectation(description: "Completion handler called")
        
        client.getHealth { result in
            switch result {
            case .success(let response):
                XCTAssertEqual(response.status, "ok")
                XCTAssertEqual(response.version, "1.18.0")
                expectation.fulfill()
            case .failure:
                XCTFail("Should not fail")
            }
        }
        
        // Wait for the expectation to be fulfilled
        await fulfillment(of: [expectation], timeout: 1.0)
    }
}

// Simple mock URLSession for testing
class URLSessionMock: URLSessionProtocol {
    var nextResponse: (Data, URLResponse)!
    var nextError: Error?
    
    func data(from url: URL, delegate: URLSessionTaskDelegate? = nil) async throws -> (Data, URLResponse) {
        if let error = nextError {
            throw error
        }
        return nextResponse
    }
    
    func data(for request: URLRequest, delegate: URLSessionTaskDelegate? = nil) async throws -> (Data, URLResponse) {
        if let error = nextError {
            throw error
        }
        return nextResponse
    }
}