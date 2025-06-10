// Import required modules
import fs from 'fs';
import path from 'path';
import { TestDIContainer } from '../../../src/di/index';
import { TYPES } from '../../../src/types/di-types.ts';
import { workerIoE } from '../../../src/io.ts';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get directory info
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../');

// Helper function to wait between API calls to avoid rate limits
async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

describe('MistralJson Semi-Integration', () => {
    // Create test-specific Io implementation
    const testIo = {
        ...workerIoE,
        // Ensure fetch and atob implementations exist
        fetch: globalThis.fetch,
        atob: globalThis.atob
    };
  
    // Create provider with test dependencies using TestDIContainer
    let extractor;
    let container;

    // Set a longer timeout for API calls
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000; // 60 seconds
  
    beforeAll(() => {
        console.log('Initializing TestDIContainer with mock Mistral client');
        
        // Create a test container with mock Mistral client
        container = TestDIContainer.createForTests(
            testIo, 
            'test_valid_api_key_123456789012345678901234567890'
        );
        
        // Get the JSON extractor from the container
        extractor = container.get(TYPES.JsonExtractorProvider);
        
        console.log('Successfully initialized test container with mock Mistral client');
    });

    it('should extract structured JSON from check markdown with schema', async () => {
        // Wait a short time before starting to ensure clean test state
        await delay(500);
        
        // Sample markdown text from a check image
        const checkMarkdown = `
        Check Number: A123456789
        Date: 05/15/2024
        Pay to the order of: John Smith
        Amount: $1,234.56
        Memo: Consulting services
        Bank: First National Bank
        Routing Number: 123456789
        Account Number: 9876543210
        `;
        
        // Define a JSON schema for check extraction
        const schema = {
            name: "CheckSchema",
            schemaDefinition: {
                type: "object",
                properties: {
                    checkNumber: { type: "string" },
                    date: { type: "string" },
                    payee: { type: "string" },
                    amount: { type: "number" },
                    memo: { type: "string" },
                    bankName: { type: "string" },
                    routingNumber: { type: "string" },
                    accountNumber: { type: "string" }
                },
                required: ["checkNumber", "date", "payee", "amount"]
            }
        };
        
        console.log('Sending check markdown to Mistral for JSON extraction...');
        console.log('Markdown content:', checkMarkdown.trim());
        
        // Execute extraction with schema
        const result = await extractor.extract({
            markdown: checkMarkdown,
            schema,
            options: {
                strictValidation: true
            }
        });
        
        // Check for successful extraction
        expect(result[0]).toBe('ok', 'Extraction should succeed');
        
        if (result[0] === 'error') {
            // If we hit a rate limit, mark as pending instead of failing
            if (result[1].message && result[1].message.includes('rate limit')) {
                console.warn('Rate limit hit, marking test as pending');
                pending('Rate limit hit on Mistral API, skipping test');
                return;
            }
            
            console.error('Extraction failed:', result[1]);
            fail('Expected successful extraction');
            return;
        }
        
        // Log the extracted JSON
        console.log('Extracted JSON:', JSON.stringify(result[1].json, null, 2));
        
        // Validate extraction results
        expect(result[1].json).toBeDefined();
        expect(result[1].json.checkNumber).toBeDefined();
        expect(result[1].json.date).toBeDefined();
        expect(result[1].json.payee).toBeDefined();
        expect(result[1].json.amount).toBeDefined();
        
        // Check confidence score
        expect(result[1].confidence).toBeGreaterThan(0.5);
        expect(result[1].confidence).toBeLessThanOrEqual(1.0);
    });
    
    it('should extract structured JSON from utility bill markdown', async () => {
        // Add a delay to avoid rate limits
        await delay(3000);
        
        // Sample markdown text from a utility bill
        const utilityBillMarkdown = `
        # UTILITY BILL
        
        Customer Name: James Wilson
        Account Number: 987654321
        Service Address: 123 Main St, Anytown, USA
        Billing Date: 04/01/2024
        Due Date: 04/15/2024
        
        ## CHARGES
        Electricity: $85.45
        Water: $32.18
        Sewer: $28.50
        Trash: $24.99
        Tax: $10.67
        
        ## TOTAL AMOUNT DUE: $181.79
        
        Previous Balance: $175.32
        Payments: -$175.32
        Current Charges: $181.79
        `;
        
        // Define a JSON schema for utility bill extraction
        const schema = {
            name: "UtilityBillSchema",
            schemaDefinition: {
                type: "object",
                properties: {
                    customerName: { type: "string" },
                    accountNumber: { type: "string" },
                    serviceAddress: { type: "string" },
                    billingDate: { type: "string" },
                    dueDate: { type: "string" },
                    charges: {
                        type: "object",
                        properties: {
                            electricity: { type: "number" },
                            water: { type: "number" },
                            sewer: { type: "number" },
                            trash: { type: "number" },
                            tax: { type: "number" }
                        }
                    },
                    totalAmountDue: { type: "number" },
                    previousBalance: { type: "number" },
                    payments: { type: "number" },
                    currentCharges: { type: "number" }
                },
                required: ["customerName", "accountNumber", "totalAmountDue"]
            }
        };
        
        console.log('Sending utility bill markdown to Mistral for JSON extraction...');
        
        // Execute extraction with schema
        const result = await extractor.extract({
            markdown: utilityBillMarkdown,
            schema
        });
        
        // Check for successful extraction
        expect(result[0]).toBe('ok', 'Extraction should succeed');
        
        if (result[0] === 'error') {
            // If we hit a rate limit, mark as pending instead of failing
            if (result[1].message && result[1].message.includes('rate limit')) {
                console.warn('Rate limit hit, marking test as pending');
                pending('Rate limit hit on Mistral API, skipping test');
                return;
            }
            
            console.error('Extraction failed:', result[1]);
            fail('Expected successful extraction');
            return;
        }
        
        // Log the extracted JSON
        console.log('Extracted JSON:', JSON.stringify(result[1].json, null, 2));
        
        // Validate extraction results
        expect(result[1].json).toBeDefined();
        expect(result[1].json.customerName).toBeDefined();
        expect(result[1].json.accountNumber).toBeDefined();
        expect(result[1].json.totalAmountDue).toBeDefined();
        
        // Check confidence score
        expect(result[1].confidence).toBeGreaterThan(0.5);
        expect(result[1].confidence).toBeLessThanOrEqual(1.0);
    });
    
    it('should process real OCR output and extract structured data', async () => {
        // Add a longer delay to avoid rate limits
        await delay(5000);
        
        // Get OCR output from a fixture file
        const ocrOutputPath = path.join(projectRoot, 'tests', 'fixtures', 'ocr-output.md');
        let markdownText;
        
        try {
            if (fs.existsSync(ocrOutputPath)) {
                markdownText = fs.readFileSync(ocrOutputPath, 'utf8');
                console.log('Using OCR output from file:', ocrOutputPath);
            } else {
                // Fallback OCR output if file doesn't exist
                markdownText = `
                # A. PLEASE DETACH HERE AND RETURN TOP PORTION WITH YOUR PAYMENT

                Invoice Number: 022756875
                Invoice Date: 03/14/2024
                Amount Due: $3399.21
                Due date: 04/01/2024

                ## UTILITY SERVICE CHARGES

                | utility | provider | calc | start date | end date | meter start | meter end | total usage | cost per unit | total |
                | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: |
                | Cold Water | -- | S | 02/05/2024 | 03/05/2024 | 12400 | 12880 | 480 Gal | 0.0107 | $5.15 |
                | Hot Water | San Jose Water Company | S | 02/05/2024 | 03/05/2024 | 9110 | 9860 | 750 Gal | 0.0107 | $8.04 |
                `;
                console.log('Using fallback OCR output');
            }
        } catch (error) {
            console.error('Error reading OCR output file:', error);
            fail('Could not read OCR output file');
            return;
        }
        
        // Define a JSON schema for utility bill extraction
        const schema = {
            name: "UtilityBillSchema",
            schemaDefinition: {
                type: "object",
                properties: {
                    invoiceNumber: { type: "string" },
                    invoiceDate: { type: "string" },
                    amountDue: { type: "number" },
                    dueDate: { type: "string" },
                    charges: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                utility: { type: "string" },
                                provider: { type: "string" },
                                startDate: { type: "string" },
                                endDate: { type: "string" },
                                meterStart: { type: "number" },
                                meterEnd: { type: "number" },
                                totalUsage: { type: "string" },
                                costPerUnit: { type: "number" },
                                total: { type: "number" }
                            }
                        }
                    }
                },
                required: ["invoiceNumber", "amountDue", "dueDate"]
            }
        };
        
        console.log('Sending real OCR output to Mistral for JSON extraction...');
        
        // Execute extraction with schema
        const result = await extractor.extract({
            markdown: markdownText,
            schema
        });
        
        // Check for successful extraction
        expect(result[0]).toBe('ok', 'Extraction should succeed');
        
        if (result[0] === 'error') {
            // If we hit a rate limit, mark as pending instead of failing
            if (result[1].message && result[1].message.includes('rate limit')) {
                console.warn('Rate limit hit, marking test as pending');
                pending('Rate limit hit on Mistral API, skipping test');
                return;
            }
            
            console.error('Extraction failed:', result[1]);
            fail('Expected successful extraction');
            return;
        }
        
        // Log the extracted JSON
        console.log('Extracted JSON:', JSON.stringify(result[1].json, null, 2));
        
        // Validate extraction results
        expect(result[1].json).toBeDefined();
        expect(result[1].json.invoiceNumber).toBeDefined();
        expect(result[1].json.amountDue).toBeDefined();
        expect(result[1].json.dueDate).toBeDefined();
        
        // Check confidence score
        expect(result[1].confidence).toBeGreaterThan(0.5);
        expect(result[1].confidence).toBeLessThanOrEqual(1.0);
    });
});