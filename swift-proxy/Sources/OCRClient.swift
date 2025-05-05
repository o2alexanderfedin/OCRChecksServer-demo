import Foundation

// Required for image processing
#if canImport(UIKit) && !os(macOS)
import UIKit
#endif

#if canImport(AppKit) && os(macOS)
import AppKit
import ImageIO
import CoreFoundation
#endif

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
        
        /// Local development server at http://localhost:8789
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
                return URL(string: "http://localhost:8789")!
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
            // Print the response body for debugging
            let responseString = String(data: data, encoding: .utf8) ?? "Unable to decode response"
            print("HTTP Error \(httpResponse.statusCode): \(responseString)")
            
            if let errorResponse = try? JSONDecoder().decode(OCRError.self, from: data) {
                throw errorResponse
            } else {
                throw OCRError(error: "HTTP Error: \(httpResponse.statusCode) - \(responseString)")
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
        
        // Process the image data - convert HEIC to JPEG if needed
        let processedData = try processImageData(imageData)
        
        // Set the Content-Type to image/jpeg as expected by the server
        request.setValue("image/jpeg", forHTTPHeaderField: "Content-Type")
        
        // Set the processed image data as the body
        request.httpBody = processedData
        
        // Print debug information
        print("Sending request to URL: \(url.absoluteString)")
        print("Content-Type: image/jpeg")
        print("Image data size: \(processedData.count) bytes")
        
        let (data, response) = try await session.data(for: request, delegate: nil)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw OCRError(error: "Invalid response")
        }
        
        guard (200...299).contains(httpResponse.statusCode) else {
            // Print the response body for debugging
            let responseString = String(data: data, encoding: .utf8) ?? "Unable to decode response"
            print("HTTP Error \(httpResponse.statusCode): \(responseString)")
            
            if let errorResponse = try? JSONDecoder().decode(OCRError.self, from: data) {
                throw errorResponse
            } else {
                throw OCRError(error: "HTTP Error: \(httpResponse.statusCode) - \(responseString)")
            }
        }
        
        let decoder = JSONDecoder()
        return try decoder.decode(T.self, from: data)
    }
    
    /// Process image data before sending to server
    /// - Converts HEIC images to JPEG
    /// - Returns original data for already supported formats
    private func processImageData(_ imageData: Data) throws -> Data {
        // Check if this is a HEIC image
        let isHEIC = isHEICFormat(imageData)
        
        if isHEIC {
            print("Converting HEIC image to JPEG format")
            
            #if canImport(UIKit) && !os(macOS)
            // iOS approach - Use UIKit
            if let image = UIImage(data: imageData) {
                // Convert to JPEG with high quality
                if let jpegData = image.jpegData(compressionQuality: 0.9) {
                    print("HEIC conversion successful: \(imageData.count) bytes → \(jpegData.count) bytes")
                    return jpegData
                }
                throw OCRError(error: "Failed to convert HEIC to JPEG")
            }
            throw OCRError(error: "Failed to create UIImage from HEIC data")
            
            #elseif canImport(AppKit) && os(macOS)
            // macOS approach - Use AppKit and ImageIO
            if let imageSource = CGImageSourceCreateWithData(imageData as CFData, nil),
               let cgImage = CGImageSourceCreateImageAtIndex(imageSource, 0, nil) {
                
                let nsImage = NSImage(cgImage: cgImage, size: .zero)
                if let tiffData = nsImage.tiffRepresentation,
                   let bitmap = NSBitmapImageRep(data: tiffData),
                   let jpegData = bitmap.representation(using: .jpeg, properties: [.compressionFactor: 0.9]) {
                    print("HEIC conversion successful: \(imageData.count) bytes → \(jpegData.count) bytes")
                    return jpegData
                }
                throw OCRError(error: "Failed to convert HEIC to JPEG")
            }
            throw OCRError(error: "Failed to create image from HEIC data")
            
            #else
            // For other platforms, provide a warning
            print("Warning: HEIC conversion is not supported on this platform. Image may not be processed correctly.")
            return imageData
            #endif
        }
        
        // Return original data for already supported formats
        return imageData
    }
    
    /// Check if the provided data is in HEIC format
    private func isHEICFormat(_ imageData: Data) -> Bool {
        // HEIC files start with the 'ftyp' box followed by a brand like 'heic', 'heix', 'hevc', 'hevx'
        // We'll check for the 'ftyp' marker followed by one of these brands
        
        // Need at least 12 bytes to check the format
        guard imageData.count >= 12 else { return false }
        
        // HEIC format check
        // The 'ftyp' box is at position 4, and the brand follows it
        let ftypRange = 4..<8
        let brandRange = 8..<12
        
        if let ftypString = String(data: imageData.subdata(in: ftypRange), encoding: .ascii),
           ftypString == "ftyp" {
            
            if let brandString = String(data: imageData.subdata(in: brandRange), encoding: .ascii) {
                // Check for HEIC related brands
                let heicBrands = ["heic", "heix", "hevc", "hevx"]
                for brand in heicBrands {
                    if brandString.hasPrefix(brand) {
                        return true
                    }
                }
            }
        }
        
        return false
    }
}