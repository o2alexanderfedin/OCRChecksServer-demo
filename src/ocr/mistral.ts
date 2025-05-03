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
 * Utility function to convert ArrayBuffer to base64 string
 * Uses exact approach from official Mistral examples for 100% compatibility
 * @param arrayBuffer The ArrayBuffer to convert
 * @returns Base64 string representation of the ArrayBuffer
 */
function arrayBufferToBase64(arrayBuffer: ArrayBuffer): string {
    // Convert ArrayBuffer to Uint8Array
    const uint8Array = new Uint8Array(arrayBuffer);
    console.log(`Converting array buffer of size ${uint8Array.length} bytes to base64`);
    
    // In a Node.js environment, use Buffer for reliable conversion (this is what Mistral examples use)
    if (typeof Buffer !== 'undefined') {
        // Create a Buffer from the Uint8Array
        const buffer = Buffer.from(uint8Array);
        // Convert to base64 - exact method Mistral example uses
        const base64 = buffer.toString('base64');
        console.log(`Converted ${uint8Array.length} bytes to ${base64.length} base64 chars using Buffer`);
        return base64;
    }
    
    // For browser/Cloudflare Workers where Buffer is not available
    // Try the straightforward approach first
    try {
        let binary = '';
        for (let i = 0; i < uint8Array.length; i++) {
            binary += String.fromCharCode(uint8Array[i]);
        }
        const base64 = btoa(binary);
        console.log(`Converted ${uint8Array.length} bytes to ${base64.length} base64 chars using btoa`);
        return base64;
    } catch (err) {
        console.error('Error in direct base64 conversion:', err);
        
        // Fallback to chunked approach for large files that might cause call stack issues
        console.log('Using chunked approach for base64 conversion');
        const chunkSize = 8192; // 8KB chunks should be safe
        let base64 = '';
        
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
            const end = Math.min(i + chunkSize, uint8Array.length);
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
                
                // Process with Mistral OCR API - formatted exactly like the example
                const ocrResponse = await this.client.ocr.process({
                    model: "mistral-ocr-latest",
                    document,
                    includeImageBase64: true // Always include image base64, as in the example
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
        // Convert document content to base64
        const base64Content = arrayBufferToBase64(doc.content);
        
        // Determine correct MIME type
        let mimeType = 'image/jpeg'; // Default for images
        if (doc.type === DocumentType.PDF) {
            mimeType = 'application/pdf';
        } else if (doc.name) {
            // Try to infer more specific image MIME type from file extension
            const lower = doc.name.toLowerCase();
            if (lower.endsWith('.png')) {
                mimeType = 'image/png';
            } else if (lower.endsWith('.gif')) {
                mimeType = 'image/gif';
            } else if (lower.endsWith('.webp')) {
                mimeType = 'image/webp';
            }
            // Otherwise keep default image/jpeg
        }
        
        // Create the data URL with proper format
        const dataUrl = `data:${mimeType};base64,${base64Content}`;
        console.log(`Created data URL with MIME type ${mimeType}, total length: ${dataUrl.length}`);
        console.log(`Data URL prefix: ${dataUrl.substring(0, 50)}...`);
        
        // Return appropriate chunk based on document type
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