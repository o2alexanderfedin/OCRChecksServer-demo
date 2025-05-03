import type { IoE } from '../../../src/ocr/types'
import { JsonExtractionRequest } from '../../../src/json/types'
import { MistralJsonExtractorProvider } from '../../../src/json/mistral'
import 'jasmine'
import { Mistral } from '@mistralai/mistralai'

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

describe('MistralJsonExtractor (Functional Style)', () => {
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
        },
        // Add missing required IoE methods
        log: (message: string) => console.log(message),
        debug: (message: string, data?: unknown) => console.log('DEBUG:', message, data),
        warn: (message: string, data?: unknown) => console.warn(message, data),
        error: (message: string, error?: unknown) => console.error(message, error),
        trace: (source: string, methodName: string, args?: unknown) => console.log(`TRACE: ${source}.${methodName}`, args)
    }

    let extractor: MistralJsonExtractorProvider
    // TypeScript type for our mocked Mistral client
    type MockMistralClient = {
        apiKey: string;
        chat: {
            complete: MockFunction;
        };
    }
    
    let mockClient: MockMistralClient

    beforeEach(() => {
        // Reset spies
        (mockIo.fetch as MockFunction).calls.reset()
        
        // Create mock client
        mockClient = {
            apiKey: 'test-key',
            chat: {
                complete: createSpy('complete')
            }
        }
        
        // Create extractor with mock client
        extractor = new MistralJsonExtractorProvider(mockIo, mockClient as unknown as Mistral)
    })

    it('should extract JSON with schema and calculate confidence', async () => {
        // Setup mock response
        const mockResponse = {
            choices: [
                {
                    message: {
                        content: '{"checkNumber":"1234","date":"01/15/2024","payee":"John Smith","amount":500,"memo":"Consulting services"}'
                    },
                    finish_reason: 'stop'
                }
            ]
        }
        
        // Configure mock to return the response
        ;(mockClient.chat.complete as MockFunction).mockReturnValue(Promise.resolve(mockResponse))
        
        // Define markdown input
        const markdown = `
            Check #1234
            Date: 01/15/2024
            Pay to: John Smith
            Amount: $500.00
            Memo: Consulting services
        `
        
        // Define schema
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
        }
        
        // Execute extraction
        const result = await extractor.extract({
            markdown,
            schema,
            options: {
                strictValidation: true
            }
        })
        
        // Verify API was called correctly
        const completeFn = mockClient.chat.complete as MockFunction
        expect(completeFn.calls.count).toBe(1)
        
        // Check prompt format
        const apiArgs = completeFn.calls.args[0][0]
        expect(apiArgs.model).toBe('mistral-large-latest')
        expect(apiArgs.messages.length).toBe(2)
        expect(apiArgs.messages[0].role).toBe('system')
        expect(apiArgs.messages[1].role).toBe('user')
        expect(apiArgs.messages[1].content).toContain('Extract the following information from this markdown text as JSON')
        expect(apiArgs.responseFormat).toEqual({ 
            type: 'json_schema',
            jsonSchema: schema
        })
        
        // Check result
        expect(result[0]).toBe('ok')
        
        if (result[0] === 'error') {
            fail('Expected successful result')
            return
        }
        
        // Verify result structure
        const data = result[1]
        expect(data.json).toBeDefined()
        expect(data.confidence).toBeDefined()
        
        // Verify JSON content
        expect(data.json.checkNumber).toBe('1234')
        expect(data.json.date).toBe('01/15/2024')
        expect(data.json.payee).toBe('John Smith')
        expect(data.json.amount).toBe(500)
        expect(data.json.memo).toBe('Consulting services')
        
        // Verify confidence score
        expect(data.confidence).toBeGreaterThan(0.8)
    })

    it('should handle API errors properly', async () => {
        // Setup mock to throw error
        ;(mockClient.chat.complete as MockFunction).mockReturnValue(
            Promise.reject(new Error('API connection error'))
        )
        
        // Execute extraction
        const result = await extractor.extract({
            markdown: 'Test markdown'
        })
        
        // Verify error handling
        expect(result[0]).toBe('error')
        
        if (result[0] === 'ok') {
            fail('Expected error result')
            return
        }
        
        expect(result[1].message).toContain('API connection error')
    })

    it('should handle invalid JSON responses', async () => {
        // Setup mock to return invalid JSON
        const invalidResponse = {
            choices: [
                {
                    message: {
                        content: 'This is not valid JSON'
                    },
                    finish_reason: 'stop'
                }
            ]
        }
        
        ;(mockClient.chat.complete as MockFunction).mockReturnValue(Promise.resolve(invalidResponse))
        
        // Execute extraction
        const result = await extractor.extract({
            markdown: 'Test markdown'
        })
        
        // Verify error handling
        expect(result[0]).toBe('error')
        
        if (result[0] === 'ok') {
            fail('Expected error result')
            return
        }
        
        expect(result[1].message).toContain('JSON')
    })

    // Schema validation is now handled by Mistral API

    // Validation is now handled by Mistral API
})