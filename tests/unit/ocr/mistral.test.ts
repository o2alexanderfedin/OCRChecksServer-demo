import { DocumentType, type IoE } from '../../../src/ocr/types'
import { MistralOCRProvider } from '../../../src/ocr/mistral'
import { Mistral } from '@mistralai/mistralai'
import type { OCRResponse } from '@mistralai/mistralai/models/components'
import 'jasmine'

// Create our own simplified mock function since jasmine.createSpy might not be available
interface MockFunction {
    (): any;
    calls: {
        count: number;
        reset: () => void;
    };
    mockReturnValue: (val: any) => MockFunction;
    mockImplementation: (fn: Function) => MockFunction;
    mockReturnedValue: any;
    mockImplementationValue: Function | null;
}

function createSpy(name: string): MockFunction {
    const mockFn = function() {
        mockFn.calls.count++;
        return mockFn.mockReturnedValue;
    } as MockFunction;
    
    mockFn.calls = {
        count: 0,
        reset: function() {
            this.count = 0;
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

describe('MistralOCR', () => {
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
        (mockIo.fetch as jasmine.Spy).calls.reset();
        (mockIo.atob as jasmine.Spy).calls.reset();
        (mockIo.log as MockFunction).calls.reset();
        (mockIo.debug as MockFunction).calls.reset();
        (mockIo.warn as MockFunction).calls.reset();
        (mockIo.error as MockFunction).calls.reset();
        (mockIo.trace as MockFunction).calls.reset();
    })

    it('should process a single image document', async () => {
        const mockResponse: OCRResponse = {
            model: '',
            usageInfo: { pagesProcessed: 1 },
            pages: [{
                markdown: 'Sample extracted text',
                index: 0,
                dimensions: {
                    width: 100,
                    height: 50,
                    dpi: 300
                },
                images: []
            }]
        };

        const mockClient = new Mistral({ apiKey: 'test-key' });
        // Ensure API key is set properly
        (mockClient as any).apiKey = 'test-key';
        
        // Create a mock process function
        mockClient.ocr.process = function() { return Promise.resolve(mockResponse); };

        const provider = new MistralOCRProvider(mockIo, mockClient)
        const result = await provider.processDocuments([{
            content: new Uint8Array([1, 2, 3]).buffer,
            type: DocumentType.Image
        }])

        if (result[0] === 'error') {
            fail('Expected successful result: ' + result[1].message);
            return;
        }

        expect(result[1].length).toBe(1)
        expect(result[1][0].length).toBe(1)
        expect(result[1][0][0].text).toBe('Sample extracted text')
        expect(result[1][0][0].boundingBox).toBeDefined()
    })

    it('should handle API errors', async () => {
        const mockClient = new Mistral({ apiKey: 'test-key' });
        // Ensure API key is set properly
        (mockClient as any).apiKey = 'test-key';
        
        // Create a mock process function that rejects
        mockClient.ocr.process = function() { return Promise.reject(new Error('Bad Request')); };

        const provider = new MistralOCRProvider(mockIo, mockClient)
        const result = await provider.processDocuments([{
            content: new Uint8Array([1, 2, 3]).buffer,
            type: DocumentType.Image
        }])

        if (result[0] === 'ok') {
            fail('Expected error result');
            return;
        }

        expect(result[1].message).toContain('Bad Request')
    })

    it('should handle missing API key', async () => {
        // Create a client without an API key
        const mockClient = new Mistral({} as any);
        
        // Make sure apiKey property is undefined
        (mockClient as any).apiKey = undefined;
        
        const provider = new MistralOCRProvider(mockIo, mockClient)
        const result = await provider.processDocuments([{
            content: new Uint8Array([1, 2, 3]).buffer,
            type: DocumentType.Image
        }])

        if (result[0] === 'ok') {
            fail('Expected error result due to missing API key');
            return;
        }

        expect(result[1].message).toContain('API key is required')
    })

    it('should process multiple documents', async () => {
        const mockResponses: OCRResponse[] = [
            {
                model: '',
                usageInfo: { pagesProcessed: 1 },
                pages: [{
                    markdown: 'Text 1',
                    index: 0,
                    dimensions: {
                        width: 100,
                        height: 50,
                        dpi: 300
                    },
                    images: []
                }]
            },
            {
                model: '',
                usageInfo: { pagesProcessed: 1 },
                pages: [{
                    markdown: 'Text 2',
                    index: 0,
                    dimensions: {
                        width: 100,
                        height: 50,
                        dpi: 300
                    },
                    images: []
                }]
            }
        ];

        let callCount = 0;
        const mockClient = new Mistral({ apiKey: 'test-key' });
        // Ensure API key is set properly
        (mockClient as any).apiKey = 'test-key';
        
        // Create a mock process function that returns different responses
        mockClient.ocr.process = function() { return Promise.resolve(mockResponses[callCount++]); };

        const provider = new MistralOCRProvider(mockIo, mockClient)
        const result = await provider.processDocuments([
            { content: new Uint8Array([1, 2, 3]).buffer, type: DocumentType.Image },
            { content: new Uint8Array([4, 5, 6]).buffer, type: DocumentType.Image }
        ])

        if (result[0] === 'error') {
            fail('Expected successful result: ' + result[1].message);
            return;
        }

        expect(result[1].length).toBe(2)
        expect(result[1][0][0].text).toBe('Text 1')
        expect(result[1][1][0].text).toBe('Text 2')
    })
}) 