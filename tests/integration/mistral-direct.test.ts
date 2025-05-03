import fs from 'fs';
import path from 'path';
import { Mistral } from '@mistralai/mistralai';
import { fileURLToPath } from 'url';

// Get directory info
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

// Get API key from environment variables or wrangler.toml
const wranglerPath = path.join(projectRoot, 'wrangler.toml');
const wranglerContent = fs.readFileSync(wranglerPath, 'utf-8');
const match = wranglerContent.match(/MISTRAL_API_KEY\s*=\s*"([^"]+)"/);
const MISTRAL_API_KEY = match ? match[1] : process.env.MISTRAL_API_KEY;

describe('Mistral Direct API Test', function() {
  // Set timeout for API calls
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000; // 60 seconds
  
  // Skip tests if API key is not available
  beforeAll(function() {
    if (!MISTRAL_API_KEY) {
      pending('MISTRAL_API_KEY not available');
    }
  });
  
  it('should successfully process an image using base64 encoding', async function() {
    // Create Mistral client directly
    const client = new Mistral({ apiKey: MISTRAL_API_KEY });
    
    // Read test image
    const imagePath = path.resolve(__dirname, '../fixtures/images/IMG_2388.jpg');
    const imageBuffer = fs.readFileSync(imagePath);
    
    // Convert to base64
    const base64 = Buffer.from(imageBuffer).toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64}`;
    
    // Log details for debugging
    console.log(`Image size: ${imageBuffer.length} bytes`);
    console.log(`Base64 length: ${base64.length} chars`);
    console.log(`Data URL starts with: ${dataUrl.substring(0, 50)}...`);
    
    // Call Mistral API directly
    try {
      const response = await client.ocr.process({
        model: "mistral-ocr-latest",
        document: {
          type: 'image_url',
          imageUrl: dataUrl
        }
      });
      
      // If successful, log the response
      console.log('API call successful');
      console.log('Response first page text:', response.pages[0].markdown.substring(0, 100));
      
      // Check response
      expect(response).toBeDefined();
      expect(response.pages).toBeDefined();
      expect(response.pages.length).toBeGreaterThan(0);
      
    } catch (error: any) {
      // Log detailed error for debugging
      console.error('Mistral API Error:', error.message);
      if (error.response) {
        console.error('Response details:', JSON.stringify(error.response, null, 2));
      }
      
      // Fail the test
      fail(`API call failed: ${error.message}`);
    }
  });
});