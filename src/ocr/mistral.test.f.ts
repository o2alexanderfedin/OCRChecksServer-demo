import type { IoE } from './types'
import { createMistralProvider } from './mistral'
import { DocumentType } from '../ocr/types'

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

async function testMistralOCR(): Promise<void> {
    console.log('Testing MistralOCR provider...')
    const provider = createMistralProvider(mockIo, { apiKey: 'test-key' })
    let result

    // Test single document processing
    console.log('Testing single document processing...')
    result = await provider.processDocuments([{
        content: new Uint8Array([1, 2, 3]).buffer,
        type: DocumentType.Image,
        name: 'test.jpg'
    }])

    if (result[0] !== 'ok') {
        throw new Error('Single document processing failed')
    }
    if (result[1].length !== 1) {
        throw new Error('Expected 1 document result')
    }
    if (result[1][0].length !== 1) {
        throw new Error('Expected 1 page result')
    }
    if (result[1][0][0].text !== 'Sample extracted text') {
        throw new Error('Unexpected text content')
    }
    if (result[1][0][0].confidence !== 0.95) {
        throw new Error('Unexpected confidence score')
    }
    if (!result[1][0][0].boundingBox) {
        throw new Error('Missing bounding box')
    }

    // Test error handling
    console.log('Testing error handling...')
    result = await provider.processDocuments([{
        content: new Uint8Array([1, 2, 3]).buffer,
        type: DocumentType.Image,
        name: 'error.jpg'
    }])

    if (result[0] !== 'error') {
        throw new Error('Expected error result')
    }
    if (!result[1].message.includes('Mistral API error: 400')) {
        throw new Error('Unexpected error message')
    }

    // Test multiple documents
    console.log('Testing multiple documents processing...')
    result = await provider.processDocuments([
        { content: new Uint8Array([1, 2, 3]).buffer, type: DocumentType.Image, name: 'test1.jpg' },
        { content: new Uint8Array([4, 5, 6]).buffer, type: DocumentType.Image, name: 'test2.jpg' }
    ])

    if (result[0] !== 'ok') {
        throw new Error('Multiple documents processing failed')
    }
    if (result[1].length !== 2) {
        throw new Error('Expected 2 document results')
    }
    if (result[1][0][0].text !== 'Text 1' || result[1][1][0].text !== 'Text 2') {
        throw new Error('Unexpected text content in multiple results')
    }
    if (result[1][0][0].confidence !== 0.9 || result[1][1][0].confidence !== 0.85) {
        throw new Error('Unexpected confidence scores in multiple results')
    }

    console.log('All tests passed!')
}

testMistralOCR() 