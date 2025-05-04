import type { Result } from 'functionalscript/types/result/module.f.js'
import { Mistral } from '@mistralai/mistralai'
import type { IoE } from '../ocr/types'
import { JsonExtractor, JsonExtractionRequest, JsonExtractionResult } from './types'

/**
 * Mistral JSON extractor implementation
 */
export class MistralJsonExtractorProvider implements JsonExtractor {
    private readonly client: Mistral
    private readonly io: IoE

    /**
     * Creates a new Mistral JSON extractor instance
     * @param io I/O interface for network operations
     * @param client Mistral client instance
     */
    constructor(io: IoE, client: Mistral) {
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
            // Construct the prompt for Mistral
            const prompt = this.constructPrompt(request)
            
            // Call Mistral API
            const response = await this.client.chat.complete({
                model: 'mistral-large-latest',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a JSON extraction specialist. Extract structured data from the provided text and return it as valid JSON.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                responseFormat: request.schema 
                    ? { type: 'json_schema', jsonSchema: request.schema }
                    : { type: 'json_object' }
            })
            
            // Parse the response
            let jsonContent: Record<string, unknown>
            try {
                // Make sure choices exists and has at least one element
                if (!response.choices || response.choices.length === 0) {
                    return ['error', new Error('Empty response from Mistral API')]
                }

                const content = response.choices[0].message.content
                if (typeof content !== 'string') {
                    return ['error', new Error('Invalid response format from Mistral API')]
                }

                jsonContent = JSON.parse(content)
            } catch (error) {
                return ['error', new Error(`Invalid JSON response: ${error instanceof Error ? error.message : String(error)}`)]
            }
            
            // Validation is handled by Mistral's JSON schema support
            
            // Calculate confidence score
            const confidence = this.calculateConfidence(response, jsonContent)
            
            return ['ok', {
                json: jsonContent,
                confidence
            }]
        } catch (error) {
            return ['error', error instanceof Error ? error : new Error(String(error))]
        }
    }
    
    /**
     * Constructs a prompt for the Mistral API
     * @param request The extraction request
     * @returns Formatted prompt string
     */
    private constructPrompt(request: JsonExtractionRequest): string {
        let prompt = `Extract the following information from this markdown text as JSON:\n\n${request.markdown}\n\n`
        prompt += "Provide your response as a valid JSON object only."
        return prompt
    }
    
    /**
     * Calculates confidence score for the extraction
     * @param response The Mistral API response
     * @param extractedJson The extracted JSON data
     * @returns Confidence score between 0 and 1
     */
    private calculateConfidence(response: Record<string, unknown>, extractedJson: Record<string, unknown>): number {
        // Base confidence on multiple factors
        const factors = [
            // 1. Model finish reason (1.0 if "stop", 0.5 if other)
            Array.isArray(response.choices) && 
            response.choices.length > 0 && 
            typeof response.choices[0] === 'object' &&
            response.choices[0] !== null &&
            response.choices[0].finish_reason === 'stop' ? 1.0 : 0.5,
            
            // 2. JSON structure completeness (0.0-1.0)
            extractedJson && Object.keys(extractedJson).length > 0 ? 1.0 : 0.3,
            
            // 3. Additional confidence factors can be added here
            // such as schema validation percentage, field completeness, etc.
        ]
        
        // Average the factors for final confidence score
        const confidenceScore = factors.reduce((sum, factor) => sum + factor, 0) / factors.length
        
        // Return normalized score between 0 and 1, rounded to 2 decimal places
        return Math.round(confidenceScore * 100) / 100
    }
    
    // Schema validation is now handled by Mistral's API
}