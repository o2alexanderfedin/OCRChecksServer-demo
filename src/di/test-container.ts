import { DIContainer, TYPES } from './container';
import { Mistral } from '@mistralai/mistralai';
import { IoE } from '../ocr/types';

/**
 * Test-specific DI container that mocks only the Mistral client
 * while using real implementations for all other dependencies
 */
export class TestDIContainer extends DIContainer {
  /**
   * Override the Mistral client registration to provide a test mock
   * that passes instanceof checks but doesn't make real API calls
   */
  protected override registerMistralClient(): void {
    this.container.bind(TYPES.MistralClient).toDynamicValue((context) => {
      const apiKey = context.get<string>(TYPES.MistralApiKey);
      const io = context.get<IoE>(TYPES.IoE);
      
      // Validate the API key as the real container would
      this.validateApiKey(apiKey);
      
      // Instead of trying to mock the Mistral client completely, create a real instance
      // and add our mock methods using Object.defineProperty to handle getters properly
      const mockClient = new Mistral({ apiKey });
      
      // Override the OCR functionality with a mock implementation
      Object.defineProperty(mockClient, 'ocr', {
        get: () => ({
          process: async () => ({
            model: 'mistral-ocr-latest',
            pages: [
              {
                index: 0,
                markdown: 'Mock OCR result text for testing purposes. This text simulates OCR output.',
                dimensions: { width: 800, height: 600, dpi: 300 }
              }
            ],
            usageInfo: { pagesProcessed: 1 }
          })
        }),
        configurable: true
      });
      
      // Override the chat functionality with a mock implementation
      Object.defineProperty(mockClient, 'chat', {
        get: () => ({
          complete: async (params: any) => {
            // Analyze the schema provided in the messages to generate appropriate mock data
            const checkSchema = params.messages[1].content.includes('"checkNumber"');
            const utilityBillSchema = params.messages[1].content.includes('"customerName"') || 
                                      params.messages[1].content.includes('"invoiceNumber"');
            const ocrOutputWithInvoice = params.messages[1].content.includes('Invoice Number:');
            
            // Extract specific data parameters from the request to provide targeted mocks
            const content = params.messages[1].content;
            
            io.debug(`Mock Mistral API received request with message: ${params.messages[1].content.substring(0, 100)}...`);
            
            // If extracting check data
            if (checkSchema || content.includes('check') || content.includes('Check Number: A123456789')) {
              io.debug(`Returning mock check data response`);
              return {
                id: 'mock-chat-id',
                choices: [
                  {
                    message: { 
                      content: JSON.stringify({
                        checkNumber: 'A123456789',
                        date: '2024-05-15',
                        payee: 'John Smith', 
                        amount: 1234.56,
                        memo: 'Consulting services',
                        bankName: 'First National Bank',
                        routingNumber: '123456789',
                        accountNumber: '9876543210'
                      })
                    },
                    finish_reason: 'stop'
                  }
                ]
              };
            }
            
            // If we're extracting utility bill data with customer details
            if (content.includes('UTILITY BILL') || content.includes('Customer Name: James Wilson')) {
              io.debug(`Returning mock utility bill customer data response`);
              return {
                id: 'mock-chat-id',
                choices: [
                  {
                    message: { 
                      content: JSON.stringify({
                        customerName: 'James Wilson',
                        accountNumber: '987654321',
                        serviceAddress: '123 Main St, Anytown, USA',
                        billingDate: '2024-04-01',
                        dueDate: '2024-04-15',
                        charges: {
                          electricity: 85.45,
                          water: 32.18,
                          sewer: 28.50,
                          trash: 24.99,
                          tax: 10.67
                        },
                        totalAmountDue: 181.79,
                        previousBalance: 175.32,
                        payments: -175.32,
                        currentCharges: 181.79
                      })
                    },
                    finish_reason: 'stop'
                  }
                ]
              };
            }
            
            // If we're extracting utility bill invoice data
            if (ocrOutputWithInvoice || content.includes('Invoice Number: 022756875')) {
              io.debug(`Returning mock utility bill invoice data response`);
              return {
                id: 'mock-chat-id',
                choices: [
                  {
                    message: { 
                      content: JSON.stringify({
                        invoiceNumber: '022756875',
                        invoiceDate: '2024-03-14',
                        amountDue: 3399.21,
                        dueDate: '2024-04-01',
                        charges: [
                          {
                            utility: 'Cold Water',
                            provider: 'Water Company',
                            startDate: '2024-02-05',
                            endDate: '2024-03-05',
                            meterStart: 12400,
                            meterEnd: 12880,
                            totalUsage: '480 Gal',
                            costPerUnit: 0.0107,
                            total: 5.15
                          },
                          {
                            utility: 'Hot Water',
                            provider: 'San Jose Water Company',
                            startDate: '2024-02-05',
                            endDate: '2024-03-05',
                            meterStart: 9110,
                            meterEnd: 9860,
                            totalUsage: '750 Gal',
                            costPerUnit: 0.0107,
                            total: 8.04
                          }
                        ]
                      })
                    },
                    finish_reason: 'stop'
                  }
                ]
              };
            }
            
            // Default response with basic structured data that matches what tests expect
            io.debug(`Returning default mock data response`);
            return {
              id: 'mock-chat-id',
              choices: [
                {
                  message: { 
                    content: JSON.stringify({
                      checkNumber: 'DEFAULT12345',
                      date: '2024-05-03',
                      payee: 'Default Test Payee',
                      amount: 123.45,
                      memo: 'Default memo',
                      customerName: 'Default Customer',
                      accountNumber: '12345678',
                      totalAmountDue: 123.45,
                      invoiceNumber: '12345',
                      amountDue: 123.45,
                      dueDate: '2024-05-30'
                    })
                  },
                  finish_reason: 'stop'
                }
              ]
            };
          }
        }),
        configurable: true
      });
      
      io.debug('Created mock Mistral client for testing');
      
      return mockClient;
    }).inSingletonScope();
  }
}