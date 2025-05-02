import Foundation

/// Format type for document processing
public enum DocumentFormat: String {
    case image = "image"
    case pdf = "pdf"
}

/// Document type for universal processing endpoint
public enum DocumentType: String, Codable {
    case check = "check"
    case receipt = "receipt"
}

/// Universal document processing response
public struct DocumentResponse: Codable {
    /// Extracted document data (either Check or Receipt)
    public let data: Codable
    
    /// Type of document processed
    public let documentType: DocumentType
    
    /// Confidence scores for the processing
    public let confidence: Confidence
    
    enum CodingKeys: String, CodingKey {
        case data
        case documentType
        case confidence
    }
    
    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        documentType = try container.decode(DocumentType.self, forKey: .documentType)
        confidence = try container.decode(Confidence.self, forKey: .confidence)
        
        // Decode the data based on documentType
        switch documentType {
        case .check:
            let checkData = try container.decode(Check.self, forKey: .data)
            data = checkData
        case .receipt:
            let receiptData = try container.decode(Receipt.self, forKey: .data)
            data = receiptData
        }
    }
    
    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(documentType, forKey: .documentType)
        try container.encode(confidence, forKey: .confidence)
        
        // Encode data based on its actual type
        if let checkData = data as? Check {
            try container.encode(checkData, forKey: .data)
        } else if let receiptData = data as? Receipt {
            try container.encode(receiptData, forKey: .data)
        } else {
            throw EncodingError.invalidValue(data, EncodingError.Context(
                codingPath: [CodingKeys.data],
                debugDescription: "Data must be either Check or Receipt"
            ))
        }
    }
}

/// Health status response from the API
public struct HealthResponse: Codable {
    /// Server status (always "ok")
    public let status: String
    
    /// Current server time
    public let timestamp: String
    
    /// Server version
    public let version: String
}

// Protocol for using with URLSession mocking
public protocol URLSessionProtocol {
    func data(from url: URL, delegate: URLSessionTaskDelegate?) async throws -> (Data, URLResponse)
    func data(for request: URLRequest, delegate: URLSessionTaskDelegate?) async throws -> (Data, URLResponse)
}

// Extend URLSession to conform to the protocol
extension URLSession: URLSessionProtocol {}

/// Main client for the OCR Checks Server API
public class OCRClient {
    private let baseURL: URL
    private let session: URLSessionProtocol
    
    /// Available server environments for the API
    public enum Environment {
        /// Production server at api.nolock.social
        case production
        
        /// Development server at dev-api.nolock.social
        case development
        
        /// Local development server at http://localhost:8787
        case local
        
        /// Custom server URL
        case custom(URL)
        
        var url: URL {
            switch self {
            case .production:
                return URL(string: "https://api.nolock.social")!
            case .development:
                return URL(string: "https://dev-api.nolock.social")!
            case .local:
                return URL(string: "http://localhost:8787")!
            case .custom(let url):
                return url
            }
        }
    }
    
    /// Initialize a new OCR client with the specified environment
    /// - Parameter environment: The server environment to use
    /// - Parameter session: URLSession for network requests (defaults to shared session)
    public init(environment: Environment = .production, session: URLSessionProtocol = URLSession.shared) {
        self.baseURL = environment.url
        self.session = session
    }
    
    // MARK: - Async/Await API Methods
    
    /// Process a check image using async/await
    /// - Parameters:
    ///   - imageData: The image data to process
    ///   - format: Format of the document (default: .image)
    ///   - filename: Optional filename for the document
    /// - Returns: A CheckResponse containing the processed check data
    /// - Throws: An error if the processing fails
    public func processCheck(
        imageData: Data,
        format: DocumentFormat = .image,
        filename: String? = nil
    ) async throws -> CheckResponse {
        var urlComponents = URLComponents(string: baseURL.appendingPathComponent("check").absoluteString)!
        var queryItems = [URLQueryItem(name: "format", value: format.rawValue)]
        
        if let filename = filename {
            queryItems.append(URLQueryItem(name: "filename", value: filename))
        }
        
        urlComponents.queryItems = queryItems
        
        guard let url = urlComponents.url else {
            throw OCRError(error: "Invalid URL")
        }
        
        return try await performRequest(url: url, imageData: imageData)
    }
    
    /// Process a receipt image using async/await
    /// - Parameters:
    ///   - imageData: The image data to process
    ///   - format: Format of the document (default: .image)
    ///   - filename: Optional filename for the document
    /// - Returns: A ReceiptResponse containing the processed receipt data
    /// - Throws: An error if the processing fails
    public func processReceipt(
        imageData: Data,
        format: DocumentFormat = .image,
        filename: String? = nil
    ) async throws -> ReceiptResponse {
        var urlComponents = URLComponents(string: baseURL.appendingPathComponent("receipt").absoluteString)!
        var queryItems = [URLQueryItem(name: "format", value: format.rawValue)]
        
        if let filename = filename {
            queryItems.append(URLQueryItem(name: "filename", value: filename))
        }
        
        urlComponents.queryItems = queryItems
        
        guard let url = urlComponents.url else {
            throw OCRError(error: "Invalid URL")
        }
        
        return try await performRequest(url: url, imageData: imageData)
    }
    
    /// Process a document as either a check or receipt using async/await
    /// - Parameters:
    ///   - imageData: The image data to process
    ///   - type: Type of document to process
    ///   - format: Format of the document (default: .image)
    ///   - filename: Optional filename for the document
    /// - Returns: A DocumentResponse containing the processed document data
    /// - Throws: An error if the processing fails
    public func processDocument(
        imageData: Data,
        type: DocumentType,
        format: DocumentFormat = .image,
        filename: String? = nil
    ) async throws -> DocumentResponse {
        var urlComponents = URLComponents(string: baseURL.appendingPathComponent("process").absoluteString)!
        var queryItems = [
            URLQueryItem(name: "type", value: type.rawValue),
            URLQueryItem(name: "format", value: format.rawValue)
        ]
        
        if let filename = filename {
            queryItems.append(URLQueryItem(name: "filename", value: filename))
        }
        
        urlComponents.queryItems = queryItems
        
        guard let url = urlComponents.url else {
            throw OCRError(error: "Invalid URL")
        }
        
        return try await performRequest(url: url, imageData: imageData)
    }
    
    /// Get server health status using async/await
    /// - Returns: A HealthResponse containing the server health information
    /// - Throws: An error if the request fails
    public func getHealth() async throws -> HealthResponse {
        let url = baseURL.appendingPathComponent("health")
        
        let (data, response) = try await session.data(from: url, delegate: nil)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw OCRError(error: "Invalid response")
        }
        
        guard (200...299).contains(httpResponse.statusCode) else {
            if let errorResponse = try? JSONDecoder().decode(OCRError.self, from: data) {
                throw errorResponse
            } else {
                throw OCRError(error: "HTTP Error: \(httpResponse.statusCode)")
            }
        }
        
        let decoder = JSONDecoder()
        return try decoder.decode(HealthResponse.self, from: data)
    }
    
    // MARK: - Backward Compatibility Methods with Completion Handlers
    
    /// Process a check image
    /// - Parameters:
    ///   - imageData: The image data to process
    ///   - format: Format of the document (default: .image)
    ///   - filename: Optional filename for the document
    ///   - completion: Completion handler with result
    public func processCheck(
        imageData: Data,
        format: DocumentFormat = .image,
        filename: String? = nil,
        completion: @escaping (Result<CheckResponse, Error>) -> Void
    ) {
        Task {
            do {
                let response = try await processCheck(imageData: imageData, format: format, filename: filename)
                completion(.success(response))
            } catch {
                completion(.failure(error))
            }
        }
    }
    
    /// Process a receipt image
    /// - Parameters:
    ///   - imageData: The image data to process
    ///   - format: Format of the document (default: .image)
    ///   - filename: Optional filename for the document
    ///   - completion: Completion handler with result
    public func processReceipt(
        imageData: Data,
        format: DocumentFormat = .image,
        filename: String? = nil,
        completion: @escaping (Result<ReceiptResponse, Error>) -> Void
    ) {
        Task {
            do {
                let response = try await processReceipt(imageData: imageData, format: format, filename: filename)
                completion(.success(response))
            } catch {
                completion(.failure(error))
            }
        }
    }
    
    /// Process a document as either a check or receipt
    /// - Parameters:
    ///   - imageData: The image data to process
    ///   - type: Type of document to process
    ///   - format: Format of the document (default: .image)
    ///   - filename: Optional filename for the document
    ///   - completion: Completion handler with result
    public func processDocument(
        imageData: Data,
        type: DocumentType,
        format: DocumentFormat = .image,
        filename: String? = nil,
        completion: @escaping (Result<DocumentResponse, Error>) -> Void
    ) {
        Task {
            do {
                let response = try await processDocument(imageData: imageData, type: type, format: format, filename: filename)
                completion(.success(response))
            } catch {
                completion(.failure(error))
            }
        }
    }
    
    /// Get server health status
    /// - Parameter completion: Completion handler with result
    public func getHealth(completion: @escaping (Result<HealthResponse, Error>) -> Void) {
        Task {
            do {
                let response = try await getHealth()
                completion(.success(response))
            } catch {
                completion(.failure(error))
            }
        }
    }
    
    // MARK: - Helper Methods
    
    private func performRequest<T: Decodable>(
        url: URL, 
        imageData: Data
    ) async throws -> T {
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        
        // Generate boundary string for multipart/form-data
        let boundary = UUID().uuidString
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        
        // Create multipart/form-data body
        var body = Data()
        
        // Add image data
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"file\"; filename=\"image.jpg\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
        body.append(imageData)
        body.append("\r\n".data(using: .utf8)!)
        
        // End of multipart/form-data
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        
        request.httpBody = body
        
        let (data, response) = try await session.data(for: request, delegate: nil)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw OCRError(error: "Invalid response")
        }
        
        guard (200...299).contains(httpResponse.statusCode) else {
            if let errorResponse = try? JSONDecoder().decode(OCRError.self, from: data) {
                throw errorResponse
            } else {
                throw OCRError(error: "HTTP Error: \(httpResponse.statusCode)")
            }
        }
        
        let decoder = JSONDecoder()
        return try decoder.decode(T.self, from: data)
    }
}