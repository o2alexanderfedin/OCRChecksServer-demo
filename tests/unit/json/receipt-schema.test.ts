import { 
  receiptSchema, 
  Receipt, 
  ReceiptType, 
  PaymentMethod, 
  CardType, 
  ReceiptFormat 
} from '../../../src/json/schemas/receipt';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

describe('Receipt Schema Validation', () => {
  let ajv: Ajv;
  let validate: any;

  beforeEach(() => {
    ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    validate = ajv.compile(receiptSchema);
  });

  it('should validate a complete valid receipt', () => {
    const receipt: Receipt = {
      merchant: {
        name: "ACME Supermarket",
        address: "123 Main St, Anytown, CA 90210",
        phone: "(555) 123-4567",
        storeId: "1035"
      },
      receiptNumber: "T-59385",
      receiptType: ReceiptType.Sale,
      timestamp: "2025-04-28T15:30:45Z",
      totals: {
        subtotal: 42.97,
        tax: 3.44,
        total: 46.41
      },
      currency: "USD",
      items: [
        {
          description: "Organic Bananas",
          quantity: 1.20,
          unit: "kg",
          unitPrice: 2.99,
          totalPrice: 3.59
        },
        {
          description: "Whole Milk",
          quantity: 2,
          unitPrice: 3.49,
          totalPrice: 6.98
        }
      ],
      taxes: [
        {
          taxName: "CA State Tax",
          taxRate: 0.08,
          taxAmount: 3.44
        }
      ],
      payments: [
        {
          method: PaymentMethod.Credit,
          cardType: CardType.Visa,
          lastDigits: "1234",
          amount: 46.41,
          transactionId: "TX78965412"
        }
      ],
      metadata: {
        confidenceScore: 0.92,
        languageCode: "en-US",
        receiptFormat: ReceiptFormat.Retail,
        sourceImageId: "receipt-20250428-001.jpg"
      },
      confidence: 0.92
    };

    const valid = validate(receipt);
    expect(valid).toBe(true);
    expect(validate.errors).toBeNull();
  });

  it('should validate a minimal receipt with only required fields', () => {
    const minimalReceipt: Receipt = {
      merchant: {
        name: "Corner Store"
      },
      timestamp: "2025-04-28T10:15:30Z",
      totals: {
        total: 25.99
      },
      // currency is now optional
      confidence: 0.85
    };

    const valid = validate(minimalReceipt);
    expect(valid).toBe(true);
    expect(validate.errors).toBeNull();
  });

  it('should reject a receipt missing required fields', () => {
    const invalidReceipt = {
      merchant: {
        name: "ACME Store"
      },
      timestamp: "2025-04-28T15:30:45Z",
      // Missing totals
      currency: "USD",
      confidence: 0.92
    };

    const valid = validate(invalidReceipt);
    expect(valid).toBe(false);
    expect(validate.errors).not.toBeNull();
    
    // Check that the error is about the missing totalAmount
    const errorPaths = validate.errors?.map((e: any) => e.instancePath);
    expect(errorPaths).toContain("");
  });

  it('should validate when currency is missing (optional field)', () => {
    const receiptWithoutCurrency: Receipt = {
      merchant: {
        name: "ACME Store"
      },
      timestamp: "2025-04-28T15:30:45Z",
      totals: {
        total: 45.99
      },
      // No currency provided
      confidence: 0.9
    };

    const valid = validate(receiptWithoutCurrency);
    expect(valid).toBe(true);
    expect(validate.errors).toBeNull();
  });

  it('should reject invalid currency format when provided', () => {
    const receiptWithInvalidCurrency: Receipt = {
      merchant: {
        name: "ACME Store"
      },
      timestamp: "2025-04-28T15:30:45Z",
      totals: {
        total: 45.99
      },
      currency: "us", // Should be uppercase 3-letter code
      confidence: 0.9
    };

    const valid = validate(receiptWithInvalidCurrency);
    expect(valid).toBe(false);
    expect(validate.errors).not.toBeNull();
    
    const currencyError = validate.errors?.find((e: any) => 
      e.instancePath === "/currency" && e.keyword === "pattern"
    );
    expect(currencyError).toBeDefined();
  });

  it('should validate receipt with all payment methods', () => {
    const paymentMethods = Object.values(PaymentMethod);
    
    for (const method of paymentMethods) {
      const receipt: Receipt = {
        merchant: {
          name: "Test Store"
        },
        timestamp: "2025-04-28T15:30:45Z",
        totals: {
          total: 100
        },
        currency: "USD",
        confidence: 0.9,
        payments: [
          {
            method: method,
            amount: 100
          }
        ]
      };

      const valid = validate(receipt);
      expect(valid).toBe(true);
      expect(validate.errors).toBeNull();
    }
  });

  it('should reject negative amounts', () => {
    const receiptWithNegativeAmount: Receipt = {
      merchant: {
        name: "ACME Store"
      },
      timestamp: "2025-04-28T15:30:45Z",
      totals: {
        total: -45.99 // Negative amount
      },
      currency: "USD",
      confidence: 0.9
    };

    const valid = validate(receiptWithNegativeAmount);
    expect(valid).toBe(false);
    expect(validate.errors).not.toBeNull();
    
    const amountError = validate.errors?.find((e: any) => 
      e.instancePath === "/totals/total" && e.keyword === "minimum"
    );
    expect(amountError).toBeDefined();
  });

  it('should validate confidence score within range 0-1', () => {
    // Valid confidence
    const validReceipt: Receipt = {
      merchant: {
        name: "ACME Store"
      },
      timestamp: "2025-04-28T15:30:45Z",
      totals: {
        total: 45.99
      },
      currency: "USD",
      confidence: 0.75
    };
    
    expect(validate(validReceipt)).toBe(true);
    
    // Invalid confidence - too high
    const tooHighConfidence: Receipt = {
      merchant: {
        name: "ACME Store"
      },
      timestamp: "2025-04-28T15:30:45Z",
      totals: {
        total: 45.99
      },
      currency: "USD",
      confidence: 1.5
    };
    
    expect(validate(tooHighConfidence)).toBe(false);
    
    // Invalid confidence - negative
    const negativeConfidence: Receipt = {
      merchant: {
        name: "ACME Store"
      },
      timestamp: "2025-04-28T15:30:45Z",
      totals: {
        total: 45.99
      },
      currency: "USD",
      confidence: -0.2
    };
    
    expect(validate(negativeConfidence)).toBe(false);
  });
});