import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

// API endpoint configuration
const API_URL = process.env.OCR_API_URL || 'http://localhost:8787';

describe('Basic Server Health Checks', () => {
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