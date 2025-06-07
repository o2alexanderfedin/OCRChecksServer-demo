/**
 * AntiHallucinationDetector - Shared utility for detecting potential AI hallucinations
 * 
 * This utility class provides methods to detect suspicious patterns in extracted data
 * that might indicate AI hallucinations, applying the same detection logic across
 * different extractor implementations.
 */

import { injectable } from 'inversify';
import { Check } from '../schemas/check';
import { Receipt } from '../schemas/receipt';

/**
 * Service for detecting potential hallucinations in extracted JSON data
 * Implements SOLID principles with single responsibility for hallucination detection
 */
@injectable()
export class AntiHallucinationDetector {
  
  /**
   * Detects potential hallucinations in check data
   * 
   * @param check - The check data to validate
   */
  detectCheckHallucinations(check: Check): void {
    // Common hallucinated values
    const suspiciousPatterns = {
      checkNumbers: ["1234", "5678", "0000"],
      payees: ["John Doe", "Jane Doe", "John Smith"],
      amounts: [100, 150.75, 200, 500],
      dates: ["2023-10-05", "2024-01-05"]
    };
    
    // Count suspicious matches
    let suspicionScore = 0;
    
    // Check for suspicious check number
    if (check.checkNumber && suspiciousPatterns.checkNumbers.includes(check.checkNumber)) {
      suspicionScore++;
    }
    
    // Check for suspicious payee
    if (check.payee && suspiciousPatterns.payees.some(p => check.payee?.includes(p))) {
      suspicionScore++;
    }
    
    // Check for suspicious amount
    if (check.amount && suspiciousPatterns.amounts.includes(parseFloat(check.amount))) {
      suspicionScore++;
    }
    
    // Check for suspicious date
    if (check.date) {
      const dateStr = typeof check.date === 'string' ? check.date : check.date.toISOString().split('T')[0];
      if (suspiciousPatterns.dates.includes(dateStr)) {
        suspicionScore++;
      }
    }
    
    // If multiple suspicious patterns match, likely hallucination
    if (suspicionScore >= 2) {
      // Mark as invalid input
      check.isValidInput = false;
      
      // Reduce confidence significantly
      check.confidence = Math.min(check.confidence || 0, 0.3);
      
      console.log(`Potential hallucination detected in check data (suspicion score: ${suspicionScore})`);
    } else {
      // Mark as valid unless explicitly set otherwise
      check.isValidInput = check.isValidInput !== false;
    }
  }

  /**
   * Detects potential hallucinations in receipt data
   * 
   * @param receipt - The receipt data to validate
   */
  detectReceiptHallucinations(receipt: Receipt): void {
    // Common hallucinated values and suspicious patterns
    const suspiciousPatterns = {
      stores: ["Store", "Market", "Supermarket", "Shop"],
      totals: [0, 10, 15.99, 20, 25, 50, 100],
      currencies: ["USD", "EUR", "GBP"],
      itemCounts: [0, 1], // Having exactly 0 or 1 items is suspicious for hallucination
      emptyMerchant: true // Having an empty merchant name but other fields filled is suspicious
    };
    
    // Count suspicious matches
    let suspicionScore = 0;
    
    // Check for suspicious merchant name
    if (receipt.merchant && receipt.merchant.name) {
      if (suspiciousPatterns.stores.some(s => receipt.merchant?.name === s)) {
        suspicionScore++;
      }
    } else if (receipt.totals && parseFloat(receipt.totals.total) > 0) {
      // Empty merchant name but has total - suspicious
      suspicionScore++;
    }
    
    // Check for suspicious total
    if (receipt.totals && suspiciousPatterns.totals.includes(parseFloat(receipt.totals.total))) {
      suspicionScore++;
    }
    
    // Check for suspicious currency
    if (receipt.currency && receipt.currency.length === 3 && !receipt.merchant?.name) {
      suspicionScore++;
    }
    
    // Check item count (0 or 1 items but with total is suspicious)
    if (receipt.items && receipt.items.length <= 1 && receipt.totals && parseFloat(receipt.totals.total) > 0) {
      suspicionScore++;
    }
    
    // If input data is minimal but results are rich, that's suspicious
    const hasRichOutput = receipt.merchant?.name || (receipt.totals && parseFloat(receipt.totals.total) > 0);
    const hasMinimalInput = !receipt.merchant?.address && !receipt.merchant?.phone && !receipt.items?.length;
    if (hasRichOutput && hasMinimalInput) {
      suspicionScore++;
    }
    
    // If multiple suspicious patterns match, likely hallucination
    if (suspicionScore >= 2) {
      // Mark as invalid input
      receipt.isValidInput = false;
      
      // Reduce confidence significantly
      receipt.confidence = Math.min(receipt.confidence || 0, 0.3);
      
      console.log(`Potential hallucination detected in receipt data (suspicion score: ${suspicionScore})`);
    } else {
      // Mark as valid unless explicitly set otherwise
      receipt.isValidInput = receipt.isValidInput !== false;
    }
  }
}