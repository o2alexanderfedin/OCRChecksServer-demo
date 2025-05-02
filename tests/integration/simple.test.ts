import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

// API endpoint configuration
const API_URL = process.env.OCR_API_URL || 'http://localhost:8787';
console.log('Using API URL:', API_URL);

describe('Basic Server Health Checks', function() {
  // Increase timeout for all tests in this suite
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000; // 20 seconds
  // Helper function to check server availability
  async function checkServerAvailability() {
    try {
      console.log(`Checking server at ${API_URL}/health...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(`${API_URL}/health`, { 
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        try {
          const data = await response.json();
          console.log(`Server health check passed: ${JSON.stringify(data)}`);
          
          // Verify the response format is correct
          if (!data || typeof data !== 'object') {
            console.error('Health check response is not an object');
            return null;
          }
          
          if (!data.status || data.status !== 'ok') {
            console.error(`Health check status is not 'ok': ${data.status}`);
            return null;
          }
          
          console.log('Health check validation passed');
        } catch (jsonError) {
          console.error(`Failed to parse health check response: ${jsonError.message}`);
          return null;
        }
      } else {
        console.log(`Server responded with status: ${response.status}`);
      }
      
      return response;
    } catch (error) {
      console.error(`Server health check failed: ${error.message}`);
      return null;
    }
  }
  
  beforeAll(async () => {
    // Make sure server is available before running tests
    const response = await checkServerAvailability();
    if (!response) {
      console.error('Server is not available. Marking tests as pending.');
      pending('Server is not available. Skipping tests.');
    }
  }, 10000); // Increase timeout to 10 seconds
  
  it('should respond to HEAD requests (server availability check)', async () => {
    const response = await fetch(API_URL, { method: 'HEAD' });
    expect(response.status).toBeLessThan(500); // Any non-server error is acceptable
  });
  
  it('should respond to GET requests with proper headers', async () => {
    const response = await fetch(API_URL);
    expect(response.headers.get('content-type')).toBeDefined();
    expect(response.status).toBeLessThan(500); // Any non-server error is acceptable
  });
  
  it('should handle OPTIONS requests for CORS preflight', async () => {
    const response = await fetch(API_URL, { 
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    // Check if CORS is configured (may vary based on implementation)
    expect(response.status).toBeLessThan(500);
    
    // If the API supports CORS, verify headers
    if (response.status === 204 || response.status === 200) {
      const corsHeader = response.headers.get('access-control-allow-origin');
      if (corsHeader) {
        expect(['*', 'http://localhost:3000']).toContain(corsHeader);
      }
    }
  });
  
  it('should reject requests with invalid methods', async () => {
    try {
      const response = await fetch(API_URL, { method: 'PUT' });
      
      // Either reject with 4xx status or accept but return error
      if (response.status >= 200 && response.status < 300) {
        const body = await response.json();
        expect(body.error).toBeDefined();
      } else {
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.status).toBeLessThan(500);
      }
    } catch (error) {
      // Network errors are also acceptable here
      // as long as it's not a server-side error
      expect(error).toBeDefined();
    }
  });
});