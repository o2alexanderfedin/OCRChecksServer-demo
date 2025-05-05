//
//  NolockOCR.swift
//  NolockOCR
//
//  Created by O2.services on 2025-05-06.
//  Copyright © 2025 Nolock.social. All rights reserved.
//
//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to deal
//  in the Software without restriction, including without limitation the rights
//  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//  copies of the Software, and to permit persons to whom the Software is
//  furnished to do so, subject to the following conditions:
//
//  The above copyright notice and this permission notice shall be included in
//  all copies or substantial portions of the Software.
//
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.
//

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