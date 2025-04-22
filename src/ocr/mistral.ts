import type { Result } from 'functionalscript/types/result/module.f.js'
import { OCRProvider, OCRResult, Document, OCRProviderConfig, IoE } from './types'
import { Mistral } from '@mistralai/mistralai'
import type { 
    OCRResponse, 
    OCRPageObject,
    ImageURLChunk,
    DocumentURLChunk
} from '@mistralai/mistralai/models/components'

/**
 * Mistral-specific configuration
 */
export type MistralConfig = OCRProviderConfig & {
    /** Model to use for OCR */
    model?: string
}

/**
 * Creates a Mistral OCR provider instance
 */
export const createMistralProvider = (io: IoE, config: MistralConfig): OCRProvider => {
    const model = config.model ?? 'mistral-ocr-latest'
    const client = new Mistral({ apiKey: config.apiKey })

    const processDocument = async (doc: Document): Promise<Result<OCRResult[], Error>> => {
        try {
            // Convert document to base64
            const base64Content = Buffer.from(doc.content).toString('base64')
            const mimeType = doc.type === 'image' ? 'image/jpeg' : 'application/pdf'
            const dataUrl = `data:${mimeType};base64,${base64Content}`

            const document: ImageURLChunk | DocumentURLChunk = doc.type === 'image' 
                ? { type: 'image_url', imageUrl: dataUrl }
                : { type: 'document_url', documentUrl: dataUrl }

            const ocrResponse: OCRResponse = await client.ocr.process({
                model,
                document,
                includeImageBase64: doc.type === 'pdf'
            })

            // Convert OCR response to our format
            const results: OCRResult[] = ocrResponse.pages.map((page: OCRPageObject) => ({
                text: page.markdown,
                confidence: 1.0, // Mistral doesn't provide confidence scores
                pageNumber: page.index + 1,
                boundingBox: page.dimensions ? {
                    x: 0,
                    y: 0,
                    width: page.dimensions.width,
                    height: page.dimensions.height
                } : undefined
            }))

            return ['ok', results]
        } catch (err) {
            return ['error', err instanceof Error ? err : new Error(String(err))]
        }
    }

    return {
        async processDocuments(documents: Document[]): Promise<Result<OCRResult[][], Error>> {
            try {
                const results = await Promise.all(documents.map(processDocument))
                
                // Check if any results are errors
                const errors = results.filter((r: Result<OCRResult[], Error>) => r[0] === 'error')
                if (errors.length > 0) {
                    return ['error', errors[0][1] as Error]
                }

                // All results are successful
                return ['ok', results.map((r: Result<OCRResult[], Error>) => r[1] as OCRResult[])]
            } catch (err) {
                return ['error', err instanceof Error ? err : new Error(String(err))]
            }
        }
    }
} 