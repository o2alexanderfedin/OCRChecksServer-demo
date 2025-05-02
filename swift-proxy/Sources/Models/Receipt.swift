import Foundation

/// Type of receipt
public enum ReceiptType: String, Codable {
    case sale
    case `return`
    case refund
    case estimate
    case proforma
    case other
}

/// Method of payment
public enum PaymentMethod: String, Codable {
    case credit
    case debit
    case cash
    case check
    case giftCard = "gift_card"
    case storeCredit = "store_credit"
    case mobilePayment = "mobile_payment"
    case other
}

/// Type of payment card
public enum CardType: String, Codable {
    case visa
    case mastercard
    case amex
    case discover
    case dinersClub = "diners_club"
    case jcb
    case unionPay = "union_pay"
    case other
}

/// Type of tax
public enum TaxType: String, Codable {
    case sales
    case vat
    case gst
    case pst
    case hst
    case excise
    case service
    case other
}

/// Format type of receipt
public enum ReceiptFormat: String, Codable {
    case retail
    case restaurant
    case service
    case utility
    case transportation
    case accommodation
    case other
}

/// Unit of measurement
public enum UnitOfMeasure: String, Codable {
    case ea
    case kg
    case g
    case lb
    case oz
    case l
    case ml
    case gal
    case pc
    case pr
    case pk
    case box
    case other
}

/// Merchant information
public struct MerchantInfo: Codable {
    /// Name of the merchant or store
    public let name: String
    
    /// Physical address of the merchant
    public let address: String?
    
    /// Contact phone number
    public let phone: String?
    
    /// Website URL
    public let website: String?
    
    /// Tax identification number
    public let taxId: String?
    
    /// Store or branch identifier
    public let storeId: String?
    
    /// Name of the store chain if applicable
    public let chainName: String?
}

/// Receipt totals information
public struct ReceiptTotals: Codable {
    /// Pre-tax total amount
    public let subtotal: Double?
    
    /// Total tax amount
    public let tax: Double?
    
    /// Tip/gratuity amount
    public let tip: Double?
    
    /// Total discount amount
    public let discount: Double?
    
    /// Final total amount
    public let total: Double
}

/// Line item on the receipt
public struct ReceiptLineItem: Codable {
    /// Item description or name
    public let description: String
    
    /// Stock keeping unit or product code
    public let sku: String?
    
    /// Quantity purchased
    public let quantity: Double?
    
    /// Unit of measurement
    public let unit: String?
    
    /// Price per unit
    public let unitPrice: Double?
    
    /// Total price for this line item
    public let totalPrice: Double
    
    /// Whether the item was discounted
    public let discounted: Bool?
    
    /// Amount of discount applied
    public let discountAmount: Double?
    
    /// Product category
    public let category: String?
}

/// Tax item on a receipt
public struct ReceiptTaxItem: Codable {
    /// Name of tax (e.g., 'VAT', 'Sales Tax')
    public let taxName: String
    
    /// Type of tax
    public let taxType: String?
    
    /// Tax rate as decimal (e.g., 0.1 for 10%)
    public let taxRate: Double?
    
    /// Tax amount
    public let taxAmount: Double
}

/// Payment method used on a receipt
public struct ReceiptPaymentMethod: Codable {
    /// Method of payment
    public let method: PaymentMethod
    
    /// Type of card
    public let cardType: String?
    
    /// Last 4 digits of payment card
    public let lastDigits: String?
    
    /// Amount paid with this method
    public let amount: Double
    
    /// Payment transaction ID
    public let transactionId: String?
}

/// Receipt metadata information
public struct ReceiptMetadata: Codable {
    /// Overall confidence of extraction (0-1)
    public let confidenceScore: Double
    
    /// ISO currency code detected
    public let currency: String?
    
    /// ISO language code of the receipt
    public let languageCode: String?
    
    /// Time zone identifier
    public let timeZone: String?
    
    /// Format type of receipt
    public let receiptFormat: ReceiptFormat?
    
    /// Reference to the source image
    public let sourceImageId: String?
    
    /// List of warning messages
    public let warnings: [String]?
}

/// Receipt data extracted from an image
public struct Receipt: Codable {
    /// Merchant information
    public let merchant: MerchantInfo
    
    /// Receipt or invoice number
    public let receiptNumber: String?
    
    /// Type of receipt
    public let receiptType: ReceiptType?
    
    /// Date and time of transaction (ISO 8601 format)
    public let timestamp: String
    
    /// Method of payment
    public let paymentMethod: String?
    
    /// Totals information
    public let totals: ReceiptTotals
    
    /// 3-letter ISO currency code
    public let currency: String
    
    /// List of line items on the receipt
    public let items: [ReceiptLineItem]?
    
    /// Breakdown of taxes
    public let taxes: [ReceiptTaxItem]?
    
    /// Details about payment methods used
    public let payments: [ReceiptPaymentMethod]?
    
    /// Additional notes or comments
    public let notes: [String]?
    
    /// Metadata about the receipt extraction
    public let metadata: ReceiptMetadata?
    
    /// Confidence score for the receipt overall
    public let confidence: Double
}

/// Receipt processing response
public struct ReceiptResponse: Codable {
    /// Extracted receipt data
    public let data: Receipt
    
    /// Confidence scores for processing
    public let confidence: Confidence
}