/**
 * JsonExtractionConfidenceCalculator - Shared utility for calculating confidence scores
 * 
 * This utility class provides methods to calculate confidence scores for JSON extraction
 * results, applying consistent confidence factors across different extractor implementations.
 */

import { injectable } from 'inversify';

/**
 * Service for calculating confidence scores in extracted JSON data
 * Implements SOLID principles with single responsibility for confidence calculation
 */
@injectable()
export class JsonExtractionConfidenceCalculator {
  
  /**
   * Calculates confidence score based on response metadata and extracted JSON content
   * 
   * @param response - The API response containing metadata like finish reason
   * @param extractedJson - The extracted JSON content
   * @returns Confidence score between 0 and 1, rounded to 2 decimal places
   */
  calculateConfidence(response: Record<string, unknown>, extractedJson: Record<string, unknown>): number {
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
    
    // Check if the extracted JSON has an isValidInput flag set to false,
    // which indicates potential hallucination
    let validInputMultiplier = 1.0;
    if (extractedJson && 'isValidInput' in extractedJson && extractedJson.isValidInput === false) {
        // If input is flagged as invalid, reduce confidence significantly
        validInputMultiplier = 0.3;
        console.log('- Input flagged as potentially invalid, reducing confidence');
    }
    
    // Weigh finish reason (60%), JSON structure (20%), and valid input status (20%)
    let confidenceScore = (finishReasonConfidence * 0.6) + (jsonStructureConfidence * 0.2);
    
    // Apply the valid input multiplier
    confidenceScore = confidenceScore * validInputMultiplier;
    
    // If there's an explicit confidence in the extracted JSON, weigh it as well
    if (extractedJson && 'confidence' in extractedJson && 
        typeof extractedJson.confidence === 'number' && 
        extractedJson.confidence >= 0 && 
        extractedJson.confidence <= 1) {
        // Blend with the model's own confidence assessment (weighted at 20%)
        confidenceScore = (confidenceScore * 0.8) + (extractedJson.confidence as number * 0.2);
        console.log('- Using model\'s confidence assessment:', extractedJson.confidence);
    }
    
    // Return normalized score between 0 and 1, rounded to 2 decimal places
    return Math.round(confidenceScore * 100) / 100;
  }
}