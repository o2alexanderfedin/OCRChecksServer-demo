import Foundation

/// Type of check
public enum CheckType: String, Codable {
    case personal
    case business
    case cashier
    case certified
    case traveler
    case government
    case payroll
    case moneyOrder = "money_order"
    case other
    
    // Add a fallback case for unknown values
    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        let rawValue = try container.decode(String.self)
        
        if let knownValue = CheckType(rawValue: rawValue) {
            self = knownValue
        } else {
            print("Warning: Unknown CheckType value: '\(rawValue)', defaulting to .other")
            self = .other
        }
    }
}

/// Type of bank account
public enum BankAccountType: String, Codable {
    case checking
    case savings
    case moneyMarket = "money_market"
    case other
    
    // Add a fallback case for unknown values
    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        let rawValue = try container.decode(String.self)
        
        if let knownValue = BankAccountType(rawValue: rawValue) {
            self = knownValue
        } else {
            print("Warning: Unknown BankAccountType value: '\(rawValue)', defaulting to .other")
            self = .other
        }
    }
}

/// Check metadata with confidence and source information
public struct CheckMetadata: Codable {
    /// Overall confidence of extraction (0-1)
    public let confidenceScore: Double
    
    /// Reference to the source image
    public let sourceImageId: String?
    
    /// Provider used for OCR
    public let ocrProvider: String?
    
    /// List of warning messages
    public let warnings: [String]?
}

/// Check data extracted from an image
public struct Check: Codable {
    /// Check number or identifier
    public let checkNumber: String
    
    /// Date on the check (ISO 8601 format)
    public let date: String
    
    /// Person or entity to whom the check is payable
    public let payee: String
    
    /// Person or entity who wrote/signed the check
    public let payer: String?
    
    /// Dollar amount of the check
    public let amount: Double
    
    /// Written text amount of the check
    public let amountText: String?
    
    /// Memo or note on the check
    public let memo: String?
    
    /// Name of the bank issuing the check
    public let bankName: String?
    
    /// Bank routing number (9 digits)
    public let routingNumber: String?
    
    /// Bank account number
    public let accountNumber: String?
    
    /// Type of check
    public let checkType: CheckType?
    
    /// Type of bank account
    public let accountType: BankAccountType?
    
    /// Whether the check appears to be signed
    public let signature: Bool?
    
    /// Text of the signature if readable
    public let signatureText: String?
    
    /// Fractional code on the check
    public let fractionalCode: String?
    
    /// MICR line on the bottom of the check
    public let micrLine: String?
    
    /// Metadata about the check extraction
    public let metadata: CheckMetadata?
    
    /// Confidence score for the check overall
    public let confidence: Double
}

/// Check processing response
public struct CheckResponse: Codable {
    /// Extracted check data
    public let data: Check
    
    /// Confidence scores for processing
    public let confidence: Confidence
}