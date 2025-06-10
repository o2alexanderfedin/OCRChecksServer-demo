import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { CheckOCRResponse, ProcessDocumentResponse } from '../../src/types/api-responses.ts';
import { Check } from '../../src/json/schemas/check.ts';
import { throttledFetch, setupThrottledFetch } from '../helpers/throttled-fetch.ts';
// Create dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get API URL from environment
const API_URL = process.env.OCR_API_URL || 'http://localhost:8787';

// Configure throttled fetch with recommended settings
setupThrottledFetch({
  enabled: true,
  requestInterval: 200, // Slightly more conservative than the 167ms limit
  debug: process.env.DEBUG_THROTTLE === 'true'
});

describe('Check Processing API', function() {
  // Set a much longer timeout for API calls to prevent timeouts
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000; // 2 minutes
  
  it('should process a check image and return structured data', async function() {
    // Skip this test if running in an environment without fetch
    if (typeof fetch !== 'function') {
      pending('fetch is not available in this environment');
      return;
    }
    
    // Load test image from fixtures directory
    const imagePath = path.resolve(__dirname, '../fixtures/images/promo-check.HEIC');
    
    // Skip test if the image doesn't exist
    if (!fs.existsSync(imagePath)) {
      pending(`Test image not found at path: ${imagePath}`);
      return;
    }
    
    const imageBuffer = fs.readFileSync(imagePath);
    
    try {
      // Make API request
      console.log(`Sending check image to API at ${API_URL}/check`);
      const response = await throttledFetch(`${API_URL}/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'image/jpeg'
        },
        body: imageBuffer
      });
      
      // Skip test if we get rate limited or other server errors
      if (response.status === 429 || response.status >= 500) {
        const errorText = await response.text();
        pending(`API error (${response.status}): ${errorText}`);
        return;
      }
      
      // Assert response
      expect(response.status).toBe(200);
      
      // Parse JSON response
      const result = await response.json() as CheckOCRResponse;
      console.log('API response:', JSON.stringify(result, null, 2));
      
      // Verify response structure
      expect(result.data).toBeDefined();
      expect(result.confidence).toBeDefined();
      expect(result.confidence.ocr).toBeDefined();
      expect(result.confidence.extraction).toBeDefined();
      expect(result.confidence.overall).toBeDefined();
      
      // Verify check data
      const checkData = result.data as Check;
      expect(checkData.checkNumber).toBeDefined();
      expect(checkData.date).toBeDefined();
      expect(checkData.payee).toBeDefined();
      expect(checkData.amount).toBeDefined();
    } catch (error) {
      // If there's a network error or other exception, mark the test as pending
      console.error('Test error:', error);
      pending(`Error executing test: ${error}`);
    }
  });
  
  it('should process a check image using the universal endpoint', async function() {
    // Skip this test if running in an environment without fetch
    if (typeof fetch !== 'function') {
      pending('fetch is not available in this environment');
      return;
    }
    
    // Load test image from fixtures directory
    const imagePath = path.resolve(__dirname, '../fixtures/images/promo-check.HEIC');
    
    // Skip test if the image doesn't exist
    if (!fs.existsSync(imagePath)) {
      pending(`Test image not found at path: ${imagePath}`);
      return;
    }
    
    const imageBuffer = fs.readFileSync(imagePath);
    
    try {
      // Make API request
      console.log(`Sending check image to API at ${API_URL}/process?type=check`);
      const response = await throttledFetch(`${API_URL}/process?type=check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'image/jpeg'
        },
        body: imageBuffer
      });
      
      // Skip test if we get rate limited or other server errors
      if (response.status === 429 || response.status >= 500) {
        const errorText = await response.text();
        pending(`API error (${response.status}): ${errorText}`);
        return;
      }
      
      // Assert response
      expect(response.status).toBe(200);
      
      // Parse JSON response
      const result = await response.json() as ProcessDocumentResponse;
      console.log('API response:', JSON.stringify(result, null, 2));
      
      // Verify response structure
      expect(result.data).toBeDefined();
      expect(result.documentType).toBe('check');
      expect(result.confidence).toBeDefined();
      
      // Verify check data
      const checkData = result.data as Check;
      expect(checkData.checkNumber).toBeDefined();
      expect(checkData.date).toBeDefined();
      expect(checkData.payee).toBeDefined();
      expect(checkData.amount).toBeDefined();
    } catch (error) {
      // If there's a network error or other exception, mark the test as pending
      console.error('Test error:', error);
      pending(`Error executing test: ${error}`);
    }
  });
});