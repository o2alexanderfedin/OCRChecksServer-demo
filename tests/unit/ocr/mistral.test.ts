import { DocumentType, type IoE } from '../../../src/ocr/types'
import { MistralOCRProvider } from '../../../src/ocr/mistral'
import { Mistral } from '@mistralai/mistralai'
import type { OCRResponse } from '@mistralai/mistralai/models/components'
import 'jasmine'

// Create our own simplified mock function since jasmine.createSpy might not be available
interface MockFunction {
    (...args: any[]): any;
    calls: {
        count: number;
        args: any[][];
        reset(): void;
    };
    mockReturnValue(val: any): MockFunction;
    mockImplementation(fn: Function): MockFunction;
}

function createSpy(name: string): MockFunction {
    const fn = function(...args: any[]) {
        fn.calls.count++;
        fn.calls.args.push(args);
        return undefined;
    } as MockFunction;
    
    fn.calls = {
        count: 0,
        args: [],
        reset() {
            this.count = 0;
            this.args = [];
        }
    };
    
    fn.mockReturnValue = function(val: any) {
        return fn;
    };
    
    fn.mockImplementation = function(fn2: Function) {
        return fn;
    };
    
    return fn;
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
        // Reset all mock functions
        if ((mockIo.fetch as any).calls && (mockIo.fetch as any).calls.reset) {
            (mockIo.fetch as any).calls.reset();
        }
        if ((mockIo.atob as any).calls && (mockIo.atob as any).calls.reset) {
            (mockIo.atob as any).calls.reset();
        }
        if ((mockIo.log as MockFunction).calls) {
            (mockIo.log as MockFunction).calls.reset();
        }
        if ((mockIo.debug as MockFunction).calls) {
            (mockIo.debug as MockFunction).calls.reset();
        }
        if ((mockIo.warn as MockFunction).calls) {
            (mockIo.warn as MockFunction).calls.reset();
        }
        if ((mockIo.error as MockFunction).calls) {
            (mockIo.error as MockFunction).calls.reset();
        }
        if ((mockIo.trace as MockFunction).calls) {
            (mockIo.trace as MockFunction).calls.reset();
        }
    });

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

        const provider = new MistralOCRProvider(mockIo, mockClient);
        const result = await provider.processDocuments([{
            content: new Uint8Array([1, 2, 3]).buffer,
            type: DocumentType.Image
        }]);

        if (result[0] === 'error') {
            fail('Expected successful result: ' + result[1].message);
            return;
        }

        expect(result[1].length).toBe(1);
        expect(result[1][0].length).toBe(1);
        expect(result[1][0][0].text).toBe('Sample extracted text');
        expect(result[1][0][0].boundingBox).toBeDefined();
    });

    it('should handle API errors', async () => {
        const mockClient = new Mistral({ apiKey: 'test-key' });
        // Ensure API key is set properly
        (mockClient as any).apiKey = 'test-key';
        
        // Create a mock process function that rejects
        mockClient.ocr.process = function() { return Promise.reject(new Error('Bad Request')); };

        const provider = new MistralOCRProvider(mockIo, mockClient);
        const result = await provider.processDocuments([{
            content: new Uint8Array([1, 2, 3]).buffer,
            type: DocumentType.Image
        }]);

        if (result[0] === 'ok') {
            fail('Expected error result');
            return;
        }

        expect(result[1].message).toContain('Bad Request');
        
        // Verify io.error was called
        expect((mockIo.error as MockFunction).calls.count).toBeGreaterThan(0);
    });
    
    it('should log detailed API error information', async () => {
        // Reset error spy to have clean call count
        (mockIo.error as MockFunction).calls.reset();
        
        const mockClient = new Mistral({ apiKey: 'test-key' });
        // Ensure API key is set properly
        (mockClient as any).apiKey = 'test-key';
        
        // Create a mock process function that rejects with specific error
        const testError = new Error('Test API Error');
        mockClient.ocr.process = function() { return Promise.reject(testError); };

        const provider = new MistralOCRProvider(mockIo, mockClient);
        await provider.processDocuments([{
            content: new Uint8Array([1, 2, 3]).buffer,
            type: DocumentType.Image
        }]);
        
        // Verify error logging calls count
        const errorCallCount = (mockIo.error as MockFunction).calls.count;
        expect(errorCallCount).toBeGreaterThan(0);
        
        // Check if there's at least one call with "Detailed API error information" message
        const detailedErrorCall = (mockIo.error as MockFunction).calls.args.find(
            args => args[0] && typeof args[0] === 'string' && args[0].includes('Detailed API error information')
        );
        
        // Verify that we have a call with the right message
        expect(detailedErrorCall).toBeDefined();
        
        // Verify that the error object was passed as the second argument
        if (detailedErrorCall) {
            expect(detailedErrorCall.length).toBeGreaterThanOrEqual(2);
            expect(detailedErrorCall[1]).toBeDefined();
        }
    });

    it('should handle missing API key', async () => {
        // Create a client without an API key
        const mockClient = new Mistral({} as any);
        
        // Make sure apiKey property is undefined
        (mockClient as any).apiKey = undefined;
        
        const provider = new MistralOCRProvider(mockIo, mockClient);
        const result = await provider.processDocuments([{
            content: new Uint8Array([1, 2, 3]).buffer,
            type: DocumentType.Image
        }]);

        if (result[0] === 'ok') {
            fail('Expected error result due to missing API key');
            return;
        }

        expect(result[1].message).toContain('Mistral API authentication error');
    });

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

        const provider = new MistralOCRProvider(mockIo, mockClient);
        const result = await provider.processDocuments([
            { content: new Uint8Array([1, 2, 3]).buffer, type: DocumentType.Image },
            { content: new Uint8Array([4, 5, 6]).buffer, type: DocumentType.Image }
        ]);

        if (result[0] === 'error') {
            fail('Expected successful result: ' + result[1].message);
            return;
        }

        expect(result[1].length).toBe(2);
        expect(result[1][0][0].text).toBe('Text 1');
        expect(result[1][1][0].text).toBe('Text 2');
    });
}) 