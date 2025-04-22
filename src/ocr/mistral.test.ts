import { DocumentType, type IoE } from './types'
import { createMistralProvider } from './mistral'

describe('MistralOCR', () => {
    const mockIo: IoE = {
        fetch: jest.fn(),
        atob: jest.fn(),
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
        jest.clearAllMocks()
    })

    it('should process a single image document', async () => {
        const mockResponse = {
            choices: [{
                message: {
                    content: 'Sample extracted text'
                }
            }]
        }

        ;(mockIo.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockResponse)
        })

        const provider = createMistralProvider(mockIo, { apiKey: 'test-key' })
        const result = await provider.processDocuments([{
            content: new Uint8Array([1, 2, 3]).buffer,
            type: DocumentType.Image
        }])

        expect(result[0]).toBe('ok')
        expect(result[1]).toHaveLength(1)
        expect(result[1][0]).toHaveLength(1)
        expect(result[1][0][0].text).toBe('Sample extracted text')
        expect(mockIo.fetch).toHaveBeenCalledTimes(1)
    })

    it('should handle API errors', async () => {
        ;(mockIo.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 400,
            text: () => Promise.resolve('Bad Request')
        })

        const provider = createMistralProvider(mockIo, { apiKey: 'test-key' })
        const result = await provider.processDocuments([{
            content: new Uint8Array([1, 2, 3]).buffer,
            type: DocumentType.Image
        }])

        expect(result[0]).toBe('error')
        expect(result[1].message).toContain('Mistral API error: 400')
    })

    it('should process multiple documents', async () => {
        const mockResponses = [
            { choices: [{ message: { content: 'Text 1' } }] },
            { choices: [{ message: { content: 'Text 2' } }] }
        ]

        ;(mockIo.fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponses[0])
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponses[1])
            })

        const provider = createMistralProvider(mockIo, { apiKey: 'test-key' })
        const result = await provider.processDocuments([
            { content: new Uint8Array([1, 2, 3]).buffer, type: DocumentType.Image },
            { content: new Uint8Array([4, 5, 6]).buffer, type: DocumentType.Image }
        ])

        expect(result[0]).toBe('ok')
        expect(result[1]).toHaveLength(2)
        expect(result[1][0][0].text).toBe('Text 1')
        expect(result[1][1][0].text).toBe('Text 2')
        expect(mockIo.fetch).toHaveBeenCalledTimes(2)
    })
}) 