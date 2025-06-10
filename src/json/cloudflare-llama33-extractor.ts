/**
 * CloudflareLlama33JsonExtractor - JSON extractor using Cloudflare Workers AI
 * 
 * This implementation uses Cloudflare's native @cf/meta/llama-3.3-70b-instruct-fp8-fast model
 * for edge-native JSON extraction, eliminating external API dependencies and timeouts.
 */

import type { Result } from 'functionalscript/types/result/module.f.js';
import { injectable, inject } from 'inversify';
import { TYPES } from '../types/di-types.ts';
import type { IoE } from '../ocr/types.ts';
import { JsonExtractor, JsonExtractionRequest, JsonExtractionResult } from './types.ts';
import { JsonExtractionConfidenceCalculator } from './utils/confidence-calculator.ts';

/**
 * Cloudflare Workers AI binding interface
 * This represents the AI binding provided by Cloudflare Workers runtime
 */
export interface CloudflareAI {
  run(model: string, inputs: Record<string, unknown>): Promise<unknown>;
}

/**
 * CloudflareLlama33JsonExtractor implementation using Cloudflare Workers AI
 * Implements SOLID principles with dependency injection and single responsibility
 */
@injectable()
export class CloudflareLlama33JsonExtractor implements JsonExtractor {
  private readonly io: IoE;
  private readonly cloudflareAI: CloudflareAI;
  private readonly confidenceCalculator: JsonExtractionConfidenceCalculator;

  /**
   * Creates a new CloudflareLlama33JsonExtractor instance
   * @param io I/O interface for logging operations
   * @param cloudflareAI Cloudflare Workers AI binding
   * @param confidenceCalculator Confidence calculation utility
   */
  constructor(
    @inject(TYPES.IoE) io: IoE,
    @inject(TYPES.CloudflareAI) cloudflareAI: CloudflareAI,
    @inject(TYPES.JsonExtractionConfidenceCalculator) confidenceCalculator: JsonExtractionConfidenceCalculator
  ) {
    this.io = io;
    this.cloudflareAI = cloudflareAI;
    this.confidenceCalculator = confidenceCalculator;

    // Validate required dependencies
    if (!cloudflareAI) {
      const errorMessage = '[CloudflareLlama33JsonExtractor:constructor] CRITICAL ERROR: CloudflareAI binding is required';
      this.io.error(errorMessage);
      throw new Error('CloudflareAI binding is required');
    }
  }

  /**
   * Extract structured JSON data from markdown text using Cloudflare Workers AI
   * @param request The extraction request
   * @returns Promise of Result containing extraction result
   */
  async extract(request: JsonExtractionRequest): Promise<Result<JsonExtractionResult, Error>> {
    try {
      console.log('======== CLOUDFLARE LLAMA33 JSON EXTRACTION DEBUG INFO ========');
      console.log('Extracting JSON from markdown text using Cloudflare Workers AI...');
      console.log('- Input text length:', request.markdown.length, 'chars');
      console.log('- Schema provided:', request.schema ? 'Yes' : 'No');
      console.log('- Model: @cf/meta/llama-3.3-70b-instruct-fp8-fast');

      if (request.schema) {
        console.log('- Schema type:', typeof request.schema);
        if (typeof request.schema === 'object' && request.schema !== null) {
          const schema = request.schema as Record<string, unknown>;
          const schemaDefinition = schema.schemaDefinition as Record<string, unknown> | undefined;
          const properties = (schemaDefinition?.properties as Record<string, unknown>) || {};
          console.log('- Schema properties:', Object.keys(properties).join(', '));
        }
      }

      // Construct the prompt for Cloudflare AI
      const prompt = this.constructPrompt(request);
      console.log('- Prompt length:', prompt.length, 'chars');

      // Sample text from the beginning and end of the input
      const textSample = request.markdown.length > 200 ? 
        request.markdown.substring(0, 100) + '...' + request.markdown.substring(request.markdown.length - 100) : 
        request.markdown;
      console.log('- Text sample:', textSample.replace(/\n/g, ' '));

      console.log('======== CLOUDFLARE LLAMA33 JSON EXTRACTION REQUEST ========');
      console.log('- Model: @cf/meta/llama-3.3-70b-instruct-fp8-fast');
      console.log('- Input format: messages (chat completion)');
      console.log('- Max tokens: 2048');
      console.log('- Temperature: 0');
      console.log('- Stream: false');
      
      // Start timing the request
      const requestStartTime = Date.now();
      console.log('- Starting request at:', new Date().toISOString());

      // Prepare messages for Cloudflare AI
      const messages = [
        {
          role: 'system',
          content: 
            'You are a top-tier JSON extraction professional.\n' +
            'Extract valid JSON from the provided markdown using these critical guidelines:\n' +
            '1. The given markdown is the ONLY source of truth\n' +
            '2. Use null or empty values for fields you cannot confidently extract\n' +
            '3. NEVER invent or hallucinate data that is not explicitly in the text\n' +
            '4. Assign low confidence scores when information is unclear or incomplete\n' +
            '5. For minimal or empty images, provide empty/null values and low confidence\n' +
            '6. Set isValidInput=false if the input appears to be invalid or minimal\n' +
            '7. Ensure valid JSON with balanced quotes and correct syntax\n' +
            '8. Return ONLY the JSON object, no additional text or formatting\n' +
            '9. CRITICAL: Complete the entire JSON response - do not truncate or stop early\n' +
            '10. Ensure all opening braces { and brackets [ have matching closing braces } and brackets ]'
        },
        {
          role: 'user',
          content: prompt
        }
      ];

      // Call Cloudflare Workers AI with extended parameters
      try {
        const response = await this.cloudflareAI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
          messages: messages,
          max_tokens: 2048,  // Increase max tokens to prevent truncation
          temperature: 0,    // Completely deterministic output for consistent JSON
          stream: false      // Ensure we get the complete response, not streaming
        });

        const requestDuration = Date.now() - requestStartTime;
        console.log('======== CLOUDFLARE LLAMA33 JSON EXTRACTION RESPONSE ========');
        console.log('- Status: SUCCESS');
        console.log('- Request duration:', requestDuration, 'ms');
        console.log('- Response type:', typeof response);

        // Parse the response
        let jsonContent: Record<string, unknown>;
        try {
          // Cloudflare AI returns the response directly
          let responseText: string;
          
          if (typeof response === 'string') {
            responseText = response;
          } else if (response && typeof (response as Record<string, unknown>).response === 'string') {
            responseText = (response as Record<string, unknown>).response as string;
          } else if (response && typeof (response as Record<string, unknown>).result === 'string') {
            responseText = (response as Record<string, unknown>).result as string;
          } else {
            console.log('- WARNING: Unexpected response format, attempting to stringify');
            responseText = JSON.stringify(response);
          }

          console.log('- Raw response text length:', responseText.length);
          console.log('- Raw response text (first 500 chars):', responseText.substring(0, 500));
          if (responseText.length > 500) {
            console.log('- Raw response text (last 200 chars):', responseText.substring(responseText.length - 200));
          }

          // Clean and parse JSON with enhanced error handling
          const cleanedResponse = this.cleanJsonResponse(responseText);
          console.log('- Cleaned response length:', cleanedResponse.length);
          console.log('- Cleaned response (first 200 chars):', cleanedResponse.substring(0, 200));
          
          try {
            jsonContent = JSON.parse(cleanedResponse);
            console.log('- Successfully parsed JSON with keys:', Object.keys(jsonContent).join(', '));
          } catch (initialParseError) {
            console.log('- Initial JSON parsing failed, attempting recovery...');
            console.log('- Parse error:', initialParseError);
            
            // Attempt to fix common JSON issues
            const repairedJson = this.repairJsonResponse(cleanedResponse);
            if (repairedJson !== cleanedResponse) {
              console.log('- Attempting to parse repaired JSON...');
              console.log('- Repaired JSON (first 200 chars):', repairedJson.substring(0, 200));
              try {
                jsonContent = JSON.parse(repairedJson);
                console.log('- Successfully parsed repaired JSON with keys:', Object.keys(jsonContent).join(', '));
              } catch (repairParseError) {
                console.log('- Repaired JSON parsing also failed:', repairParseError);
                console.log('- Full cleaned response for debugging:', cleanedResponse);
                return ['error', new Error(`Invalid JSON response after repair attempts: ${repairParseError instanceof Error ? repairParseError.message : String(repairParseError)}`)];
              }
            } else {
              console.log('- No JSON repairs attempted, original error stands');
              console.log('- Full cleaned response for debugging:', cleanedResponse);
              return ['error', new Error(`Invalid JSON response: ${initialParseError instanceof Error ? initialParseError.message : String(initialParseError)}`)];
            }
          }
        } catch (parseError) {
          console.log('- Unexpected error during JSON processing:', parseError);
          return ['error', new Error(`JSON processing failed: ${parseError instanceof Error ? parseError.message : String(parseError)}`)];
        }

        // Note: Hallucination detection is now handled by scanners for better separation of concerns

        // Calculate confidence score using the shared utility
        // Create a mock response object for confidence calculation
        const mockResponse = {
          choices: [
            { finishReason: 'stop' } // Assume successful completion for Cloudflare AI
          ]
        };
        
        const confidence = this.confidenceCalculator.calculateConfidence(mockResponse, jsonContent);
        console.log('- Confidence score:', confidence);

        console.log('======== CLOUDFLARE LLAMA33 JSON EXTRACTION COMPLETE ========');

        return ['ok', {
          json: jsonContent,
          confidence: confidence
        }];

      } catch (aiError) {
        console.log('======== CLOUDFLARE LLAMA33 JSON EXTRACTION ERROR ========');
        console.log('- Error occurred at:', new Date().toISOString());
        console.log('- Error type:', aiError?.constructor?.name || 'Unknown');
        console.log('- Error message:', String(aiError));

        if (aiError instanceof Error) {
          console.log('- Stack trace:', aiError.stack);
        }

        console.log('- Request details:');
        console.log('  - Model: @cf/meta/llama-3.3-70b-instruct-fp8-fast');
        console.log('  - Input length:', request.markdown.length);
        console.log('  - Has schema:', !!request.schema);

        return ['error', aiError instanceof Error ? aiError : new Error(String(aiError))];
      }

    } catch (error) {
      console.log('======== CLOUDFLARE LLAMA33 JSON EXTRACTION CRITICAL ERROR ========');
      console.log('- Critical error occurred at:', new Date().toISOString());
      console.log('- Error type:', error?.constructor?.name || 'Unknown');
      console.log('- Error message:', String(error));

      if (error instanceof Error) {
        console.log('- Stack trace:', error.stack);
      }

      return ['error', error instanceof Error ? error : new Error(String(error))];
    }
  }

  /**
   * Constructs a prompt for JSON extraction based on the request
   * @param request The extraction request
   * @returns Formatted prompt string
   */
  private constructPrompt(request: JsonExtractionRequest): string {
    let prompt = `Extract structured data from the following text and return it as valid JSON:\n\n${request.markdown}\n\n`;

    if (request.schema) {
      prompt += `Please follow this JSON schema structure:\n${JSON.stringify(request.schema.schemaDefinition, null, 2)}\n\n`;
    }

    prompt += 'Return only the JSON object with no additional text or formatting.';

    return prompt;
  }

  /**
   * Cleans and prepares JSON response text for parsing
   * @param responseText Raw response text from AI model
   * @returns Cleaned JSON string
   */
  private cleanJsonResponse(responseText: string): string {
    // Remove markdown code blocks if present
    let cleaned = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Remove leading/trailing whitespace
    cleaned = cleaned.trim();
    
    // If the response starts with explanatory text, try to extract just the JSON
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }
    
    return cleaned;
  }

  /**
   * Attempts to repair common JSON parsing issues
   * @param jsonText Potentially malformed JSON string
   * @returns Repaired JSON string or original if no repairs made
   */
  private repairJsonResponse(jsonText: string): string {
    let repaired = jsonText;
    let wasRepaired = false;

    // Common issue 1: Incomplete JSON (missing closing braces)
    const openBraces = (repaired.match(/\{/g) || []).length;
    const closeBraces = (repaired.match(/\}/g) || []).length;
    
    if (openBraces > closeBraces) {
      const missingBraces = openBraces - closeBraces;
      repaired += '}'.repeat(missingBraces);
      wasRepaired = true;
      console.log(`- Added ${missingBraces} missing closing brace(s)`);
    }

    // Common issue 2: Trailing comma before closing brace
    repaired = repaired.replace(/,\s*}/g, '}');
    repaired = repaired.replace(/,\s*]/g, ']');
    
    // Common issue 3: Missing quotes around property names
    repaired = repaired.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
    
    // Common issue 4: Remove trailing commas in arrays
    repaired = repaired.replace(/,(\s*])/g, '$1');
    
    // Common issue 5: Incomplete string values (missing closing quotes)
    // This is more complex and risky, so we'll only fix obvious cases
    repaired = repaired.replace(/"([^"]*?)$/g, '"$1"');
    
    // Common issue 6: Truncated response - try to complete the last incomplete property
    if (repaired.endsWith('"')) {
      // If it ends with an incomplete property name or value, try to close it
      repaired += ': ""';
      wasRepaired = true;
      console.log('- Completed incomplete property with empty string value');
    } else if (repaired.match(/:\s*"[^"]*$/)) {
      // If it ends with an incomplete string value, close it
      repaired += '"';
      wasRepaired = true;
      console.log('- Closed incomplete string value');
    } else if (repaired.match(/:\s*[0-9]+$/)) {
      // Number values are usually complete, but check for context
      // This case is usually fine as-is
    } else if (repaired.match(/[{,]\s*"[^"]*$/)) {
      // Incomplete property name
      repaired += '": ""';
      wasRepaired = true;
      console.log('- Completed incomplete property name');
    }

    if (wasRepaired) {
      console.log('- JSON repair attempted');
    }

    return repaired;
  }
}