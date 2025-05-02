/**
 * Tests to ensure proper migration from legacy check extractor adapter
 * to modern implementation
 */
import { CheckExtractor } from '../../../src/json/extractors/check-extractor.js';
import { Check, CheckType, BankAccountType } from '../../../src/json/schemas/check';
import { JsonExtractor, JsonSchema } from '../../../src/json/types';
import type { Result } from 'functionalscript/types/result/module.f.js';

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

describe('Check Extractor Migration Tests', () => {
  const sampleCheckOcr = `
    Check Number: 12345
    Date: 05/15/2025
    Pay to the order of: John Smith
    Amount: $500.00
    Memo: Consulting services
    Bank: First National Bank
    Routing Number: 123456789
    Account Number: 9876543210
  `;

  it('should provide identical functionality as the legacy adapter', async () => {
    // Create mock data that the extractor should return
    const mockExtractedCheck: Check = {
      checkNumber: '12345',
      date: '2025-05-15',
      payee: 'John Smith',
      payer: 'Jane Doe',
      amount: 500.00,
      amountText: 'Five hundred dollars and zero cents',
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
    const result = await checkExtractor.extractFromText(sampleCheckOcr);

    // Verify results - the result should be a readonly tuple
    expect(result[0]).toBe('ok');
    if (result[0] === 'ok') {
      expect(result[1].json).toBeDefined();
      expect(result[1].confidence).toBeCloseTo(0.95);

      const check = result[1].json;
      expect(check.checkNumber).toBe('12345');
      expect(check.date).toBe('2025-05-15');
      expect(check.payee).toBe('John Smith');
      expect(check.amount).toBe(500.00);
      expect(check.bankName).toBe('First National Bank');
      expect(check.routingNumber).toBe('123456789');
      expect(check.accountNumber).toBe('9876543210');
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
    const result = await checkExtractor.extractFromText(sampleCheckOcr);

    // Verify results
    expect(result[0]).toBe('error');
    if (result[0] === 'error') {
      expect(result[1].message).toBe('Failed to extract check data from text');
    }
  });
});