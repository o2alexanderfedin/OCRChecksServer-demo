import Foundation

/// Main module entry point that provides access to the OCR client
public struct NolockOCR {
    /// Create a new OCR client with the specified environment
    /// - Parameter environment: Server environment to use
    /// - Parameter session: URLSession for network requests (defaults to shared session)
    /// - Returns: Configured OCRClient instance
    public static func createClient(
        environment: OCRClient.Environment = .production,
        session: URLSession = .shared
    ) -> OCRClient {
        return OCRClient(environment: environment, session: session)
    }
    
    /// Create a client for the production environment
    /// - Returns: OCRClient configured for production
    public static func productionClient() -> OCRClient {
        return OCRClient(environment: .production)
    }
    
    /// Create a client for the development environment
    /// - Returns: OCRClient configured for development
    public static func developmentClient() -> OCRClient {
        return OCRClient(environment: .development)
    }
    
    /// Create a client for local testing
    /// - Returns: OCRClient configured for localhost
    public static func localClient() -> OCRClient {
        return OCRClient(environment: .local)
    }
}