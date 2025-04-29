import type { IoE } from './types'
import { MistralOCRProvider } from './mistral'
import { DocumentType } from '../ocr/types'
import 'jasmine'

describe('MistralOCR (Functional Style)', () => {
    const mockIo: IoE = {
        fetch: async (url: string, options?: RequestInit) => {
            const mockResponses = new Map([
                ['success-single', new Response(JSON.stringify({
                    text: 'Sample extracted text',
                    confidence: 0.95,
                    boundingBox: {
                        x: 0,
                        y: 0,
                        width: 100,
                        height: 50
                    }
                }), { status: 200 })],
                ['success-multiple-1', new Response(JSON.stringify({
                    text: 'Text 1',
                    confidence: 0.9,
                    boundingBox: {
                        x: 0,
                        y: 0,
                        width: 100,
                        height: 50
                    }
                }), { status: 200 })],
                ['success-multiple-2', new Response(JSON.stringify({
                    text: 'Text 2',
                    confidence: 0.85,
                    boundingBox: {
                        x: 0,
                        y: 0,
                        width: 100,
                        height: 50
                    }
                }), { status: 200 })],
                ['error', new Response('Bad Request', { status: 400 })]
            ])

            // For testing purposes, we'll use a custom header to determine which response to return
            const headers = options?.headers as Record<string, string> | undefined
            const testCase = headers?.['x-test-case']
            if (testCase && mockResponses.has(testCase)) {
                const response = mockResponses.get(testCase)
                if (!response) {
                    throw new Error(`Response not found for test case: ${testCase}`)
                }
                return response
            }

            throw new Error('Unexpected request')
        },
        atob: (data: string) => data,
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

    beforeEach(() => {
        provider = new MistralOCRProvider(mockIo, { apiKey: 'test-key' })
        // Mock the fetch function to return appropriate responses based on test case
        spyOn(mockIo, 'fetch').and.callFake(async (url: string, options?: RequestInit) => {
            const headers = options?.headers as Record<string, string> | undefined
            const testCase = headers?.['x-test-case'] || 'success-single'
            
            switch(testCase) {
                case 'success-single':
                    return new Response(JSON.stringify({
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
                    }), { status: 200 })
                case 'success-multiple-1':
                    return new Response(JSON.stringify({
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
                    }), { status: 200 })
                case 'success-multiple-2':
                    return new Response(JSON.stringify({
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
                    }), { status: 200 })
                case 'error':
                    return new Response('Bad Request', { status: 400 })
                default:
                    throw new Error(`Unknown test case: ${testCase}`)
            }
        })
    })

    it('should process a single image document with confidence score', async () => {
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
        spyOn(mockIo, 'fetch').and.returnValue(Promise.reject(new Error('Bad Request')))
        
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
        let callCount = 0
        spyOn(mockIo, 'fetch').and.callFake(async () => {
            const responses = [
                new Response(JSON.stringify({
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
                }), { status: 200 }),
                new Response(JSON.stringify({
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
                }), { status: 200 })
            ]
            return responses[callCount++]
        })
        
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