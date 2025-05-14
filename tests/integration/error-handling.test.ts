/**
 * Integration tests for API error handling
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ErrorResponse } from '../../src/types/api-responses';
import { throttledFetch, setupThrottledFetch } from '../helpers/throttled-fetch.js';
import { setupServerCleanup } from '../helpers/server-cleanup.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

// API endpoint configuration
const API_URL = process.env.OCR_API_URL || 'http://localhost:8787';

// Set up proper server cleanup
setupServerCleanup().catch(error => {
  console.error('Failed to set up server cleanup:', error);
});

// Configure throttled fetch with recommended settings
setupThrottledFetch({
  enabled: true,
  requestInterval: 200, // Slightly more conservative than the 167ms limit
  debug: process.env.DEBUG_THROTTLE === 'true'
});

describe('API Error Handling', function() {
  // Set a longer timeout for API calls
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000; // 30 seconds
  
  it('should handle invalid content type for receipt endpoint', async function() {
    // Skip this test if running in an environment without fetch
    if (typeof fetch !== 'function') {
      pending('fetch is not available in this environment');
      return;
    }
    
    try {
      // Make the API request with incorrect content type
      console.log(`Testing error handling at ${API_URL}/receipt with invalid content type`);
      const response = await throttledFetch(`${API_URL}/receipt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'  // Should be image/*
        },
        body: JSON.stringify({ test: 'data' })
      });
      
      // Verify status code
      expect(response.status).toBe(400);
      
      // Verify content type
      const contentType = response.headers.get('Content-Type');
      expect(contentType).toContain('application/json');
      
      // Parse response body
      const body = await response.json() as ErrorResponse;
      console.log('Error response:', body);
      
      // Verify error structure
      expect(body.error).toBeDefined();
      expect(body.error).toContain('Invalid content type');
    } catch (error) {
      console.error('Test error:', error);
      fail(`Error executing invalid content type test: ${error}`);
    }
  });
  
  it('should handle invalid document type for process endpoint', async function() {
    // Skip this test if running in an environment without fetch
    if (typeof fetch !== 'function') {
      pending('fetch is not available in this environment');
      return;
    }
    
    try {
      // Create a simple 1x1 transparent GIF (to have valid image content)
      const transparentGif = Buffer.from(
        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        'base64'
      );
      
      // Make the API request with invalid document type
      console.log(`Testing error handling at ${API_URL}/process with invalid document type`);
      const response = await throttledFetch(`${API_URL}/process?type=invalid_type`, {
        method: 'POST',
        headers: {
          'Content-Type': 'image/gif'
        },
        body: transparentGif
      });
      
      // Verify status code
      expect(response.status).toBe(400);
      
      // Verify content type
      const contentType = response.headers.get('Content-Type');
      expect(contentType).toContain('application/json');
      
      // Parse response body
      const body = await response.json() as ErrorResponse;
      console.log('Error response:', body);
      
      // Verify error structure
      expect(body.error).toBeDefined();
      expect(body.error).toContain('Invalid document type');
    } catch (error) {
      console.error('Test error:', error);
      fail(`Error executing invalid document type test: ${error}`);
    }
  });
  
  it('should handle unsupported HTTP methods', async function() {
    // Skip this test if running in an environment without fetch
    if (typeof fetch !== 'function') {
      pending('fetch is not available in this environment');
      return;
    }
    
    try {
      // Make API request with unsupported HTTP method
      console.log(`Testing error handling for DELETE method at ${API_URL}/receipt`);
      const response = await throttledFetch(`${API_URL}/receipt`, {
        method: 'DELETE'
      });
      
      // For an unsupported method, the status should either be a client error (4xx) 
      // or server error (5xx), but not a success (2xx)
      expect(response.status < 200 || response.status >= 300).toBe(true);
      
      // Either 404 or 405 would be acceptable
      expect([404, 405]).toContain(response.status);
    } catch (error) {
      // Network error is also acceptable as the server might not handle this method at all
      console.log('Expected error from unsupported method:', error);
    }
  });
});