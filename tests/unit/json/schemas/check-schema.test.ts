import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { checkSchema } from '../../../../src/json/schemas/check';
import { 
  Check, 
  CheckType,
  BankAccountType
} from '../../../../src/json/schemas/check';

describe('Check Schema Validation', () => {
  let ajv: Ajv;
  let validate: any;

  beforeEach(() => {
    ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    validate = ajv.compile(checkSchema);
  });

  it('should validate a complete valid check', () => {
    const check: Check = {
      checkNumber: 'A123456789',
      date: '2025-05-01T00:00:00Z',
      payee: 'John Smith',
      payer: 'Jane Doe',
      amount: 1234.56,
      memo: 'Consulting services',
      bankName: 'First National Bank',
      routingNumber: '123456789',
      accountNumber: '9876543210',
      accountType: BankAccountType.Checking,
      checkType: CheckType.Personal,
      signature: true,
      confidence: 0.95
    };

    const valid = validate(check);
    expect(valid).toBeTruthy();
  });

  it('should validate a minimal check with only required fields', () => {
    const minimalCheck: Check = {
      checkNumber: '12345',
      date: '2025-05-01',
      payee: 'John Smith',
      amount: 100,
      confidence: 0.8
    };

    const valid = validate(minimalCheck);
    expect(valid).toBeTruthy();
  });

  it('should reject a check missing required fields', () => {
    const invalidCheck: Partial<Check> = {
      // Missing checkNumber
      date: '2025-05-01',
      payee: 'John Smith',
      amount: 100,
      confidence: 0.8
    };

    const valid = validate(invalidCheck);
    expect(valid).toBeFalsy();
    expect(ajv.errorsText(validate.errors)).toContain("required property 'checkNumber'");
  });

  it('should reject negative amount', () => {
    const invalidCheck: Check = {
      checkNumber: '12345',
      date: '2025-05-01',
      payee: 'John Smith',
      amount: -100, // Negative amount
      confidence: 0.8
    };

    const valid = validate(invalidCheck);
    expect(valid).toBeFalsy();
    expect(ajv.errorsText(validate.errors)).toContain('must be >=');
  });

  it('should validate routing number format', () => {
    const invalidCheck: Check = {
      checkNumber: '12345',
      date: '2025-05-01',
      payee: 'John Smith',
      amount: 100,
      routingNumber: 'abcdefghi', // Invalid format - should be 9 digits
      confidence: 0.8
    };

    const valid = validate(invalidCheck);
    expect(valid).toBeFalsy();
    expect(ajv.errorsText(validate.errors)).toContain('pattern');
  });

  it('should validate confidence score within range 0-1', () => {
    const invalidCheck: Check = {
      checkNumber: '12345',
      date: '2025-05-01',
      payee: 'John Smith',
      amount: 100,
      confidence: 1.5 // Outside valid range
    };

    const valid = validate(invalidCheck);
    expect(valid).toBeFalsy();
    expect(ajv.errorsText(validate.errors)).toContain('must be <=');
  });

  it('should validate check type enum values', () => {
    const validCheck: Check = {
      checkNumber: '12345',
      date: '2025-05-01',
      payee: 'John Smith',
      amount: 100,
      checkType: CheckType.Business,
      confidence: 0.8
    };

    expect(validate(validCheck)).toBeTruthy();

    const invalidCheck: any = {
      checkNumber: '12345',
      date: '2025-05-01',
      payee: 'John Smith',
      amount: 100,
      checkType: 'invalid_type', // Not in enum
      confidence: 0.8
    };

    expect(validate(invalidCheck)).toBeFalsy();
  });

  it('should validate bank account type enum values', () => {
    const validCheck: Check = {
      checkNumber: '12345',
      date: '2025-05-01',
      payee: 'John Smith',
      amount: 100,
      accountType: BankAccountType.Savings,
      confidence: 0.8
    };

    expect(validate(validCheck)).toBeTruthy();

    const invalidCheck: any = {
      checkNumber: '12345',
      date: '2025-05-01',
      payee: 'John Smith',
      amount: 100,
      accountType: 'invalid_account_type', // Not in enum
      confidence: 0.8
    };

    expect(validate(invalidCheck)).toBeFalsy();
  });
});