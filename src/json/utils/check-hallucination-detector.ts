/**
 * CheckHallucinationDetector - Specialized detector for check data hallucinations
 * 
 * This implementation follows SOLID principles by focusing solely on check-specific
 * hallucination detection, adhering to the Single Responsibility Principle.
 */

import { injectable } from 'inversify';
import { Check } from '../schemas/check';
import { HallucinationDetector } from './hallucination-detector';

/**
 * Service for detecting potential hallucinations specifically in check data
 * Implements the HallucinationDetector interface for check documents
 */
@injectable()
export class CheckHallucinationDetector implements HallucinationDetector<Check> {
  
  /**
   * Detects potential hallucinations in check data
   * 
   * @param check - The check data to validate
   */
  detect(check: Check): void {
    // Common hallucinated values specific to checks
    const suspiciousPatterns = {
      checkNumbers: ["1234", "5678", "0000", "1001", "100", "123"],
      payees: ["John Doe", "Jane Doe", "John Smith", "Jane Smith", "ABC Company", "XYZ Corp"],
      payers: ["John Doe", "Jane Doe", "John Smith", "Jane Smith"],
      amounts: [100, 150.75, 200, 500, 1000, 50, 25],
      dates: ["2023-10-05", "2024-01-05", "2023-01-01", "2024-01-01"],
      bankNames: ["Bank", "First Bank", "National Bank", "City Bank"],
      routingNumbers: ["123456789", "000000000", "111111111"]
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
    
    // Check for suspicious payer
    if (check.payer && suspiciousPatterns.payers.some(p => check.payer?.includes(p))) {
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
    
    // Check for suspicious bank name
    if (check.bankName && suspiciousPatterns.bankNames.some(b => check.bankName?.includes(b))) {
      suspicionScore++;
    }
    
    // Check for suspicious routing number
    if (check.routingNumber && suspiciousPatterns.routingNumbers.includes(check.routingNumber)) {
      suspicionScore++;
    }
    
    // Check for unrealistic combinations
    if (check.checkNumber === "1234" && check.payee === "John Doe" && check.amount === "100") {
      suspicionScore += 2; // This exact combination is highly suspicious
    }
    
    // Check for missing critical fields that should be present
    if (check.amount && parseFloat(check.amount) > 0 && !check.payee && !check.payer) {
      suspicionScore++; // Amount without payee/payer is suspicious
    }
    
    // If multiple suspicious patterns match, likely hallucination
    if (suspicionScore >= 2) {
      // Mark as invalid input
      check.isValidInput = false;
      
      // Reduce confidence significantly
      check.confidence = Math.min(check.confidence || 0, 0.3);
      
      console.log(`Potential check hallucination detected (suspicion score: ${suspicionScore})`);
    } else {
      // Mark as valid unless explicitly set otherwise
      check.isValidInput = check.isValidInput !== false;
    }
  }
}