/**
 * Unit tests for JsonExtractionConfidenceCalculator utility
 */

import { JsonExtractionConfidenceCalculator } from '../../../../src/json/utils/confidence-calculator.js';

describe('JsonExtractionConfidenceCalculator', () => {
  let calculator: JsonExtractionConfidenceCalculator;

  beforeEach(() => {
    calculator = new JsonExtractionConfidenceCalculator();
  });

  describe('calculateConfidence', () => {
    it('should calculate maximum confidence for stop finish reason with valid JSON', () => {
      // Red phase: This test should fail initially
      const response = {
        choices: [
          { finishReason: 'stop' }
        ]
      };
      
      const extractedJson = {
        checkNumber: '12345',
        confidence: 0.9
      };

      const confidence = calculator.calculateConfidence(response, extractedJson);

      // Expected: (1.0 * 0.6) + (0.9 * 0.2) = 0.6 + 0.18 = 0.78 base
      // Then blended with model confidence: (0.78 * 0.8) + (0.9 * 0.2) = 0.624 + 0.18 = 0.80
      expect(confidence).toBe(0.80);
    });

    it('should reduce confidence for invalid input flag', () => {
      const response = {
        choices: [
          { finishReason: 'stop' }
        ]
      };
      
      const extractedJson = {
        checkNumber: '1234',
        isValidInput: false,
        confidence: 0.9
      };

      const confidence = calculator.calculateConfidence(response, extractedJson);

      // Should be significantly reduced due to isValidInput: false
      expect(confidence).toBeLessThanOrEqual(0.3);
    });

    it('should handle default finish reason confidence', () => {
      const response = {
        choices: [
          { finishReason: 'length' }
        ]
      };
      
      const extractedJson = {
        data: 'some data'
      };

      const confidence = calculator.calculateConfidence(response, extractedJson);

      // Expected: (0.75 * 0.6) + (0.9 * 0.2) = 0.45 + 0.18 = 0.63
      expect(confidence).toBe(0.63);
    });

    it('should handle empty JSON with low confidence', () => {
      const response = {
        choices: [
          { finishReason: 'stop' }
        ]
      };
      
      const extractedJson = {};

      const confidence = calculator.calculateConfidence(response, extractedJson);

      // Expected: (1.0 * 0.6) + (0.3 * 0.2) = 0.6 + 0.06 = 0.66
      expect(confidence).toBe(0.66);
    });

    it('should handle missing choices array', () => {
      const response = {};
      
      const extractedJson = {
        data: 'some data'
      };

      const confidence = calculator.calculateConfidence(response, extractedJson);

      // Should use default finish reason confidence
      expect(confidence).toBe(0.63);
    });

    it('should blend model confidence correctly', () => {
      const response = {
        choices: [
          { finishReason: 'stop' }
        ]
      };
      
      const extractedJson = {
        data: 'some data',
        confidence: 0.5
      };

      const confidence = calculator.calculateConfidence(response, extractedJson);

      // Base: (1.0 * 0.6) + (0.9 * 0.2) = 0.78
      // Blended: (0.78 * 0.8) + (0.5 * 0.2) = 0.624 + 0.1 = 0.72
      expect(confidence).toBe(0.72);
    });

    it('should round to 2 decimal places', () => {
      const response = {
        choices: [
          { finishReason: 'stop' }
        ]
      };
      
      const extractedJson = {
        data: 'some data',
        confidence: 0.333
      };

      const confidence = calculator.calculateConfidence(response, extractedJson);

      // Should be rounded to 2 decimal places
      expect(Number.isInteger(confidence * 100)).toBe(true);
    });

    it('should ignore invalid model confidence values', () => {
      const response = {
        choices: [
          { finishReason: 'stop' }
        ]
      };
      
      const extractedJson = {
        data: 'some data',
        confidence: 1.5 // Invalid - outside 0-1 range
      };

      const confidence = calculator.calculateConfidence(response, extractedJson);

      // Should ignore invalid confidence and use base calculation
      // (1.0 * 0.6) + (0.9 * 0.2) = 0.78
      expect(confidence).toBe(0.78);
    });

    it('should handle null extracted JSON gracefully', () => {
      const response = {
        choices: [
          { finishReason: 'stop' }
        ]
      };
      
      const extractedJson = null as any;

      const confidence = calculator.calculateConfidence(response, extractedJson);

      // Should handle gracefully with low JSON structure confidence
      expect(confidence).toBeGreaterThan(0);
      expect(confidence).toBeLessThan(1);
    });
  });

  describe('constructor injection', () => {
    it('should be injectable', () => {
      // Test that the class can be instantiated (DI requirement)
      expect(calculator).toBeInstanceOf(JsonExtractionConfidenceCalculator);
    });
  });
});