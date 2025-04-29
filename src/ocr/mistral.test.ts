import { DocumentType, type IoE } from './types'
import { MistralOCRProvider } from './mistral'
import { Mistral } from '@mistralai/mistralai'
import type { OCRResponse } from '@mistralai/mistralai/models/components'
import 'jasmine'

describe('MistralOCR', () => {
    const mockIo: IoE = {
        fetch: jasmine.createSpy('fetch'),
        atob: jasmine.createSpy('atob'),
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
        spyOn(mockClient.ocr, 'process').and.returnValue(Promise.resolve(mockResponse));

        const provider = new MistralOCRProvider(mockIo, mockClient)
        const result = await provider.processDocuments([{
            content: new Uint8Array([1, 2, 3]).buffer,
            type: DocumentType.Image
        }])

        if (result[0] === 'error') {
            fail('Expected successful result');
            return;
        }

        expect(result[1].length).toBe(1)
        expect(result[1][0].length).toBe(1)
        expect(result[1][0][0].text).toBe('Sample extracted text')
        expect(result[1][0][0].boundingBox).toBeDefined()
    })

    it('should handle API errors', async () => {
        const mockClient = new Mistral({ apiKey: 'test-key' });
        spyOn(mockClient.ocr, 'process').and.returnValue(Promise.reject(new Error('Bad Request')));

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
        spyOn(mockClient.ocr, 'process').and.callFake(() => Promise.resolve(mockResponses[callCount++]));

        const provider = new MistralOCRProvider(mockIo, mockClient)
        const result = await provider.processDocuments([
            { content: new Uint8Array([1, 2, 3]).buffer, type: DocumentType.Image },
            { content: new Uint8Array([4, 5, 6]).buffer, type: DocumentType.Image }
        ])

        if (result[0] === 'error') {
            fail('Expected successful result');
            return;
        }

        expect(result[1].length).toBe(2)
        expect(result[1][0][0].text).toBe('Text 1')
        expect(result[1][1][0].text).toBe('Text 2')
    })
}) 