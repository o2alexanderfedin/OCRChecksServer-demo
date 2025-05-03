import { Mistral } from '@mistralai/mistralai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory info
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

// Get test image path
const testImagePath = path.join(projectRoot, 'tests', 'fixtures', 'images', 'IMG_2388.jpg');

describe('Mistral API Direct Test', () => {
  // Use a longer timeout for API calls
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000; // 60 seconds
  
  // Skip tests if API key is not available or image doesn't exist
  beforeAll(() => {
    if (!process.env.MISTRAL_API_KEY) {
      pending('MISTRAL_API_KEY environment variable not set');
    }
    
    if (!fs.existsSync(testImagePath)) {
      pending(`Test image not found at path: ${testImagePath}`);
    }
  });
  
  it('should call Mistral API directly with base64-encoded image', async () => {
    // Create Mistral client with API key
    const client = new Mistral({
      apiKey: process.env.MISTRAL_API_KEY
    });
    
    // Read the test image file
    const imageBuffer = fs.readFileSync(testImagePath);
    
    // Convert to base64
    const base64 = Buffer.from(imageBuffer).toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64}`;
    
    console.log(`Image size: ${imageBuffer.length} bytes`);
    console.log(`Base64 length: ${base64.length} characters`);
    console.log(`Data URL prefix: ${dataUrl.substring(0, 50)}...`);
    
    // Call the Mistral API
    const response = await client.ocr.process({
      model: "mistral-ocr-latest",
      document: {
        type: 'image_url',
        imageUrl: dataUrl
      }
    });
    
    // Log response for debugging
    console.log('Response received from Mistral API');
    console.log(`Pages: ${response.pages.length}`);
    if (response.pages.length > 0) {
      console.log(`First page text (sample): ${response.pages[0].markdown.substring(0, 100)}...`);
    }
    
    // Basic validations
    expect(response).toBeDefined();
    expect(response.pages).toBeDefined();
    expect(response.pages.length).toBeGreaterThan(0);
  });
});