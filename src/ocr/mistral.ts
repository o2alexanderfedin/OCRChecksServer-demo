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
    
    console.log(`Converting array buffer of size ${uint8Array.length} bytes to base64`);
    
    // Simplest approach: Convert the entire array at once for smaller images
    if (uint8Array.length < 100 * 1024) { // 100KB threshold
        try {
            // Create binary string from byte array
            let binary = '';
            const len = uint8Array.length;
            for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(uint8Array[i]);
            }
            
            // Use standard btoa function
            const base64 = btoa(binary);
            console.log(`Converted ${uint8Array.length} bytes to ${base64.length} base64 chars directly`);
            return base64;
        } catch (err) {
            console.error('Error in direct base64 conversion:', err);
            // Fall through to chunked approach
        }
    }
    
    console.log('Using chunked approach for base64 conversion');
    
    // For larger images, use chunking to avoid call stack errors
    const chunkSize = 32 * 1024; // 32KB chunks
    let base64 = '';
    
    try {
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
            // Create a slice of the array for this chunk
            const end = Math.min(i + chunkSize, uint8Array.length);
            const chunk = uint8Array.subarray(i, end);
            
            // Convert chunk to string
            let binary = '';
            for (let j = 0; j < chunk.length; j++) {
                binary += String.fromCharCode(chunk[j]);
            }
            
            // Convert binary chunk to base64 and append to result
            base64 += btoa(binary);
            
            console.log(`Processed chunk ${i}-${end-1} (${chunk.length} bytes)`);
        }
        
        console.log(`Completed base64 conversion, generated ${base64.length} chars`);
        return base64;
    } catch (err) {
        console.error('Error in chunked base64 conversion:', err);
        
        // As a fallback, try a different approach that's even more conservative
        console.log('Trying fallback base64 conversion approach');
        
        // Ultra-small chunk approach for problematic files
        base64 = '';
        const tinyChunkSize = 8 * 1024; // 8KB chunks
        
        for (let i = 0; i < uint8Array.length; i += tinyChunkSize) {
            const end = Math.min(i + tinyChunkSize, uint8Array.length);
            const chunk = uint8Array.subarray(i, end);
            
            let binary = '';
            for (let j = 0; j < chunk.length; j++) {
                binary += String.fromCharCode(chunk[j]);
            }
            
            base64 += btoa(binary);
        }
        
        return base64;
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
            // Log document information for debugging
            console.log(`Processing document: ${doc.name || 'unnamed'}, type: ${doc.type}, size: ${doc.content.byteLength} bytes`);
            
            // Create document chunk for API
            const document = this.createDocumentChunk(doc)
            
            try {
                console.log('Sending request to Mistral OCR API...');
                
                // Process with Mistral OCR API
                const ocrResponse = await this.client.ocr.process({
                    model: "mistral-ocr-latest",
                    document,
                    includeImageBase64: doc.type === DocumentType.PDF
                })
                
                console.log('Received successful response from Mistral OCR API');
                
                // Convert and return results
                return ['ok', this.convertResponseToResults(ocrResponse)]
            } catch (apiError) {
                // Enhanced error logging for debugging in Cloudflare Workers
                console.error('Mistral API error details:', {
                    error: String(apiError),
                    errorType: apiError?.constructor?.name,
                    errorObject: JSON.stringify(apiError)
                });
                
                // Log the first part of the document data for diagnosis
                if (document.type === 'image_url' && typeof document.imageUrl === 'string') {
                    console.error('Image URL format (first 100 chars):', document.imageUrl.substring(0, 100));
                } else if (document.type === 'document_url' && typeof document.documentUrl === 'string') {
                    console.error('Document URL format (first 100 chars):', document.documentUrl.substring(0, 100));
                }
                
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
        // Let's go back to the base64 approach but with careful attention to formatting
        const base64Content = arrayBufferToBase64(doc.content);
        
        // Determine mime type
        const mimeType = doc.type === DocumentType.Image ? 'image/jpeg' : 'application/pdf';
        
        // Ensure proper base64 padding
        let cleanBase64 = base64Content.replace(/[^A-Za-z0-9+/=]/g, ''); // Remove any invalid chars
        
        // Ensure the base64 string has proper padding
        // Base64 strings should have a length that is a multiple of 4
        // If not, add padding '=' characters
        const remainder = cleanBase64.length % 4;
        if (remainder > 0) {
            console.log(`Fixing base64 padding. Current length: ${cleanBase64.length}, remainder: ${remainder}`);
            const padding = '='.repeat(4 - remainder);
            cleanBase64 += padding;
            console.log(`Added ${padding.length} padding characters. New length: ${cleanBase64.length}`);
        }
        
        // Create a carefully formatted data URL with the exact format Mistral expects
        const dataUrl = `data:${mimeType};base64,${cleanBase64}`;
        
        console.log(`Data URL format: ${mimeType}, length: ${dataUrl.length}`);
        console.log(`Data URL (first 100 chars): ${dataUrl.substring(0, 100)}...`);
        
        if (doc.type === DocumentType.Image) {
            return { 
                type: 'image_url', 
                imageUrl: dataUrl 
            };
        } else {
            return { 
                type: 'document_url', 
                documentUrl: dataUrl 
            };
        }
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