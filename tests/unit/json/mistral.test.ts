import '../../../test-setup.ts';
import type { IoE } from '../../../src/ocr/types'
import { JsonExtractionRequest } from '../../../src/json/types'
import { Mistral } from '@mistralai/mistralai'

// Import our testing tools
import { TestDIContainer } from '../../../src/di/index'
import { TYPES } from '../../../src/types/di-types'
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
        log: createSpy('log'),
        debug: createSpy('debug'),
        warn: createSpy('warn'),
        error: createSpy('error'),
        trace: createSpy('trace'),
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
        (mockIo.log as MockFunction).calls.reset();
        (mockIo.debug as MockFunction).calls.reset();
        (mockIo.warn as MockFunction).calls.reset();
        (mockIo.error as MockFunction).calls.reset();
        (mockIo.trace as MockFunction).calls.reset();
    })

    it('should extract JSON from markdown text', async () => {
        // Create a mock complete function that returns our test data
        const completeMock = async () => ({
            choices: [
                {
                    message: {
                        content: '{"checkNumber":"1234","date":"01/15/2024","payee":"John Smith","amount":500,"memo":"Consulting services"}'
                    },
                    finishReason: 'stop'
                }
            ]
        });
        
        // Create a container with our mocked Mistral implementation
        const container = TestDIContainer.createForTests(mockIo, 'test_valid_api_key', {
            chatComplete: completeMock
        });
        
        // Get the provider from the container
        const provider = container.get<MistralJsonExtractorProvider>(TYPES.JsonExtractorProvider);
        
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
        
        // We don't have direct access to the mock client anymore
        // but we've already verified the extraction results, which means
        // that our mock was called correctly
        
        // Note: If more detailed call validation is needed, we'd need to
        // add a way to access the chat.complete spy from the FakeMistral
    });

    it('should handle extraction errors', async () => {
        // Create a mock complete function that rejects with an error
        const completeMock = async () => {
            throw new Error('API error');
        };
        
        // Create a container with our mocked Mistral implementation
        const container = TestDIContainer.createForTests(mockIo, 'test_valid_api_key', {
            chatComplete: completeMock
        });
        
        // Get the provider from the container
        const provider = container.get<MistralJsonExtractorProvider>(TYPES.JsonExtractorProvider);
        
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
        // Create a mock complete function that returns invalid JSON
        const completeMock = async () => ({
            choices: [
                {
                    message: {
                        content: 'Not valid JSON'
                    },
                    finishReason: 'stop'
                }
            ]
        });
        
        // Create a container with our mocked Mistral implementation
        const container = TestDIContainer.createForTests(mockIo, 'test_valid_api_key', {
            chatComplete: completeMock
        });
        
        // Get the provider from the container
        const provider = container.get<MistralJsonExtractorProvider>(TYPES.JsonExtractorProvider);
        
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
        // Create a mock complete function that returns a response with 'stop' finish reason
        const completeMock = async () => ({
            choices: [
                {
                    message: {
                        content: '{"checkNumber":"1234","date":"01/15/2024","payee":"John Smith","amount":500,"memo":"Consulting services"}'
                    },
                    finishReason: 'stop' // This should give high confidence
                }
            ]
        });
        
        // Create a container with our mocked Mistral implementation
        const container = TestDIContainer.createForTests(mockIo, 'test_valid_api_key', {
            chatComplete: completeMock
        });
        
        // Get the provider from the container
        const provider = container.get<MistralJsonExtractorProvider>(TYPES.JsonExtractorProvider);
        
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
        
        // Check confidence score (should be high because finishReason is 'stop')
        // Expected: (1.0 * 0.6) + (0.9 * 0.2) = 0.6 + 0.18 = 0.78
        expect(result[1].confidence).toBe(0.78);
    });
});