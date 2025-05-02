import Foundation

/// Confidence scores for the OCR process and data extraction
public struct Confidence: Codable {
    /// OCR process confidence score (0-1)
    public let ocr: Double
    
    /// Data extraction confidence score (0-1)
    public let extraction: Double
    
    /// Overall confidence score (0-1)
    public let overall: Double
}

/// Error response returned by the API
public struct OCRError: Codable, Error {
    /// Error message
    public let error: String
}