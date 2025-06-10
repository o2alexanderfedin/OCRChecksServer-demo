// A simple script to test the Mistral API directly with image inputs
import { Mistral } from '@mistralai/mistralai.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory info for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname);

// Get the API key from environment variable or command line
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

if (!MISTRAL_API_KEY) {
  console.error('Error: Mistral API key not found in environment variables');
  process.exit(1);
}

// Create Mistral client
const client = new Mistral({ apiKey: MISTRAL_API_KEY });

// Function to convert ArrayBuffer to base64 string
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Function to send a base64 image to Mistral API
async function testWithBase64(imagePath) {
  console.log(`Testing with base64 image: ${imagePath}`);
  
  try {
    // Read image file
    const imageBuffer = fs.readFileSync(imagePath);
    
    // Convert to base64
    const base64Content = arrayBufferToBase64(imageBuffer.buffer);
    console.log(`Base64 length: ${base64Content.length}`);
    
    // Create data URL
    const mimeType = path.extname(imagePath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${base64Content}`;
    
    // Send to Mistral API
    console.log('Sending request to Mistral API...');
    const response = await client.ocr.process({
      model: "mistral-ocr-latest",
      document: {
        type: 'image_url',
        imageUrl: dataUrl
      }
    });
    
    console.log('Success with base64! Response:');
    console.log(JSON.stringify(response, null, 2));
    return true;
  } catch (error) {
    console.error(`Error with base64:`, error.message);
    if (error.response) {
      console.error('Response details:', JSON.stringify(error.response, null, 2));
    }
    return false;
  }
}

// Main function to run tests
async function runTests() {
  console.log('Starting Mistral API direct test');
  console.log(`Using API key: ${MISTRAL_API_KEY.substring(0, 4)}...${MISTRAL_API_KEY.substring(MISTRAL_API_KEY.length - 4)}`);
  
  // Test with a receipt image
  const imagePath = path.join(projectRoot, 'tests', 'fixtures', 'images', 'fredmeyer-receipt.jpg');
  
  // Run test with base64
  console.log('\n=== BASE64 TEST ===');
  await testWithBase64(imagePath);
}

// Run the tests
runTests().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});