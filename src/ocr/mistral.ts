import type { Result } from 'functionalscript/types/result/module.f.js'
import { OCRProvider, OCRResult, Document, OCRProviderConfig, IoE } from './types'

/**
 * Mistral API response type
 */
interface MistralOCRResponse {
    text: string
    confidence: number
    boundingBox?: {
        x: number
        y: number
        width: number
        height: number
    }
}

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
    const baseUrl = config.baseUrl ?? 'https://api.mistral.ai/v1'

    const processDocument = async (doc: Document): Promise<Result<OCRResult[], Error>> => {
        try {
            // Convert document to base64
            const base64Content = Buffer.from(doc.content).toString('base64')
            const mimeType = doc.type === 'image' ? 'image/jpeg' : 'application/pdf'
            const dataUrl = `data:${mimeType};base64,${base64Content}`

            const response = await io.fetch(`${baseUrl}/ocr/process`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiKey}`
                },
                body: JSON.stringify({
                    model,
                    document: {
                        type: doc.type === 'image' ? 'image_url' : 'document_url',
                        [doc.type === 'image' ? 'imageUrl' : 'documentUrl']: dataUrl
                    },
                    includeImageBase64: true
                })
            })

            if (!response.ok) {
                const errorText = await response.text()
                return ['error', new Error(`Mistral API error: ${response.status} - ${errorText}`)]
            }

            const result = await response.json() as MistralOCRResponse
            
            return ['ok', [{
                text: result.text,
                confidence: result.confidence,
                pageNumber: doc.type === 'pdf' ? 1 : undefined,
                boundingBox: result.boundingBox
            }]]
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