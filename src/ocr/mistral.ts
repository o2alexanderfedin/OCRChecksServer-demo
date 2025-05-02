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
 * Utility function to convert ArrayBuffer to base64 string without using Buffer
 * This is compatible with Cloudflare Workers environment
 * @param arrayBuffer The ArrayBuffer to convert
 * @returns Base64 string representation of the ArrayBuffer
 */
function arrayBufferToBase64(arrayBuffer: ArrayBuffer): string {
    // Convert ArrayBuffer to Uint8Array
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Use btoa and String.fromCharCode for base64 conversion
    // Note: we need to handle the array in smaller chunks for Cloudflare Workers environment
    const chunkSize = 4096; // Smaller chunk size for better compatibility
    let base64 = '';
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
        // Create a slice of the array for this chunk
        const chunk = uint8Array.subarray(i, i + chunkSize);
        
        // Convert to string character by character to avoid call stack issues
        let chunkString = '';
        for (let j = 0; j < chunk.length; j++) {
            chunkString += String.fromCharCode(chunk[j]);
        }
        
        // Convert to base64
        base64 += btoa(chunkString);
    }
    
    return base64;
}

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
            
            try {
                const ocrResponse = await this.client.ocr.process({
                    model: "mistral-ocr-latest",
                    document,
                    includeImageBase64: doc.type === DocumentType.PDF
                })
                
                return ['ok', this.convertResponseToResults(ocrResponse)]
            } catch (apiError) {
                // Detailed error logging for debugging in Cloudflare Workers
                console.error('Mistral API error details:', {
                    error: String(apiError),
                    errorType: apiError?.constructor?.name,
                    errorObject: JSON.stringify(apiError)
                });
                
                // More specific error message for API failures
                return ['error', new Error(`Mistral API error: ${String(apiError)}. Please check API key and network connection.`)]
            }
        } catch (err) {
            // Generic error handling for other issues
            console.error('General error in processing document:', String(err));
            return ['error', err instanceof Error ? err : new Error(String(err))]
        }
    }

    /**
     * Create a document chunk for the Mistral API
     * @param doc Document to process
     * @returns Document chunk for the API
     */
    private createDocumentChunk(doc: Document): ImageURLChunk | DocumentURLChunk {
        const base64Content = arrayBufferToBase64(doc.content)
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