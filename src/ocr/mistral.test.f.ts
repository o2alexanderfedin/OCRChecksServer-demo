import type { IoE } from './types'
import { MistralOCRProvider } from './mistral'
import { DocumentType } from '../ocr/types'
import 'jasmine'
import { Mistral } from '@mistralai/mistralai'
import type { OCRResponse } from '@mistralai/mistralai/models/components'

describe('MistralOCR (Functional Style)', () => {
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

    let provider: MistralOCRProvider
    let mockClient: Mistral

    beforeEach(() => {
        // Reset spies
        (mockIo.fetch as jasmine.Spy).calls.reset()
        
        // Create mock client
        mockClient = new Mistral({ apiKey: 'test-key' })
        
        // Create provider with mock client
        provider = new MistralOCRProvider(mockIo, { apiKey: 'test-key' }, mockClient)
    })

    it('should process a single image document with confidence score', async () => {
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
        }
        
        spyOn(mockClient.ocr, 'process').and.returnValue(Promise.resolve(mockResponse))
        
        const result = await provider.processDocuments([{
            content: new Uint8Array([1, 2, 3]).buffer,
            type: DocumentType.Image,
            name: 'test.jpg'
        }])

        // Check overall result structure
        expect(result[0]).toBe('ok')
        
        if (result[0] === 'error') {
            fail('Expected successful result')
            return
        }
        
        // Check document results
        expect(result[1].length).toBe(1)
        expect(result[1][0].length).toBe(1)
        
        // Check specific result values
        const ocrResult = result[1][0][0]
        expect(ocrResult.text).toBe('Sample extracted text')
        expect(ocrResult.confidence).toEqual(1.0)
        expect(ocrResult.boundingBox).toBeDefined()
        expect(ocrResult.boundingBox?.width).toBe(100)
        expect(ocrResult.boundingBox?.height).toBe(50)
    })

    it('should handle API errors properly', async () => {
        spyOn(mockClient.ocr, 'process').and.returnValue(Promise.reject(new Error('Bad Request')))
        
        const result = await provider.processDocuments([{
            content: new Uint8Array([1, 2, 3]).buffer,
            type: DocumentType.Image,
            name: 'error.jpg'
        }])

        expect(result[0]).toBe('error')
        
        if (result[0] === 'ok') {
            fail('Expected error result')
            return
        }
        
        expect(result[1].message).toContain('Bad Request')
    })

    it('should process multiple documents correctly', async () => {
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
        ]
        
        let callCount = 0
        spyOn(mockClient.ocr, 'process').and.callFake(() => Promise.resolve(mockResponses[callCount++]))
        
        const result = await provider.processDocuments([
            { content: new Uint8Array([1, 2, 3]).buffer, type: DocumentType.Image, name: 'test1.jpg' },
            { content: new Uint8Array([4, 5, 6]).buffer, type: DocumentType.Image, name: 'test2.jpg' }
        ])

        expect(result[0]).toBe('ok')
        
        if (result[0] === 'error') {
            fail('Expected successful result')
            return
        }
        
        expect(result[1].length).toBe(2)
        expect(result[1][0][0].text).toBe('Text 1')
        expect(result[1][1][0].text).toBe('Text 2')
    })
})