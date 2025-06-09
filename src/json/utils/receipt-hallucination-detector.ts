/**
 * ReceiptHallucinationDetector - Specialized detector for receipt data hallucinations
 * 
 * This implementation follows SOLID principles by focusing solely on receipt-specific
 * hallucination detection, adhering to the Single Responsibility Principle.
 */

import { injectable } from 'inversify';
import { Receipt } from '../schemas/receipt';
import { HallucinationDetector } from './hallucination-detector';

/**
 * Service for detecting potential hallucinations specifically in receipt data
 * Implements the HallucinationDetector interface for receipt documents
 */
@injectable()
export class ReceiptHallucinationDetector implements HallucinationDetector<Receipt> {
  
  /**
   * Detects potential hallucinations in receipt data
   * 
   * @param receipt - The receipt data to validate
   */
  detect(receipt: Receipt): void {
    // Common hallucinated values specific to receipts
    const suspiciousPatterns = {
      merchantNames: ["Store", "Market", "Supermarket", "Shop", "Restaurant", "ABC Store", "XYZ Market"],
      totals: [0, 10, 15.99, 20, 25, 50, 100, 5.99, 12.99],
      currencies: ["USD", "EUR", "GBP"], // Generic currency without context
      receiptNumbers: ["123", "1234", "001", "100", "R001", "TXN123"],
      itemDescriptions: ["Item", "Product", "Food", "Drink", "Service"],
      addresses: ["123 Main St", "456 Oak Ave", "Address", "Street"]
    };
    
    // Count suspicious matches
    let suspicionScore = 0;
    
    // Check for suspicious merchant name
    if (receipt.merchant && receipt.merchant.name) {
      if (suspiciousPatterns.merchantNames.some(s => receipt.merchant?.name === s || receipt.merchant?.name?.includes(s))) {
        suspicionScore++;
      }
    } else if (receipt.totals && parseFloat(receipt.totals.total) > 0) {
      // Empty merchant name but has total - suspicious
      suspicionScore++;
    }
    
    // Check for suspicious total amounts
    if (receipt.totals && suspiciousPatterns.totals.includes(parseFloat(receipt.totals.total))) {
      suspicionScore++;
    }
    
    // Check for suspicious currency without merchant context
    if (receipt.currency && receipt.currency.length === 3 && 
        (!receipt.merchant?.name || suspiciousPatterns.merchantNames.includes(receipt.merchant.name))) {
      suspicionScore++;
    }
    
    // Check for suspicious receipt number
    if (receipt.receiptNumber && suspiciousPatterns.receiptNumbers.includes(receipt.receiptNumber)) {
      suspicionScore++;
    }
    
    // Check for suspicious merchant address
    if (receipt.merchant?.address && suspiciousPatterns.addresses.some(a => receipt.merchant?.address?.includes(a))) {
      suspicionScore++;
    }
    
    // Check item descriptions for generic terms
    if (receipt.items && receipt.items.length > 0) {
      const suspiciousItems = receipt.items.filter(item => 
        suspiciousPatterns.itemDescriptions.some(desc => item.description === desc || item.description.includes(desc))
      );
      if (suspiciousItems.length > 0) {
        suspicionScore++;
      }
    }
    
    // Check item count (0 or 1 items but with significant total is suspicious)
    if (receipt.items && receipt.items.length <= 1 && receipt.totals && parseFloat(receipt.totals.total) > 20) {
      suspicionScore++;
    }
    
    // Check for unrealistic combinations
    if (receipt.merchant?.name === "Store" && receipt.totals?.total === "10" && receipt.items?.length === 1) {
      suspicionScore += 2; // This exact combination is highly suspicious
    }
    
    // If input data is minimal but results are rich, that's suspicious
    const hasRichOutput = receipt.merchant?.name || (receipt.totals && parseFloat(receipt.totals.total) > 0) || (receipt.items && receipt.items.length > 0);
    const hasMinimalInput = !receipt.merchant?.address && !receipt.merchant?.phone && (!receipt.items || receipt.items.length === 0);
    if (hasRichOutput && hasMinimalInput && receipt.totals && parseFloat(receipt.totals.total) > 0) {
      suspicionScore++;
    }
    
    // Check for missing timestamp with other data present
    if (!receipt.timestamp && receipt.totals && parseFloat(receipt.totals.total) > 0 && receipt.merchant?.name) {
      suspicionScore++;
    }
    
    // If multiple suspicious patterns match, likely hallucination
    if (suspicionScore >= 2) {
      // Mark as invalid input
      receipt.isValidInput = false;
      
      // Reduce confidence significantly
      receipt.confidence = Math.min(receipt.confidence || 0, 0.3);
      
      console.log(`Potential receipt hallucination detected (suspicion score: ${suspicionScore})`);
    } else {
      // Mark as valid unless explicitly set otherwise
      receipt.isValidInput = receipt.isValidInput !== false;
    }
  }
}