import type { IoE } from '../../../src/ocr/types'
import { JsonExtractionRequest } from '../../../src/json/types'
import 'jasmine'
import { Mistral } from '@mistralai/mistralai'

// Import the class we'll implement
import { MistralJsonExtractorProvider } from '../../../src/json/mistral'

// Create our own simplified mock function since jasmine.createSpy might not be available
interface MockFunction {
    (...args: any[]): any;
    calls: {
        count: number;
        args: any[][];
        reset: () => void;
    };
    mockReturnValue: (val: any) => MockFunction;
    mockImplementation: (fn: Function) => MockFunction;
    mockReturnedValue: any;
    mockImplementationValue: Function | null;
}

function createSpy(name: string): MockFunction {
    const mockFn = function(...args: any[]) {
        mockFn.calls.count++;
        mockFn.calls.args.push(args);
        if (mockFn.mockImplementationValue) {
            return mockFn.mockImplementationValue(...args);
        }
        return mockFn.mockReturnedValue;
    } as MockFunction;
    
    mockFn.calls = {
        count: 0,
        args: [],
        reset: function() {
            this.count = 0;
            this.args = [];
        }
    };
    
    mockFn.mockReturnValue = function(val: any) {
        mockFn.mockReturnedValue = val;
        return mockFn;
    };
    
    mockFn.mockImplementation = function(fn: Function) {
        mockFn.mockImplementationValue = fn;
        return mockFn;
    };
    
    mockFn.mockReturnedValue = undefined;
    mockFn.mockImplementationValue = null;
    
    return mockFn;
}

// TypeScript type for our mocked Mistral client
type MockMistralClient = {
    apiKey: string;
    chat: {
        complete: MockFunction;
    };
    // Add other properties needed to satisfy the Mistral interface
    embeddings?: any;
    models?: any;
    files?: any;
    fineTuning?: any;
    batch?: any;
    ocr?: any;
}

describe('MistralJsonExtractor', () => {
    const mockIo: IoE = {
        fetch: createSpy('fetch'),
        atob: createSpy('atob'),
        console: {
            log: console.log,
            error: console.error
        },
        fs: {
            writeFileSync: () => {},
            readFileSync: () => null,
            existsSync: () => false,
            promises: {
                readFile: async () => '',
                writeFile: async () => {},
                readdir: async () => [],
                rm: async () => {},
                mkdir: async () => undefined,
                copyFile: async () => {}
            }
        },
        process: {
            argv: [],
            env: {},
            exit: () => { throw new Error('exit called') },
            cwd: () => ''
        },
        asyncImport: async () => ({ default: {} }),
        performance: {
            now: () => 0
        },
        tryCatch: <T>(f: () => T) => {
            try {
                return ['ok', f()];
            } catch (error) {
                return ['error', error];
            }
        },
        asyncTryCatch: async <T>(f: () => Promise<T>) => {
            try {
                return ['ok', await f()];
            } catch (error) {
                return ['error', error];
            }
        }
    }

    beforeEach(() => {
        (mockIo.fetch as MockFunction).calls.reset();
        (mockIo.atob as MockFunction).calls.reset();
    })

    it('should extract JSON from markdown text', async () => {
        // Create a mock complete function
        const completeMock = createSpy('complete').mockReturnValue(Promise.resolve({
            choices: [
                {
                    message: {
                        content: '{"checkNumber":"1234","date":"01/15/2024","payee":"John Smith","amount":500,"memo":"Consulting services"}'
                    },
                    finish_reason: 'stop'
                }
            ]
        }));
        
        // Create the mock Mistral client
        const mockClient: MockMistralClient = {
            apiKey: 'test-key',
            chat: {
                complete: completeMock
            }
        };

        const provider = new MistralJsonExtractorProvider(mockIo, mockClient as unknown as Mistral);
        
        // Define input markdown text
        const markdownText = 'Check #1234\nDate: 01/15/2024\nPay to: John Smith\nAmount: $500.00\nMemo: Consulting services';
        
        // Define schema for validation
        const schema = {
            name: "CheckSchema",
            schemaDefinition: {
                type: "object",
                properties: {
                    checkNumber: { type: "string" },
                    date: { type: "string" },
                    payee: { type: "string" },
                    amount: { type: "number" },
                    memo: { type: "string" }
                },
                required: ["checkNumber", "date", "payee", "amount"]
            }
        };
        
        // Create extraction request
        const request: JsonExtractionRequest = {
            markdown: markdownText,
            schema,
            options: {
                strictValidation: true
            }
        };
        
        // Call the extract method
        const result = await provider.extract(request);
        
        // Validate the result
        expect(result[0]).toBe('ok');
        
        if (result[0] === 'error') {
            fail('Expected successful result');
            return;
        }
        
        // Check JSON content
        expect(result[1].json.checkNumber).toBe('1234');
        expect(result[1].json.date).toBe('01/15/2024');
        expect(result[1].json.payee).toBe('John Smith');
        expect(result[1].json.amount).toBe(500);
        expect(result[1].json.memo).toBe('Consulting services');
        
        // Check confidence score
        expect(result[1].confidence).toBeGreaterThan(0);
        expect(result[1].confidence).toBeLessThanOrEqual(1);
        
        // Check that the Mistral API was called with the correct parameters
        const completeSpy = mockClient.chat.complete as MockFunction;
        expect(completeSpy.calls.count).toBe(1);
        
        // Check that prompt and responseFormat are set correctly
        const apiCallArgs = completeSpy.calls.args[0][0];
        expect(apiCallArgs.messages[1].content).toContain('Extract the following information from this markdown text as JSON');
        expect(apiCallArgs.responseFormat).toEqual({ 
            type: 'json_schema', 
            jsonSchema: schema 
        });
    });

    it('should handle extraction errors', async () => {
        // Create a mock complete function that rejects
        const completeMock = createSpy('complete').mockReturnValue(Promise.reject(new Error('API error')));
        
        // Create the mock Mistral client
        const mockClient: MockMistralClient = {
            apiKey: 'test-key',
            chat: {
                complete: completeMock
            }
        };

        const provider = new MistralJsonExtractorProvider(mockIo, mockClient as unknown as Mistral);
        
        // Create extraction request
        const request: JsonExtractionRequest = {
            markdown: 'Invalid markdown text',
        };
        
        // Call the extract method
        const result = await provider.extract(request);
        
        // Validate the result
        expect(result[0]).toBe('error');
        
        if (result[0] === 'ok') {
            fail('Expected error result');
            return;
        }
        
        // Check error message
        expect(result[1].message).toContain('API error');
    });

    it('should handle invalid JSON response', async () => {
        // Create a mock complete function
        const completeMock = createSpy('complete').mockReturnValue(Promise.resolve({
            choices: [
                {
                    message: {
                        content: 'Not valid JSON'
                    },
                    finish_reason: 'stop'
                }
            ]
        }));
        
        // Create the mock Mistral client
        const mockClient: MockMistralClient = {
            apiKey: 'test-key',
            chat: {
                complete: completeMock
            }
        };

        const provider = new MistralJsonExtractorProvider(mockIo, mockClient as unknown as Mistral);
        
        // Create extraction request
        const request: JsonExtractionRequest = {
            markdown: 'Test markdown',
        };
        
        // Call the extract method
        const result = await provider.extract(request);
        
        // Validate the result
        expect(result[0]).toBe('error');
        
        if (result[0] === 'ok') {
            fail('Expected error result');
            return;
        }
        
        // Check error message
        expect(result[1].message).toContain('JSON');
    });

    // Schema validation is now handled by Mistral's API

    it('should calculate confidence score based on response', async () => {
        // Create a mock complete function
        const completeMock = createSpy('complete').mockReturnValue(Promise.resolve({
            choices: [
                {
                    message: {
                        content: '{"checkNumber":"1234","date":"01/15/2024","payee":"John Smith","amount":500,"memo":"Consulting services"}'
                    },
                    finish_reason: 'stop' // This should give high confidence
                }
            ]
        }));
        
        // Create the mock Mistral client
        const mockClient: MockMistralClient = {
            apiKey: 'test-key',
            chat: {
                complete: completeMock
            }
        };

        const provider = new MistralJsonExtractorProvider(mockIo, mockClient as unknown as Mistral);
        
        // Create extraction request
        const request: JsonExtractionRequest = {
            markdown: 'Test markdown'
        };
        
        // Call the extract method
        const result = await provider.extract(request);
        
        // Validate the result
        expect(result[0]).toBe('ok');
        
        if (result[0] === 'error') {
            fail('Expected successful result');
            return;
        }
        
        // Check confidence score (should be high because finish_reason is 'stop')
        expect(result[1].confidence).toBeGreaterThanOrEqual(0.9);
    });
});