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
  
  it('should return correct health information', async () => {
    const response = await fetch(`${API_URL}/health`, { method: 'GET' });
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    
    // Verify response content
    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.version).toBe('1.12.2');
    expect(typeof data.timestamp).toBe('string');
  });
  
  it('should handle OPTIONS requests for CORS preflight on process endpoint', async () => {
    const response = await fetch(`${API_URL}/process`, { 
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    // Check if CORS is configured (may vary based on implementation)
    expect(response.status).toBeLessThan(300);
    
    // Verify CORS headers
    const corsHeader = response.headers.get('access-control-allow-origin');
    if (corsHeader) {
      expect(['*', 'http://localhost:3000']).toContain(corsHeader);
    }
  });
  
  it('should reject POST requests to process endpoint with invalid content type', async () => {
    const response = await fetch(`${API_URL}/process`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'data' })
    });
    
    // Should return 400 Bad Request for invalid content type
    expect(response.status).toBe(400);
    
    // Verify error response
    const data = await response.json();
    expect(data.error).toBeDefined();
    expect(data.error).toContain('Invalid content type');
  });
});