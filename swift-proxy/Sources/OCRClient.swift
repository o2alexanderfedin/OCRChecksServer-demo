import Foundation

/// Format type for document processing
public enum DocumentFormat: String {
    case image = "image"
    case pdf = "pdf"
}

/// Document type for universal processing endpoint
public enum DocumentType: String {
    case check = "check"
    case receipt = "receipt"
}

/// Check response returned by the API
public struct CheckResponse: Codable {
    /// Extracted check data
    public let data: Check
    
    /// Confidence scores for the processing
    public let confidence: Confidence
}

/// Receipt response returned by the API
public struct ReceiptResponse: Codable {
    /// Extracted receipt data
    public let data: Receipt
    
    /// Confidence scores for the processing
    public let confidence: Confidence
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

/// Main client for the OCR Checks Server API
public class OCRClient {
    private let baseURL: URL
    private let session: URLSession
    
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
    public init(environment: Environment = .production, session: URLSession = .shared) {
        self.baseURL = environment.url
        self.session = session
    }
    
    // MARK: - API Methods
    
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
        var urlComponents = URLComponents(string: baseURL.appendingPathComponent("check").absoluteString)!
        var queryItems = [URLQueryItem(name: "format", value: format.rawValue)]
        
        if let filename = filename {
            queryItems.append(URLQueryItem(name: "filename", value: filename))
        }
        
        urlComponents.queryItems = queryItems
        
        guard let url = urlComponents.url else {
            completion(.failure(OCRError(error: "Invalid URL")))
            return
        }
        
        performRequest(url: url, imageData: imageData) { (result: Result<CheckResponse, Error>) in
            completion(result)
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
        var urlComponents = URLComponents(string: baseURL.appendingPathComponent("receipt").absoluteString)!
        var queryItems = [URLQueryItem(name: "format", value: format.rawValue)]
        
        if let filename = filename {
            queryItems.append(URLQueryItem(name: "filename", value: filename))
        }
        
        urlComponents.queryItems = queryItems
        
        guard let url = urlComponents.url else {
            completion(.failure(OCRError(error: "Invalid URL")))
            return
        }
        
        performRequest(url: url, imageData: imageData) { (result: Result<ReceiptResponse, Error>) in
            completion(result)
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
            completion(.failure(OCRError(error: "Invalid URL")))
            return
        }
        
        performRequest(url: url, imageData: imageData) { (result: Result<DocumentResponse, Error>) in
            completion(result)
        }
    }
    
    /// Get server health status
    /// - Parameter completion: Completion handler with result
    public func getHealth(completion: @escaping (Result<HealthResponse, Error>) -> Void) {
        let url = baseURL.appendingPathComponent("health")
        
        let task = session.dataTask(with: url) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let httpResponse = response as? HTTPURLResponse else {
                completion(.failure(OCRError(error: "Invalid response")))
                return
            }
            
            guard (200...299).contains(httpResponse.statusCode) else {
                if let data = data, let errorResponse = try? JSONDecoder().decode(OCRError.self, from: data) {
                    completion(.failure(errorResponse))
                } else {
                    completion(.failure(OCRError(error: "HTTP Error: \(httpResponse.statusCode)")))
                }
                return
            }
            
            guard let data = data else {
                completion(.failure(OCRError(error: "No data received")))
                return
            }
            
            do {
                let decoder = JSONDecoder()
                let healthResponse = try decoder.decode(HealthResponse.self, from: data)
                completion(.success(healthResponse))
            } catch {
                completion(.failure(error))
            }
        }
        
        task.resume()
    }
    
    // MARK: - Helper Methods
    
    private func performRequest<T: Decodable>(
        url: URL, 
        imageData: Data, 
        completion: @escaping (Result<T, Error>) -> Void
    ) {
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
        
        let task = session.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let httpResponse = response as? HTTPURLResponse else {
                completion(.failure(OCRError(error: "Invalid response")))
                return
            }
            
            guard (200...299).contains(httpResponse.statusCode) else {
                if let data = data, let errorResponse = try? JSONDecoder().decode(OCRError.self, from: data) {
                    completion(.failure(errorResponse))
                } else {
                    completion(.failure(OCRError(error: "HTTP Error: \(httpResponse.statusCode)")))
                }
                return
            }
            
            guard let data = data else {
                completion(.failure(OCRError(error: "No data received")))
                return
            }
            
            do {
                let decoder = JSONDecoder()
                let decodedResponse = try decoder.decode(T.self, from: data)
                completion(.success(decodedResponse))
            } catch {
                completion(.failure(error))
            }
        }
        
        task.resume()
    }
}