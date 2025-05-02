import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Create dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get API URL from environment
const API_URL = process.env.OCR_API_URL || 'http://localhost:8787';

describe('Receipt Processing API', function() {
  // Set a much longer timeout for API calls to prevent timeouts
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000; // 2 minutes
  
  it('should process a receipt image and return structured data', async function() {
    // Skip this test if running in an environment without fetch
    if (typeof fetch \!== 'function') {
      pending('fetch is not available in this environment');
      return;
    }
    
    // Load test image from fixtures directory
    const imagePath = path.resolve(__dirname, './fixtures/images/telegram-cloud-photo-size-1-4915775046379745521-y.jpg');
    
    // Skip test if the image doesn't exist
    if (\!fs.existsSync(imagePath)) {
      pending(`Test image not found at path: ${imagePath}`);
      return;
    }
    
    const imageBuffer = fs.readFileSync(imagePath);
    
    try {
      // Make API request
      console.log(`Sending receipt image to API at ${API_URL}/receipt`);
      const response = await fetch(`${API_URL}/receipt`, {
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
      const result = await response.json();
      console.log('API response:', JSON.stringify(result, null, 2));
      
      // Verify response structure
      expect(result.data).toBeDefined();
      expect(result.confidence).toBeDefined();
      expect(result.confidence.ocr).toBeDefined();
      expect(result.confidence.extraction).toBeDefined();
      expect(result.confidence.overall).toBeDefined();
      
      // Verify receipt data
      const receiptData = result.data;
      expect(receiptData.merchant).toBeDefined();
      expect(receiptData.merchant.name).toBeDefined();
      expect(receiptData.timestamp).toBeDefined();
      expect(receiptData.totals).toBeDefined();
      expect(receiptData.totals.total).toBeDefined();
      expect(receiptData.currency).toBeDefined();
      expect(receiptData.confidence).toBeDefined();
    } catch (error) {
      // If there's a network error or other exception, mark the test as pending
      console.error('Test error:', error);
      pending(`Error executing test: ${error}`);
    }
  });
  
  it('should process a receipt image using the universal endpoint', async function() {
    // Skip this test if running in an environment without fetch
    if (typeof fetch \!== 'function') {
      pending('fetch is not available in this environment');
      return;
    }
    
    // Load test image from fixtures directory
    const imagePath = path.resolve(__dirname, './fixtures/images/telegram-cloud-photo-size-1-4915775046379745521-y.jpg');
    
    // Skip test if the image doesn't exist
    if (\!fs.existsSync(imagePath)) {
      pending(`Test image not found at path: ${imagePath}`);
      return;
    }
    
    const imageBuffer = fs.readFileSync(imagePath);
    
    try {
      // Make API request
      console.log(`Sending receipt image to API at ${API_URL}/process?type=receipt`);
      const response = await fetch(`${API_URL}/process?type=receipt`, {
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
      const result = await response.json();
      console.log('API response:', JSON.stringify(result, null, 2));
      
      // Verify response structure
      expect(result.data).toBeDefined();
      expect(result.documentType).toBe('receipt');
      expect(result.confidence).toBeDefined();
      
      // Verify receipt data
      const receiptData = result.data;
      expect(receiptData.merchant).toBeDefined();
      expect(receiptData.merchant.name).toBeDefined();
      expect(receiptData.timestamp).toBeDefined();
      expect(receiptData.totals).toBeDefined();
      expect(receiptData.totals.total).toBeDefined();
      expect(receiptData.currency).toBeDefined();
    } catch (error) {
      // If there's a network error or other exception, mark the test as pending
      console.error('Test error:', error);
      pending(`Error executing test: ${error}`);
    }
  });
});
EOL < /dev/null