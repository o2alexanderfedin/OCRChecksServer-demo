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
    
    // Log first few bytes for debugging
    const byteSample = uint8Array.slice(0, 20);
    console.debug(`First ${byteSample.length} bytes: [${Array.from(byteSample).join(',')}]`);
    
    // Check if Buffer is available (Node.js environment)
    const hasBuffer = typeof Buffer !== 'undefined';
    console.log(`Environment check: Buffer is ${hasBuffer ? 'available' : 'not available'}`);
    
    // In a Node.js environment, use Buffer for reliable conversion (this is what Mistral examples use)
    if (hasBuffer) {
        try {
            // Create a Buffer from the Uint8Array
            const buffer = Buffer.from(uint8Array);
            
            // Log buffer information
            console.debug(`Created Buffer with length ${buffer.length}`);
            
            // Convert to base64 - exact method Mistral example uses
            const base64 = buffer.toString('base64');
            console.log(`Converted ${uint8Array.length} bytes to ${base64.length} base64 chars using Buffer`);
            
            // Log sample of base64 string
            console.debug(`Base64 sample (first 50 chars): ${base64.substring(0, 50)}...`);
            
            return base64;
        } catch (bufferError) {
            console.error('Error in Buffer-based conversion:', bufferError);
            console.error('Stack trace:', bufferError instanceof Error ? bufferError.stack : 'No stack trace');
            // Continue to fallback methods
        }
    }
    
    // For browser/Cloudflare Workers where Buffer is not available
    console.log('Using browser/Worker compatible base64 conversion approach');
    
    // Try the straightforward approach first
    try {
        console.debug('Attempting direct string conversion...');
        const startTime = Date.now();
        
        let binary = '';
        for (let i = 0; i < uint8Array.length; i++) {
            binary += String.fromCharCode(uint8Array[i]);
        }
        
        console.debug(`Binary string created with length ${binary.length} in ${Date.now() - startTime}ms`);
        console.debug(`Binary sample (first 20 chars): ${binary.substring(0, 20).replace(/[^\x20-\x7E]/g, '?')}...`);
        
        const base64 = btoa(binary);
        console.log(`Converted ${uint8Array.length} bytes to ${base64.length} base64 chars using btoa in ${Date.now() - startTime}ms`);
        console.debug(`Base64 sample (first 50 chars): ${base64.substring(0, 50)}...`);
        
        return base64;
    } catch (err) {
        console.error('Error in direct base64 conversion:', err);
        console.error('Error type:', err instanceof Error ? err.name : 'Unknown');
        console.error('Error message:', err instanceof Error ? err.message : String(err));
        console.error('Stack trace:', err instanceof Error ? err.stack : 'No stack trace');
        
        // Fallback to chunked approach for large files that might cause call stack issues
        console.log('Using chunked approach for base64 conversion');
        const startTime = Date.now();
        const chunkSize = 8192; // 8KB chunks should be safe
        let base64 = '';
        
        try {
            // Log chunking strategy
            const numChunks = Math.ceil(uint8Array.length / chunkSize);
            console.debug(`Chunking strategy: ${numChunks} chunks of ${chunkSize} bytes each`);
            
            for (let i = 0; i < uint8Array.length; i += chunkSize) {
                const chunkStartTime = Date.now();
                const end = Math.min(i + chunkSize, uint8Array.length);
                const chunk = uint8Array.subarray(i, end);
                
                console.debug(`Processing chunk ${Math.floor(i/chunkSize) + 1}/${numChunks}: ${chunk.length} bytes (${i}-${end})`);
                
                let binary = '';
                for (let j = 0; j < chunk.length; j++) {
                    binary += String.fromCharCode(chunk[j]);
                }
                
                const chunkBase64 = btoa(binary);
                console.debug(`Chunk ${Math.floor(i/chunkSize) + 1} converted in ${Date.now() - chunkStartTime}ms, length: ${chunkBase64.length}`);
                
                base64 += chunkBase64;
            }
            
            console.log(`Chunked conversion complete: ${uint8Array.length} bytes to ${base64.length} base64 chars in ${Date.now() - startTime}ms`);
            console.debug(`Base64 sample (first 50 chars): ${base64.substring(0, 50)}...`);
            
            return base64;
        } catch (chunkError) {
            console.error('Fatal error in chunked base64 conversion:', chunkError);
            console.error('Error type:', chunkError instanceof Error ? chunkError.name : 'Unknown');
            console.error('Error message:', chunkError instanceof Error ? chunkError.message : String(chunkError));
            console.error('Stack trace:', chunkError instanceof Error ? chunkError.stack : 'No stack trace');
            throw new Error(`All base64 conversion methods failed: ${String(chunkError)}`);
        }
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
        
        // Validate that the client has an API key set
        const apiKey = (this.client as any).apiKey;
        if (!apiKey) {
            const errorMessage = '[MistralOCRProvider:constructor] CRITICAL ERROR: Initialized with client missing API key';
            this.io.error(errorMessage);
            throw new Error(errorMessage);
        }
        
        // Additional validation of API key format
        if (typeof apiKey !== 'string' || apiKey.trim().length < 20) {
            const errorMessage = `[MistralOCRProvider:constructor] CRITICAL ERROR: Invalid API key format - too short or wrong type`;
            this.io.error(errorMessage);
            throw new Error(errorMessage);
        }
    }

    /**
     * Process a single document
     * @param doc Document to process
     * @returns Promise of Result containing OCR results
     */
    private async processDocument(doc: Document): Promise<Result<OCRResult[], Error>> {
        const startTime = Date.now();
        this.io.trace('MistralOCRProvider', 'processDocument', {
            docName: doc.name || 'unnamed',
            docType: doc.type,
            docSize: doc.content.byteLength
        });
        
        try {
            // Check for API key before proceeding - additional validation at runtime
            const apiKey = (this.client as any).apiKey;
            if (!apiKey) {
                const errorMessage = '[MistralOCRProvider:processDocument] CRITICAL ERROR: Missing Mistral API key';
                this.io.error(errorMessage);
                throw new Error(errorMessage);
            }
            
            // Log document information for debugging
            this.io.log(`Processing document: ${doc.name || 'unnamed'}, type: ${doc.type}, size: ${doc.content.byteLength} bytes`);
            
            // Create document chunk for API
            this.io.debug('Creating document chunk for Mistral API');
            const documentStartTime = Date.now();
            const document = this.createDocumentChunk(doc);
            this.io.debug(`Document chunk created in ${Date.now() - documentStartTime}ms`);
            
            // Log detailed document chunk information
            const docInfo: any = { 
                type: document.type,
                contentType: document.type === 'image_url' ? 'image' : 'document'
            };
            
            if (document.type === 'image_url' && typeof document.imageUrl === 'string') {
                docInfo.urlLength = document.imageUrl.length;
                docInfo.urlPrefix = document.imageUrl.substring(0, 50);
                docInfo.mimeType = document.imageUrl.substring(5, document.imageUrl.indexOf(';'));
            } else if (document.type === 'document_url' && typeof document.documentUrl === 'string') {
                docInfo.urlLength = document.documentUrl.length;
                docInfo.urlPrefix = document.documentUrl.substring(0, 50);
                docInfo.mimeType = document.documentUrl.substring(5, document.documentUrl.indexOf(';'));
            }
            
            this.io.debug('Document chunk details:', docInfo);
            
            try {
                // Log API request details
                this.io.log('Sending request to Mistral OCR API...');
                
                // Log API key information (first 4 chars, last 4 chars)
                const maskedKey = apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4);
                this.io.debug(`Using API key: ${maskedKey}`);
                
                // Log request details
                const requestDetails = {
                    model: "mistral-ocr-latest",
                    documentType: document.type,
                    includeImageBase64: true,
                    urlLength: document.type === 'image_url' ? 
                        (typeof document.imageUrl === 'string' ? document.imageUrl.length : 0) : 
                        (document.type === 'document_url' && typeof (document as any).documentUrl === 'string' ? 
                            (document as any).documentUrl.length : 0)
                };
                this.io.debug('API request details:', requestDetails);
                
                // Record request start time for performance measurement
                const requestStartTime = Date.now();
                
                // Process with Mistral OCR API - formatted exactly like the example
                this.io.debug('Making OCR API call...');
                const ocrResponse = await this.client.ocr.process({
                    model: "mistral-ocr-latest",
                    document,
                    includeImageBase64: true // Always include image base64, as in the example
                });
                
                // Calculate request duration
                const requestDuration = Date.now() - requestStartTime;
                this.io.log(`Received successful response from Mistral OCR API in ${requestDuration}ms`);
                
                // Log response details
                this.io.debug('API response summary:', {
                    model: ocrResponse.model,
                    pageCount: ocrResponse.pages.length,
                    usageInfo: ocrResponse.usageInfo
                });
                
                // For each page, log some details
                ocrResponse.pages.forEach((page, idx) => {
                    this.io.debug(`Page ${idx+1} details:`, {
                        index: page.index,
                        textLength: page.markdown ? page.markdown.length : 0,
                        imageCount: page.images ? page.images.length : 0,
                        dimensions: page.dimensions
                    });
                });
                
                // Convert and return results
                const results = this.convertResponseToResults(ocrResponse);
                this.io.debug(`Converted ${results.length} OCR results`);
                
                // Calculate total processing time
                const totalDuration = Date.now() - startTime;
                this.io.log(`Document processing completed successfully in ${totalDuration}ms`);
                
                return ['ok', results];
            } catch (apiError) {
                // Enhanced error logging for debugging in Cloudflare Workers
                this.io.error('Mistral API error:', apiError);
                
                // Try to extract more detailed error information
                let errorDetails: any = {
                    errorType: apiError?.constructor?.name || 'Unknown',
                    errorMessage: String(apiError),
                };
                
                // Try to extract status code and response if available
                if ((apiError as any)?.response) {
                    errorDetails.status = (apiError as any).response.status;
                    errorDetails.statusText = (apiError as any).response.statusText;
                    
                    // Try to parse response body if present
                    try {
                        if ((apiError as any).response.json) {
                            const responseJson = await (apiError as any).response.json();
                            errorDetails.responseBody = responseJson;
                        } else if ((apiError as any).response.text) {
                            const responseText = await (apiError as any).response.text();
                            errorDetails.responseBody = responseText;
                        }
                    } catch (parseError) {
                        errorDetails.responseParseError = String(parseError);
                    }
                }
                
                // If SDK-specific error information is available
                if ((apiError as any)?.code) {
                    errorDetails.errorCode = (apiError as any).code;
                }
                if ((apiError as any)?.type) {
                    errorDetails.errorType = (apiError as any).type;
                }
                
                this.io.error('Detailed API error information:', errorDetails);
                
                // Log the first part of the document data for diagnosis
                if (document.type === 'image_url' && typeof document.imageUrl === 'string') {
                    this.io.debug('Image URL format (first 100 chars):', document.imageUrl.substring(0, 100));
                } else if (document.type === 'document_url' && typeof document.documentUrl === 'string') {
                    this.io.debug('Document URL format (first 100 chars):', document.documentUrl.substring(0, 100));
                }
                
                // Log total processing time, even though it failed
                const totalDuration = Date.now() - startTime;
                this.io.log(`Document processing failed after ${totalDuration}ms`);
                
                // Check for authentication errors specifically
                const errorMessage = String(apiError).toLowerCase();
                if (errorMessage.includes('authentication') || errorMessage.includes('auth') || 
                    errorMessage.includes('unauthorized') || errorMessage.includes('api key') ||
                    (errorDetails.status === 401 || errorDetails.status === 403)) {
                    return ['error', new Error(`Mistral API authentication error. Please check that your API key is valid and has the correct permissions.`)];
                }
                
                // More specific error message for API failures
                return ['error', new Error(`Mistral API error: ${String(apiError)}. Please check API key and network connection.`)];
            }
        } catch (err) {
            // Generic error handling for other issues
            this.io.error('General error in processing document:', err);
            
            // Log total processing time, even though it failed
            const totalDuration = Date.now() - startTime;
            this.io.log(`Document processing failed after ${totalDuration}ms`);
            
            return ['error', err instanceof Error ? err : new Error(String(err))];
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