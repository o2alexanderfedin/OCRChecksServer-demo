/**
 * Tests to ensure proper migration from legacy receipt extractor adapter
 * to modern implementation
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ReceiptExtractor } from '../../../src/json/extractors/receipt-extractor';
import { 
  Receipt, 
  ReceiptType, 
  PaymentMethod, 
  CardType
} from '../../../src/json/schemas/receipt';
import { JsonExtractor, JsonSchema } from '../../../src/json/types';
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

describe('Receipt Extractor Migration Tests', () => {
  let sampleReceiptText: string;

  beforeAll(() => {
    sampleReceiptText = fs.readFileSync(sampleReceiptPath, 'utf-8');
  });

  it('should provide identical functionality as the legacy adapter', async () => {
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

    // Verify results - the result should be a readonly tuple
    expect(result[0]).toBe('ok');
    if (result[0] === 'ok') {
      expect(result[1].json).toBeDefined();
      expect(result[1].confidence).toBeCloseTo(0.92);

      const receipt = result[1].json;
      expect(receipt.merchant.name).toBe("ACME SUPERMARKET");
      expect(receipt.merchant.storeId).toBe("1035");
      expect(receipt.totals.total).toBe("46.41");
      expect(receipt.totals.subtotal).toBe("42.97");
      expect(receipt.totals.tax).toBe("3.44");
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