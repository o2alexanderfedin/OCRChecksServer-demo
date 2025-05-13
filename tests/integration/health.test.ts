/**
 * Integration test for the health check endpoint
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { HealthResponse } from '../../src/types/api-responses';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

// API endpoint configuration
const API_URL = process.env.OCR_API_URL || 'http://localhost:8787';

describe('Health Check Endpoint', function() {
  // Set a longer timeout for API calls
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000; // 30 seconds
  
  it('should return correct health information', async function() {
    // Skip this test if running in an environment without fetch
    if (typeof fetch !== 'function') {
      pending('fetch is not available in this environment');
      return;
    }
    
    try {
      // Make the API request to the health endpoint
      console.log(`Checking health endpoint at ${API_URL}/health`);
      const response = await fetch(`${API_URL}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      // Verify status code
      expect(response.status).toBe(200);
      
      // Verify content type
      const contentType = response.headers.get('Content-Type');
      expect(contentType).toContain('application/json');
      
      // Parse response body
      const body = await response.json() as HealthResponse;
      console.log('Health endpoint response:', body);
      
      // Verify response structure
      expect(body.status).toBe('ok');
      expect(typeof body.timestamp).toBe('string');
      expect(typeof body.version).toBe('string');
      
      // Check timestamp is valid date
      const timestamp = new Date(body.timestamp);
      expect(isNaN(timestamp.getTime())).toBe(false);
      
      // Check version is in the format x.y.z
      expect(body.version).toMatch(/^\d+\.\d+\.\d+$/);
      
      // Check Mistral API key status if present
      if (body.mistralApiKeyStatus) {
        expect(typeof body.mistralApiKeyStatus.configured).toBe('boolean');
        expect(typeof body.mistralApiKeyStatus.message).toBe('string');
        console.log('Mistral API key status:', body.mistralApiKeyStatus);
      }
    } catch (error) {
      console.error('Test error:', error);
      fail(`Error executing health check test: ${error}`);
    }
  });
});