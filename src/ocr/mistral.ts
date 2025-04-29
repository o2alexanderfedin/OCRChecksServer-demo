import type { Result } from 'functionalscript/types/result/module.f.js'
import { OCRProvider, OCRResult, Document, OCRProviderConfig, IoE, DocumentType } from './types'
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
 * Mistral OCR provider implementation
 */
export class MistralOCRProvider implements OCRProvider {
    private readonly client: Mistral
    private readonly io: IoE

    /**
     * Creates a new Mistral OCR provider instance
     * @param io I/O interface for network operations
     * @param client Mistral client instance
     */
    constructor(io: IoE, client: Mistral) {
        this.io = io
        this.client = client
    }

    /**
     * Process a single document
     * @param doc Document to process
     * @returns Promise of Result containing OCR results
     */
    private async processDocument(doc: Document): Promise<Result<OCRResult[], Error>> {
        try {
            const document = this.createDocumentChunk(doc)
            const ocrResponse = await this.client.ocr.process({
                model: null,
                document,
                includeImageBase64: doc.type === DocumentType.PDF
            })

            return ['ok', this.convertResponseToResults(ocrResponse)]
        } catch (err) {
            return ['error', err instanceof Error ? err : new Error(String(err))]
        }
    }

    /**
     * Create a document chunk for the Mistral API
     * @param doc Document to process
     * @returns Document chunk for the API
     */
    private createDocumentChunk(doc: Document): ImageURLChunk | DocumentURLChunk {
        const base64Content = Buffer.from(doc.content).toString('base64')
        const mimeType = doc.type === DocumentType.Image ? 'image/jpeg' : 'application/pdf'
        const dataUrl = `data:${mimeType};base64,${base64Content}`

        return doc.type === DocumentType.Image 
            ? { type: 'image_url', imageUrl: dataUrl }
            : { type: 'document_url', documentUrl: dataUrl }
    }

    /**
     * Convert Mistral API response to our OCR results format
     * @param response Mistral API response
     * @returns Array of OCR results
     */
    private convertResponseToResults(response: OCRResponse): OCRResult[] {
        return response.pages.map((page: OCRPageObject) => ({
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
    }

    /**
     * Process multiple documents in batch
     * @param documents Array of documents to process
     * @returns Promise of Result containing array of OCR results for each document
     */
    async processDocuments(documents: Document[]): Promise<Result<OCRResult[][], Error>> {
        try {
            const results = await Promise.all(documents.map(doc => this.processDocument(doc)))
            
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