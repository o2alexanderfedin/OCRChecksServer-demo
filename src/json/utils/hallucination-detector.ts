/**
 * HallucinationDetector - Base interface for document-specific hallucination detection
 * 
 * This interface follows SOLID principles by providing a common contract
 * for different types of hallucination detectors, allowing for extensibility
 * and maintainability.
 */

/**
 * Base interface for detecting hallucinations in extracted data
 * Follows the Interface Segregation Principle by providing a focused contract
 */
export interface HallucinationDetector<T> {
  /**
   * Detects potential hallucinations in the provided data
   * 
   * @param data - The extracted data to validate
   * @returns void - Modifies the data object directly to set validation flags
   */
  detect(data: T): void;
}

/**
 * Document type detection utility
 * Helps determine which detector to use based on data structure
 */
export class DocumentTypeDetector {
  /**
   * Determines if the data structure represents a check
   * 
   * @param data - The extracted data to analyze
   * @returns boolean - True if data appears to be check-related
   */
  static isCheckData(data: Record<string, unknown>): boolean {
    // Check for check-specific fields
    return !!(
      data.checkNumber !== undefined ||
      data.payee !== undefined ||
      data.payer !== undefined ||
      data.routingNumber !== undefined ||
      data.accountNumber !== undefined ||
      data.micrLine !== undefined
    );
  }

  /**
   * Determines if the data structure represents a receipt
   * 
   * @param data - The extracted data to analyze
   * @returns boolean - True if data appears to be receipt-related
   */
  static isReceiptData(data: Record<string, unknown>): boolean {
    // Check for receipt-specific fields
    return !!(
      data.merchant !== undefined ||
      data.items !== undefined ||
      data.totals !== undefined ||
      data.receiptNumber !== undefined ||
      data.taxes !== undefined
    );
  }

  /**
   * Gets the appropriate document type
   * 
   * @param data - The extracted data to analyze
   * @returns string - The detected document type
   */
  static getDocumentType(data: Record<string, unknown>): 'check' | 'receipt' | 'unknown' {
    if (this.isCheckData(data)) {
      return 'check';
    } else if (this.isReceiptData(data)) {
      return 'receipt';
    }
    return 'unknown';
  }
}