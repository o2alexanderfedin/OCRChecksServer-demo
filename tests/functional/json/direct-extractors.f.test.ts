/**
 * Tests to verify direct use of modern extractors without legacy adapters
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// Import directly from extractors
import { ReceiptExtractor } from '../../../src/json/extractors/receipt-extractor.ts';
import { CheckExtractor } from '../../../src/json/extractors/check-extractor.ts';
import { 
  Receipt, 
  ReceiptType, 
  PaymentMethod, 
  CardType
} from '../../../src/json/schemas/receipt.ts';
import { 
  Check,
  CheckType,
  BankAccountType
} from '../../../src/json/schemas/check.ts';
import { JsonExtractor, JsonSchema } from '../../../src/json/types.ts';
import type { Result } from 'functionalscript/types/result/module.f.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesDir = path.join(__dirname, '..', '..', 'fixtures');
const sampleReceiptPath = path.join(fixturesDir, 'sample-receipt-ocr.txt');

// Mock JSON extractor for testing
class MockJsonExtractor implements JsonExtractor {
  private mockResponse: Result<any, Error>;

  constructor(mockResponse: Result<any, Error>) {
    this.mockResponse = mockResponse;
  }

  async extract({ markdown, schema }: { markdown: string, schema: JsonSchema }): Promise<Result<any, Error>> {
    // For test purposes, we just return the mockResponse regardless of input
    return this.mockResponse;
  }
}

describe('Modern Extractors Direct Usage Tests', () => {
  let sampleReceiptText: string;
  const sampleCheckText = `
    Check Number: 12345
    Date: 05/15/2025
    Pay to the order of: John Smith
    Amount: $500.00
    Memo: Consulting services
    Bank: First National Bank
    Routing Number: 123456789
    Account Number: 9876543210
  `;

  beforeAll(() => {
    sampleReceiptText = fs.readFileSync(sampleReceiptPath, 'utf-8');
  });

  describe('ReceiptExtractor', () => {
    it('should successfully extract receipt data', async () => {
      // Create mock data that the extractor should return
      const mockExtractedReceipt: Receipt = {
        merchant: {
          name: "ACME SUPERMARKET",
          address: "123 Main Street, Anytown, CA 90210",
          phone: "(555) 123-4567",
          website: "www.acmesupermarket.com",
          storeId: "1035"
        },
        receiptNumber: "T-59385",
        receiptType: ReceiptType.Sale,
        timestamp: new Date("2025-04-28T15:30:45Z"),
        totals: {
          subtotal: "42.97",
          tax: "3.44",
          total: "46.41"
        },
        currency: "USD",
        items: [
          {
            description: "Organic Bananas",
            quantity: 1.20,
            unit: "kg",
            unitPrice: "2.99",
            totalPrice: "3.59"
          },
          {
            description: "Whole Milk",
            quantity: 2,
            unitPrice: "3.49",
            totalPrice: "6.98"
          }
        ],
        taxes: [
          {
            taxName: "CA State Tax",
            taxRate: "0.08",
            taxAmount: "3.44"
          }
        ],
        payments: [
          {
            method: PaymentMethod.Credit,
            cardType: CardType.Visa,
            lastDigits: "1234",
            amount: "46.41",
            transactionId: "TX78965412"
          }
        ],
        confidence: 0.92
      };

      // Create a mock extractor that returns our predefined response
      const mockJsonExtractor = new MockJsonExtractor(['ok', {
        json: mockExtractedReceipt,
        confidence: 0.92
      }] as unknown as Result<any, Error>);

      // Create the receipt extractor with our mock
      const receiptExtractor = new ReceiptExtractor(mockJsonExtractor);

      // Test extraction
      const result = await receiptExtractor.extractFromText(sampleReceiptText);

      // Verify results
      expect(result[0]).toBe('ok');
      if (result[0] === 'ok') {
        expect(result[1].json).toBeDefined();
        expect(result[1].confidence).toBeCloseTo(0.92);

        const receipt = result[1].json;
        expect(receipt.merchant.name).toBe("ACME SUPERMARKET");
        expect(receipt.merchant.storeId).toBe("1035");
        expect(receipt.totals.total).toBe("46.41");
        expect(receipt.items?.length).toBe(2);
        expect(receipt.payments?.[0].method).toBe(PaymentMethod.Credit);
      }
    });

    it('should handle extraction errors correctly', async () => {
      // Create a mock extractor that returns an error
      const mockJsonExtractor = new MockJsonExtractor([
        'error', 
        new Error('Failed to extract receipt data from text')
      ] as unknown as Result<any, Error>);

      // Create the receipt extractor with our mock
      const receiptExtractor = new ReceiptExtractor(mockJsonExtractor);

      // Test extraction
      const result = await receiptExtractor.extractFromText(sampleReceiptText);

      // Verify results
      expect(result[0]).toBe('error');
      if (result[0] === 'error') {
        expect(result[1]).toBe('Failed to extract receipt data from text');
      }
    });
  });

  describe('CheckExtractor', () => {
    it('should successfully extract check data', async () => {
      // Create mock data that the extractor should return
      const mockExtractedCheck: Check = {
        checkNumber: '12345',
        date: new Date('2025-05-15'),
        payee: 'John Smith',
        payer: 'Jane Doe',
        amount: '500.00',
        // amountText is no longer part of the Check interface
        memo: 'Consulting services',
        bankName: 'First National Bank',
        routingNumber: '123456789',
        accountNumber: '9876543210',
        checkType: CheckType.Personal,
        accountType: BankAccountType.Checking,
        signature: true,
        signatureText: 'Jane Doe',
        confidence: 0.95
      };

      // Create a mock extractor that returns our predefined response
      const mockJsonExtractor = new MockJsonExtractor(['ok', {
        json: mockExtractedCheck,
        confidence: 0.95
      }] as unknown as Result<any, Error>);

      // Create the check extractor with our mock
      const checkExtractor = new CheckExtractor(mockJsonExtractor);

      // Test extraction
      const result = await checkExtractor.extractFromText(sampleCheckText);

      // Verify results
      expect(result[0]).toBe('ok');
      if (result[0] === 'ok') {
        expect(result[1].json).toBeDefined();
        expect(result[1].confidence).toBeCloseTo(0.95);

        const check = result[1].json;
        expect(check.checkNumber).toBe('12345');
        expect(check.date).toBeInstanceOf(Date);
        expect(check.payee).toBe('John Smith');
        expect(check.amount).toBe('500.00');
        expect(check.bankName).toBe('First National Bank');
      }
    });

    it('should handle extraction errors correctly', async () => {
      // Create a mock extractor that returns an error
      const mockJsonExtractor = new MockJsonExtractor([
        'error', 
        new Error('Failed to extract check data from text')
      ] as unknown as Result<any, Error>);

      // Create the check extractor with our mock
      const checkExtractor = new CheckExtractor(mockJsonExtractor);

      // Test extraction
      const result = await checkExtractor.extractFromText(sampleCheckText);

      // Verify results
      expect(result[0]).toBe('error');
      if (result[0] === 'error') {
        expect(result[1]).toBe('Failed to extract check data from text');
      }
    });
  });
});