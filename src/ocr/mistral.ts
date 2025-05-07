import type { Result } from 'functionalscript/types/result/module.f.js'
import { OCRProvider, OCRResult, Document, OCRProviderConfig, IoE, DocumentType } from './types'
import { Mistral } from '@mistralai/mistralai'
import type { 
    OCRResponse, 
    OCRPageObject,
    ImageURLChunk,
    DocumentURLChunk
} from '@mistralai/mistralai/models/components'

// Import Buffer from the buffer package - this will be available in all environments including Cloudflare Workers
import { Buffer } from 'buffer';

/**
 * Utility function to convert ArrayBuffer to base64 string
 * Using the buffer package for cross-platform compatibility
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
    
    // Detect environment more precisely for logging purposes
    const isNodeJS = typeof process !== 'undefined' && process.versions && process.versions.node;
    const isCloudflareWorker = typeof caches !== 'undefined' && typeof navigator !== 'undefined' && navigator.userAgent === 'Cloudflare-Workers';
    const isBrowser = typeof window !== 'undefined';
    const hasNativeBuffer = typeof global !== 'undefined' && typeof global.Buffer !== 'undefined';
    
    console.log(`Environment detection:
    - Node.js: ${isNodeJS ? 'Yes' : 'No'}
    - Cloudflare Worker: ${isCloudflareWorker ? 'Yes' : 'No'}
    - Browser: ${isBrowser ? 'Yes' : 'No'}
    - Native Buffer: ${hasNativeBuffer ? 'Yes' : 'No'}
    - Using buffer package polyfill`);
    
    try {
        // Use the buffer package which works in all environments
        const buffer = Buffer.from(uint8Array);
        
        // Log buffer information
        console.debug(`Created Buffer with length ${buffer.length}`);
        
        // Convert to base64 - consistent cross-platform approach
        const base64 = buffer.toString('base64');
        console.log(`Converted ${uint8Array.length} bytes to ${base64.length} base64 chars using buffer package`);
        
        // Log sample of base64 string
        console.debug(`Base64 sample (first 50 chars): ${base64.substring(0, 50)}...`);
        
        // Ensure the result is clean
        return cleanBase64(base64);
    } catch (bufferError) {
        console.error('Error in buffer package conversion:', bufferError);
        console.error('Stack trace:', bufferError instanceof Error ? bufferError.stack : 'No stack trace');
        
        // Fallback to basic approach if the buffer package fails
        console.log('Falling back to basic base64 conversion');
        
        try {
            let binary = '';
            for (let i = 0; i < uint8Array.length; i++) {
                binary += String.fromCharCode(uint8Array[i]);
            }
            
            const base64 = btoa(binary);
            console.log(`Fallback converted ${uint8Array.length} bytes to ${base64.length} base64 chars`);
            
            // Ensure the result is clean
            return cleanBase64(base64);
        } catch (fallbackError) {
            console.error('Error in fallback base64 conversion:', fallbackError);
            
            // Last resort: try chunked approach
            const result = chunkedBase64Conversion(uint8Array);
            return cleanBase64(result);
        }
    }
}

/**
 * Clean base64 string to ensure it meets Mistral API requirements
 * @param base64 Original base64 string
 * @returns Cleaned base64 string
 */
function cleanBase64(base64: string): string {
    // Remove any whitespace or newlines that might cause validation errors
    const cleaned = base64.replace(/[\s\r\n]+/g, '');
    
    // Check if the string was modified
    if (cleaned.length !== base64.length) {
        console.log(`Cleaned base64 string: removed ${base64.length - cleaned.length} whitespace/newline characters`);
    }
    
    // Validate that the string contains only valid base64 characters
    const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Pattern.test(cleaned)) {
        console.warn('Warning: Base64 string contains invalid characters');
        
        // Create a fully sanitized version (though this shouldn't be necessary for properly generated base64)
        const fullySanitized = cleaned.replace(/[^A-Za-z0-9+/=]/g, '');
        
        if (fullySanitized.length !== cleaned.length) {
            console.log(`Further cleaned base64 string: removed ${cleaned.length - fullySanitized.length} invalid characters`);
            return fullySanitized;
        }
    }
    
    return cleaned;
}

/**
 * Cloudflare Worker specific base64 conversion
 * Optimized for the Worker environment
 */
function cloudflareWorkerBase64Conversion(uint8Array: Uint8Array): string {
    console.log('Using Cloudflare Worker specific base64 conversion strategy');
    const startTime = Date.now();
    
    try {
        // In Cloudflare Workers, we can use a more efficient approach with smaller chunks
        // to avoid memory issues
        const chunkSize = 4096; // Smaller chunks for Workers
        let base64 = '';
        
        // Log chunking strategy
        const numChunks = Math.ceil(uint8Array.length / chunkSize);
        console.debug(`Worker chunking strategy: ${numChunks} chunks of ${chunkSize} bytes each`);
        
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
            const end = Math.min(i + chunkSize, uint8Array.length);
            const chunk = uint8Array.subarray(i, end);
            
            // Use a typed array view to avoid extra copies
            let binary = '';
            for (let j = 0; j < chunk.length; j++) {
                binary += String.fromCharCode(chunk[j]);
            }
            
            base64 += btoa(binary);
        }
        
        console.log(`Worker chunked conversion complete: ${uint8Array.length} bytes to ${base64.length} base64 chars in ${Date.now() - startTime}ms`);
        return base64;
        
    } catch (workerError) {
        console.error('Error in Cloudflare Worker specific conversion:', workerError);
        throw workerError; // Re-throw to try other methods
    }
}

/**
 * Chunked base64 conversion - last resort for large files
 * Works in all environments but less efficient
 */
function chunkedBase64Conversion(uint8Array: Uint8Array): string {
    console.log('Using chunked approach for base64 conversion (last resort)');
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
        
        // Verify that we have a Mistral instance
        if (!(client instanceof Mistral)) {
            const errorMessage = '[MistralOCRProvider:constructor] CRITICAL ERROR: Client must be an instance of Mistral';
            this.io.error(errorMessage);
            throw new Error(errorMessage);
        }
        
        // We'll check for API key during processing to allow tests to verify error handling
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
        
        // Enhanced API key validation - access the private field and log details
        try {
            // @ts-ignore - accessing private field for validation
            const apiKey = this.client.apiKey;
            if (!apiKey) {
                const errorMessage = 'Mistral API authentication error. No API key was provided.';
                this.io.error(errorMessage);
                return ['error', new Error(errorMessage)];
            }
            
            // Log API key details for debugging (safely)
            console.log(`MistralOCRProvider using API key: ${apiKey.substring(0, 4)}**** (length: ${apiKey.length})`);
        } catch (keyError) {
            this.io.error('Error accessing Mistral API key:', keyError);
            return ['error', new Error('Mistral API key validation error: ' + String(keyError))];
        }
        
        try {
            // ENHANCED LOGGING: Log everything about Mistral configuration
            console.log('======== MISTRAL API DEBUG INFO ========');
            console.log('Mistral Client Info:');
            
            // Log client properties (safely)
            try {
                console.log('- Client type:', this.client.constructor.name);
                // @ts-ignore - for debugging
                console.log('- API Base URL:', this.client.apiBase || 'default (https://api.mistral.ai/v1)');
                // @ts-ignore - for debugging
                console.log('- API Key (first 4 chars):', (this.client.apiKey || 'unknown').substring(0, 4) + '...');
                // @ts-ignore - for debugging
                console.log('- API Key length:', (this.client.apiKey || '').length);
                // @ts-ignore - for debugging
                console.log('- API Host:', this.client.apiHost || 'default (api.mistral.ai)');
                // @ts-ignore - for debugging
                console.log('- API Version:', this.client.apiVersion || 'default (v1)');
                // @ts-ignore - for debugging
                console.log('- With Credentials:', this.client.withCredentials || false);
                
                // Log endpoints used
                // @ts-ignore - for debugging purposes
                const ocrProcessEndpoint = (this.client.apiBase || 'https://api.mistral.ai/v1') + '/ocr/process';
                console.log('- OCR Process endpoint:', ocrProcessEndpoint);
                
                // Log other useful debug info
                console.log('- Node.js environment:', typeof process !== 'undefined' ? 'Yes' : 'No');
                console.log('- Browser environment:', typeof window !== 'undefined' ? 'Yes' : 'No');
                console.log('- Cloudflare Worker environment:', typeof caches !== 'undefined' ? 'Yes' : 'No');
            } catch (debugError) {
                console.log('- Error accessing client details:', debugError);
            }
            
            // Log document information for debugging
            this.io.log(`Processing document: ${doc.name || 'unnamed'}, type: ${doc.type}, size: ${doc.content.byteLength} bytes`);
            
            // Create document chunk for API
            this.io.debug('Creating document chunk for Mistral API');
            const documentStartTime = Date.now();
            const document = this.createDocumentChunk(doc);
            this.io.debug(`Document chunk created in ${Date.now() - documentStartTime}ms`);
            
            // ENHANCED LOGGING: Log detailed document chunk information
            const docInfo: Record<string, unknown> = { 
                type: document.type,
                contentType: document.type === 'image_url' ? 'image' : 'document'
            };
            
            if (document.type === 'image_url' && typeof document.imageUrl === 'string') {
                docInfo.urlLength = document.imageUrl.length;
                docInfo.urlPrefix = document.imageUrl.substring(0, 50);
                docInfo.mimeType = document.imageUrl.substring(5, document.imageUrl.indexOf(';'));
                
                // Enhanced validation
                console.log('- Image URL validation:');
                console.log('  - URL format correct:', document.imageUrl.startsWith('data:'));
                console.log('  - MIME type:', document.imageUrl.substring(5, document.imageUrl.indexOf(';')));
                console.log('  - Base64 indicator present:', document.imageUrl.includes(';base64,'));
                console.log('  - URL length:', document.imageUrl.length);
                
                // Check for truncation
                const base64Start = document.imageUrl.indexOf(',') + 1;
                const base64Content = document.imageUrl.substring(base64Start);
                console.log('  - Base64 content length:', base64Content.length);
                console.log('  - Base64 starts with:', base64Content.substring(0, 20) + '...');
                console.log('  - Base64 ends with:', '...' + base64Content.substring(base64Content.length - 20));
            } else if (document.type === 'document_url' && typeof document.documentUrl === 'string') {
                docInfo.urlLength = document.documentUrl.length;
                docInfo.urlPrefix = document.documentUrl.substring(0, 50);
                docInfo.mimeType = document.documentUrl.substring(5, document.documentUrl.indexOf(';'));
                
                // Enhanced validation
                console.log('- Document URL validation:');
                console.log('  - URL format correct:', document.documentUrl.startsWith('data:'));
                console.log('  - MIME type:', document.documentUrl.substring(5, document.documentUrl.indexOf(';')));
                console.log('  - Base64 indicator present:', document.documentUrl.includes(';base64,'));
                console.log('  - URL length:', document.documentUrl.length);
            }
            
            this.io.debug('Document chunk details:', docInfo);
            
            try {
                // Log API request details
                this.io.log('Sending request to Mistral OCR API...');
                console.log('======== MISTRAL API REQUEST ========');
                
                // Log API request details without exposing sensitive information
                const requestDetails = {
                    model: "mistral-ocr-latest",
                    documentType: document.type,
                    includeImageBase64: true,
                    urlLength: document.type === 'image_url' ? 
                        (typeof document.imageUrl === 'string' ? document.imageUrl.length : 0) : 
                        (document.type === 'document_url' && 'documentUrl' in document && typeof (document as {documentUrl: string}).documentUrl === 'string' ? 
                            (document as {documentUrl: string}).documentUrl.length : 0)
                };
                
                // ENHANCED LOGGING: More details about the request
                console.log('- OCR API Request Parameters:');
                console.log('  - Model:', 'mistral-ocr-latest');
                console.log('  - Document Type:', document.type);
                console.log('  - Include Image Base64:', true);
                console.log('  - Document Size (bytes):', requestDetails.urlLength);
                
                // Record request start time for performance measurement
                const requestStartTime = Date.now();
                console.log('- Starting API request at:', new Date().toISOString());
                
                // Process with Mistral OCR API - formatted exactly like the example
                console.log('- Making OCR API call with mistral-ocr-latest model...');
                const ocrResponse = await this.client.ocr.process({
                    model: "mistral-ocr-latest",
                    document,
                    includeImageBase64: true // Always include image base64, as in the example
                });
                
                // Calculate request duration
                const requestDuration = Date.now() - requestStartTime;
                console.log('======== MISTRAL API RESPONSE ========');
                console.log('- Status: SUCCESS');
                console.log('- Request duration:', requestDuration, 'ms');
                console.log('- Response received at:', new Date().toISOString());
                
                // Log response details
                console.log('- API response summary:');
                console.log('  - Model:', ocrResponse.model);
                console.log('  - Page count:', ocrResponse.pages.length);
                if (ocrResponse.usageInfo) {
                    console.log('  - Usage info:', JSON.stringify(ocrResponse.usageInfo, null, 2));
                }
                
                // For each page, log some details
                ocrResponse.pages.forEach((page, idx) => {
                    console.log(`- Page ${idx+1} details:`);
                    console.log(`  - Index: ${page.index}`);
                    console.log(`  - Text length: ${page.markdown ? page.markdown.length : 0} chars`);
                    console.log(`  - Image count: ${page.images ? page.images.length : 0}`);
                    if (page.dimensions) {
                        console.log(`  - Dimensions: ${page.dimensions.width}x${page.dimensions.height}`);
                    }
                    
                    // Show a sample of the text for debugging
                    if (page.markdown) {
                        const textSample = page.markdown.length > 100 ? 
                            page.markdown.substring(0, 100) + '...' : 
                            page.markdown;
                        console.log(`  - Text sample: ${textSample.replace(/\n/g, ' ')}`);
                    }
                });
                
                // Convert and return results
                const results = this.convertResponseToResults(ocrResponse);
                this.io.debug(`Converted ${results.length} OCR results`);
                
                // Calculate total processing time
                const totalDuration = Date.now() - startTime;
                this.io.log(`Document processing completed successfully in ${totalDuration}ms`);
                console.log('======== MISTRAL API DEBUG END ========');
                
                return ['ok', results];
            } catch (apiError) {
                // ENHANCED ERROR LOGGING for debugging in Cloudflare Workers
                console.log('======== MISTRAL API ERROR ========');
                console.log('- Error occurred at:', new Date().toISOString());
                console.log('- Error type:', apiError?.constructor?.name || 'Unknown');
                console.log('- Error message:', String(apiError));
                
                // Detect environment for environment-specific error handling
                const isNodeJS = typeof process !== 'undefined' && process.versions && process.versions.node;
                const isCloudflareWorker = typeof caches !== 'undefined' && typeof navigator !== 'undefined' && navigator.userAgent === 'Cloudflare-Workers';
                const isBrowser = typeof window !== 'undefined';
                const hasBuffer = typeof Buffer !== 'undefined';
                
                console.log('- Environment context:');
                console.log(`  - Node.js: ${isNodeJS ? 'Yes' : 'No'}`);
                console.log(`  - Cloudflare Worker: ${isCloudflareWorker ? 'Yes' : 'No'}`);
                console.log(`  - Browser: ${isBrowser ? 'Yes' : 'No'}`);
                console.log(`  - Buffer available: ${hasBuffer ? 'Yes' : 'No'}`);
                
                this.io.error('Mistral API error:', apiError);
                
                // Try to extract more detailed error information
                const errorDetails: Record<string, unknown> = {
                    errorType: apiError?.constructor?.name || 'Unknown',
                    errorMessage: String(apiError),
                    environment: isCloudflareWorker ? 'Cloudflare Worker' : (isNodeJS ? 'Node.js' : (isBrowser ? 'Browser' : 'Unknown')),
                };
                
                // Define MistralAPIError interface to handle API error responses
                interface MistralAPIErrorResponse {
                    response?: {
                        status?: number;
                        statusText?: string;
                        json?: () => Promise<unknown>;
                        text?: () => Promise<string>;
                    };
                    code?: string;
                    type?: string;
                }
                
                // Try to extract status code and response if available
                const mistralError = apiError as MistralAPIErrorResponse;
                if (mistralError?.response) {
                    errorDetails.status = mistralError.response.status;
                    errorDetails.statusText = mistralError.response.statusText;
                    
                    console.log('- Response status:', mistralError.response.status);
                    console.log('- Response status text:', mistralError.response.statusText);
                    
                    // Try to parse response body if present
                    try {
                        if (mistralError.response.json) {
                            const responseJson = await mistralError.response.json();
                            errorDetails.responseBody = responseJson;
                            console.log('- Response body (JSON):', JSON.stringify(responseJson, null, 2));
                        } else if (mistralError.response.text) {
                            const responseText = await mistralError.response.text();
                            errorDetails.responseBody = responseText;
                            console.log('- Response body (text):', responseText);
                        }
                    } catch (parseError) {
                        errorDetails.responseParseError = String(parseError);
                        console.log('- Response parse error:', String(parseError));
                    }
                }
                
                // If SDK-specific error information is available
                if (mistralError?.code) {
                    errorDetails.errorCode = mistralError.code;
                    console.log('- Error code:', mistralError.code);
                }
                if (mistralError?.type) {
                    errorDetails.errorType = mistralError.type;
                    console.log('- Error type:', mistralError.type);
                }
                
                // Check if this is a network error
                if (apiError instanceof Error && 'cause' in apiError) {
                    console.log('- Error cause:', apiError.cause);
                    if (apiError.cause && typeof apiError.cause === 'object') {
                        const cause = apiError.cause as any;
                        if (cause.code) {
                            console.log('- Network error code:', cause.code);
                        }
                        if (cause.errno) {
                            console.log('- Network error number:', cause.errno);
                        }
                    }
                }
                
                // Log stack trace if available
                if (apiError instanceof Error && apiError.stack) {
                    console.log('- Stack trace:', apiError.stack);
                }
                
                this.io.error('Detailed API error information:', errorDetails);
                
                // Log the first part of the document data for diagnosis
                if (document.type === 'image_url' && typeof document.imageUrl === 'string') {
                    this.io.debug('Image URL format (first 100 chars):', document.imageUrl.substring(0, 100));
                } else if (document.type === 'document_url' && typeof document.documentUrl === 'string') {
                    this.io.debug('Document URL format (first 100 chars):', document.documentUrl.substring(0, 100));
                }
                
                // Add Cloudflare Worker specific diagnostics
                if (isCloudflareWorker) {
                    console.log('- Cloudflare Worker specific diagnostics:');
                    try {
                        // Check if we can access the Mistral API key without logging it
                        // @ts-ignore - for debugging
                        console.log('  - API key available:', this.client.apiKey ? 'Yes (length: ' + this.client.apiKey.length + ')' : 'No');
                        
                        // Log potential Worker-specific limits
                        console.log('  - Worker CPU time limits may be exceeded for large images');
                        console.log('  - Check if memory limits are sufficient for base64 encoding');
                        console.log('  - Verify wrangler.toml configuration for CPU limits and compat flags');
                        
                        // Check network connectivity
                        console.log('  - Network connectivity: Try to ping api.mistral.ai directly');
                        console.log('  - If using Workers, ensure Workers can make outbound HTTPS connections');
                    } catch (workerDiagError) {
                        console.log('  - Error during Worker diagnostics:', workerDiagError);
                    }
                }
                
                // Log total processing time, even though it failed
                const totalDuration = Date.now() - startTime;
                this.io.log(`Document processing failed after ${totalDuration}ms`);
                console.log('- Total processing time before failure:', totalDuration, 'ms');
                console.log('======== MISTRAL API ERROR END ========');
                
                // Check for authentication errors specifically
                const errorMessage = String(apiError).toLowerCase();
                if (errorMessage.includes('authentication') || errorMessage.includes('auth') || 
                    errorMessage.includes('unauthorized') || errorMessage.includes('api key') ||
                    (errorDetails.status === 401 || errorDetails.status === 403)) {
                    return ['error', new Error(`Mistral API authentication error. Please check that your API key is valid and has the correct permissions.`)];
                }
                
                // Check if API key is missing - this is a more specific case
                // @ts-ignore - accessing private field for validation
                if (!this.client.apiKey) {
                    return ['error', new Error(`Mistral API authentication error. No API key was provided.`)];
                }
                
                // More specific error message for API failures
                return ['error', new Error(`Mistral API error: ${String(apiError)}. Please check API key and network connection.`)];
            }
        } catch (err) {
            // Generic error handling for other issues
            console.log('======== MISTRAL GENERAL ERROR ========');
            console.log('Error type:', err instanceof Error ? err.constructor.name : typeof err);
            console.log('Error message:', String(err));
            if (err instanceof Error && err.stack) {
                console.log('Stack trace:', err.stack);
            }
            console.log('======== MISTRAL GENERAL ERROR END ========');
            
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
        // Standard processing with buffer package for cross-platform compatibility
        console.log('Converting document to data URL with buffer package');

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
        // Mistral API REQUIRES the data:<mime>;base64, prefix
        // Make sure to clean the base64 content of any whitespace or special characters
        const cleanedBase64 = base64Content.trim().replace(/\s/g, '');
        const dataUrl = `data:${mimeType};base64,${cleanedBase64}`;
        
        console.log(`Created data URL with MIME type ${mimeType}, total length: ${dataUrl.length}`);
        
        console.log(`Data URL prefix: ${dataUrl.substring(0, 50)}...`);
        
        // Add extra validation to ensure URL format is correct
        if (!dataUrl.startsWith('data:')) {
            this.io.error('Invalid data URL format: URL does not start with "data:"');
            throw new Error('Invalid data URL format: URL does not start with "data:"');
        }
        
        if (!dataUrl.includes(';base64,')) {
            this.io.error('Invalid data URL format: URL does not contain ";base64,"');
            throw new Error('Invalid data URL format: URL does not contain ";base64,"');
        }
        
        const base64Part = dataUrl.split(';base64,')[1];
        if (!base64Part || base64Part.length === 0) {
            this.io.error('Invalid data URL format: Empty base64 content');
            throw new Error('Invalid data URL format: Empty base64 content');
        }
        
        // Test for invalid base64 characters to avoid API errors
        const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
        if (!base64Regex.test(base64Part)) {
            this.io.warn('Warning: Base64 content contains invalid characters that might cause API errors');
            // We don't throw here, as we'll let the API validate the final format
        }
        
        // Return appropriate chunk based on document type
        // IMPORTANT: The Mistral SDK expects camelCase field names despite the API using snake_case
        // This is a critical difference between direct API calls and SDK usage
        if (doc.type === DocumentType.Image) {
            // For SDK compatibility, we use camelCase property names
            return { 
                type: 'image_url', 
                imageUrl: dataUrl  // Use camelCase for SDK compatibility
            } as any; // Type assertion to bypass TypeScript checking
        } else {
            return { 
                type: 'document_url', 
                documentUrl: dataUrl  // Use camelCase for SDK compatibility
            } as any; // Type assertion to bypass TypeScript checking
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