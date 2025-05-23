import type { Result } from 'functionalscript/types/result/module.f.js'
import { Mistral } from '@mistralai/mistralai'
import type { IoE } from '../ocr/types'
import { JsonExtractor, JsonExtractionRequest, JsonExtractionResult } from './types'
import { injectable, inject } from 'inversify';
import { TYPES as VALIDATOR_TYPES } from '../validators';
import { TYPES } from '../types/di-types';

/**
 * Mistral JSON extractor implementation
 */

@injectable()
export class MistralJsonExtractorProvider implements JsonExtractor {
    private readonly client: Mistral
    private readonly io: IoE

    /**
     * Creates a new Mistral JSON extractor instance
     * @param io I/O interface for network operations
     * @param client Mistral client instance
     */
    constructor(
        @inject(TYPES.IoE) io: IoE, 
        @inject(TYPES.MistralClient) client: Mistral
    ) {
        this.io = io
        this.client = client
        
        // Only verify that we have a Mistral instance
        // Trust that the Mistral client will handle API key validation internally
        if (!(client instanceof Mistral)) {
            const errorMessage = '[MistralJsonExtractorProvider:constructor] CRITICAL ERROR: Client must be an instance of Mistral';
            this.io.error(errorMessage);
            throw new Error(errorMessage);
        }
    }

    /**
     * Extract structured JSON data from markdown text
     * @param request The extraction request
     * @returns Promise of Result containing extraction result
     */
    async extract(request: JsonExtractionRequest): Promise<Result<JsonExtractionResult, Error>> {
        try {
            console.log('======== MISTRAL JSON EXTRACTION DEBUG INFO ========');
            console.log('Extracting JSON from markdown text...');
            console.log('- Input text length:', request.markdown.length, 'chars');
            console.log('- Schema provided:', request.schema ? 'Yes' : 'No');
            if (request.schema) {
                console.log('- Schema type:', typeof request.schema);
                if (typeof request.schema === 'object' && request.schema !== null) {
                    console.log('- Schema properties:', Object.keys((request.schema as any).properties || {}).join(', '));
                }
            }
            
            // Log client info
            try {
                console.log('- Mistral client info:');
                console.log('  - Client type:', this.client.constructor.name);
                // @ts-ignore - for debugging
                console.log('  - API Key (first 4 chars):', (this.client.apiKey || 'unknown').substring(0, 4) + '...');
                // @ts-ignore - for debugging
                console.log('  - API Key length:', (this.client.apiKey || '').length);
                // @ts-ignore - for debugging
                const chatEndpoint = (this.client.apiBase || 'https://api.mistral.ai/v1') + '/chat/completions';
                console.log('  - Chat endpoint:', chatEndpoint);
            } catch (debugError) {
                console.log('  - Error accessing client details:', debugError);
            }
            
            // Construct the prompt for Mistral
            const prompt = this.constructPrompt(request);
            console.log('- Prompt:', prompt);
            console.log('- Prompt length:', prompt.length, 'chars');
            
            // Sample text from the beginning and end of the input
            const textSample = request.markdown.length > 200 ? 
                request.markdown.substring(0, 100) + '...' + request.markdown.substring(request.markdown.length - 100) : 
                request.markdown;
            console.log('- Text sample:', textSample.replace(/\n/g, ' '));
            
            console.log('======== MISTRAL JSON EXTRACTION REQUEST ========');
            console.log('- Model:', 'mistral-large-latest');
            console.log('- System prompt:', 'You are a JSON extraction specialist. Extract structured data from the provided text and return it as valid JSON.');
            console.log('- Response format:', request.schema ? 'json_schema' : 'json_object');
            
            // Start timing the request
            const requestStartTime = Date.now();
            console.log('- Starting request at:', new Date().toISOString());
            
            // Call Mistral API
            try {
                const response = await this.client.chat.complete({
                    model: 'mistral-large-latest',
                    messages: [
                        {
                            role: 'system',
                            content:
                                'You are top10 JSON extraction professional.\n'+
                                'Extract valid JSON from the provided markdown.\n'+
                                'Make sure the quotes are correctly balanced, and the JSON is correct.'+
                                'The given markdown is always a source of truth.\n'+
                                'If something is not there, then you have no value for that.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    responseFormat: request.schema 
                        ? { type: 'json_schema', jsonSchema: request.schema }
                        : { type: 'json_object' }
                });
                
                const requestDuration = Date.now() - requestStartTime;
                console.log('======== MISTRAL JSON EXTRACTION RESPONSE ========');
                console.log('- Status: SUCCESS');
                console.log('- Request duration:', requestDuration, 'ms');
                console.log('- Model used:', response.model || 'mistral-large-latest');
                
                if (response.usage) {
                    console.log('- Token usage:', JSON.stringify(response.usage, null, 2));
                }
                
                console.log('- Finish reason:', response.choices?.[0]?.finishReason);
                
                // Parse the response
                let jsonContent: Record<string, unknown>;
                try {
                    // Make sure choices exists and has at least one element
                    if (!response.choices || response.choices.length === 0) {
                        console.log('- ERROR: Empty response (no choices)');
                        return ['error', new Error('Empty response from Mistral API')];
                    }

                    const content = response.choices[0].message.content;
                    if (typeof content !== 'string') {
                        console.log('- ERROR: Invalid content type:', typeof content);
                        return ['error', new Error('Invalid response format from Mistral API')];
                    }

                    console.log('- Content length:', content.length, 'chars');
                    console.log('- Content sample:', content.length > 200 ? content.substring(0, 200) + '...' : content);
                    
                    // Try to parse the JSON
                    jsonContent = JSON.parse(content);
                    console.log('- Successfully parsed JSON response');
                    console.log('- JSON fields:', Object.keys(jsonContent).join(', '));
                    
                    // Log some key values (without logging the entire object, which could be large)
                    if (Object.keys(jsonContent).length <= 5) {
                        console.log('- JSON content:', JSON.stringify(jsonContent, null, 2));
                    } else {
                        console.log('- JSON content (first 5 fields):');
                        const firstFiveEntries = Object.entries(jsonContent).slice(0, 5);
                        for (const [key, value] of firstFiveEntries) {
                            const valueString = typeof value === 'object' ? 
                                '[Object]' : String(value).length > 100 ? 
                                    String(value).substring(0, 100) + '...' : String(value);
                            console.log(`  ${key}: ${valueString}`);
                        }
                    }
                } catch (error) {
                    console.log('- ERROR: Failed to parse JSON:', error);
                    return ['error', new Error(`Invalid JSON response: ${error instanceof Error ? error.message : String(error)}`)];
                }
                
                // Calculate confidence score
                const confidence = this.calculateConfidence(response, jsonContent);
                console.log('- Confidence score:', confidence);
                
                console.log('======== MISTRAL JSON EXTRACTION COMPLETE ========');
                
                return ['ok', {
                    json: jsonContent,
                    confidence
                }];
            } catch (apiError) {
                console.log('======== MISTRAL JSON EXTRACTION ERROR ========');
                console.log('- Error occurred at:', new Date().toISOString());
                console.log('- Error type:', apiError?.constructor?.name || 'Unknown');
                console.log('- Error message:', String(apiError));
                
                // Detect environment for environment-specific error handling
                const isNodeJS = typeof process !== 'undefined' && process.versions && process.versions.node;
                const isCloudflareWorker = typeof caches !== 'undefined' && typeof navigator !== 'undefined' && navigator.userAgent === 'Cloudflare-Workers';
                const isBrowser = typeof window !== 'undefined';
                
                console.log('- Environment context:');
                console.log(`  - Node.js: ${isNodeJS ? 'Yes' : 'No'}`);
                console.log(`  - Cloudflare Worker: ${isCloudflareWorker ? 'Yes' : 'No'}`);
                console.log(`  - Browser: ${isBrowser ? 'Yes' : 'No'}`);
                
                // Try to extract more detailed error information
                if (apiError instanceof Error) {
                    console.log('- Stack trace:', apiError.stack);
                    
                    // Check for error cause (useful in Node.js)
                    if ('cause' in apiError) {
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
                    
                    // Try to get response details if this is a Mistral API error
                    if ('response' in apiError && apiError.response) {
                        const response = (apiError as any).response;
                        console.log('- Response status:', response.status);
                        console.log('- Response status text:', response.statusText);
                        
                        // Try to parse response body
                        try {
                            if (typeof response.json === 'function') {
                                const responseJson = await response.json();
                                console.log('- Response body:', JSON.stringify(responseJson, null, 2));
                                
                                // Check for Mistral-specific error codes
                                if (responseJson.error && responseJson.error.code) {
                                    console.log('- Mistral error code:', responseJson.error.code);
                                    
                                    // Handle specific Mistral error codes
                                    if (responseJson.error.code === 3000) {
                                        console.log('- CRITICAL: Mistral service unavailable error detected');
                                        console.log('- This is a temporary service outage on Mistral\'s end');
                                    } else if (responseJson.error.code === 401) {
                                        console.log('- CRITICAL: Authentication error detected');
                                        console.log('- Check if API key is correct and properly set in Cloudflare');
                                    }
                                }
                            } else if (typeof response.text === 'function') {
                                const responseText = await response.text();
                                console.log('- Response text:', responseText);
                                
                                // Try to parse text as JSON if possible
                                try {
                                    const jsonFromText = JSON.parse(responseText);
                                    console.log('- Parsed JSON from text response:', JSON.stringify(jsonFromText, null, 2));
                                } catch (jsonParseError) {
                                    // Not JSON, that's fine
                                }
                            }
                        } catch (parseError) {
                            console.log('- Unable to parse response:', parseError);
                        }
                    }
                }
                
                // Environment-specific diagnostics
                if (isCloudflareWorker) {
                    console.log('- Cloudflare Worker specific diagnostics:');
                    try {
                        // Check if we can access the Mistral API key (without logging it)
                        // @ts-ignore - for debugging
                        console.log('  - API key available:', this.client.apiKey ? 'Yes (length: ' + this.client.apiKey.length + ')' : 'No');
                        
                        // Try to detect any Worker-specific issues
                        console.log('  - Worker CPU time limits may be exceeded for large images');
                        console.log('  - Check if Worker has appropriate memory limits configured');
                    } catch (workerDiagError) {
                        console.log('  - Error during Worker diagnostics:', workerDiagError);
                    }
                }
                
                console.log('======== MISTRAL JSON EXTRACTION ERROR END ========');
                return ['error', apiError instanceof Error ? apiError : new Error(String(apiError))];
            }
        } catch (error) {
            console.log('======== MISTRAL JSON GENERAL ERROR ========');
            console.log('Error type:', error instanceof Error ? error.constructor.name : typeof error);
            console.log('Error message:', String(error));
            if (error instanceof Error && error.stack) {
                console.log('Stack trace:', error.stack);
            }
            console.log('======== MISTRAL JSON GENERAL ERROR END ========');
            
            return ['error', error instanceof Error ? error : new Error(String(error))];
        }
    }
    
    /**
     * Constructs a prompt for the Mistral API
     * @param request The extraction request
     * @returns Formatted prompt string
     */
    private constructPrompt(request: JsonExtractionRequest): string {
        return request.markdown
    }
    
    /**
     * Calculates confidence score for the extraction
     * @param response The Mistral API response
     * @param extractedJson The extracted JSON data
     * @returns Confidence score between 0 and 1
     */
    private calculateConfidence(response: Record<string, unknown>, extractedJson: Record<string, unknown>): number {
        // Base confidence on multiple factors
        let finishReasonConfidence = 0.75; // Default value
        
        // Check finish reason from response
        if (Array.isArray(response.choices) && 
            response.choices.length > 0 && 
            typeof response.choices[0] === 'object' &&
            response.choices[0] !== null) {
            // If finishReason is "stop", give it maximum confidence
            if (response.choices[0].finishReason === 'stop') {
                finishReasonConfidence = 1.0;
            }
        }
        
        // Evaluate JSON structure completeness
        const jsonStructureConfidence = extractedJson && Object.keys(extractedJson).length > 0 ? 0.9 : 0.3;
        
        // Weigh finish reason more heavily (70%) than JSON structure (30%)
        const confidenceScore = (finishReasonConfidence * 0.7) + (jsonStructureConfidence * 0.3);
        
        // Return normalized score between 0 and 1, rounded to 2 decimal places
        return Math.round(confidenceScore * 100) / 100;
    }
    
    // Schema validation is now handled by Mistral's API
}