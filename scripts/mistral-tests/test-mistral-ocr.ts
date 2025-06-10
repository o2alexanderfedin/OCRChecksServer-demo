// A simple script to test the Mistral OCR API with receipt image
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

// Function to send a base64 image to Mistral API and extract text
async function testOCR(imagePath) {
  console.log(`Testing OCR with image: ${imagePath}`);
  
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
    console.log('Sending OCR request to Mistral API...');
    
    // First get the text content with OCR
    const ocrResponse = await client.ocr.process({
      model: "mistral-ocr-latest",
      document: {
        type: 'image_url',
        imageUrl: dataUrl
      }
    });
    
    console.log('OCR Success! Response:');
    console.log(JSON.stringify(ocrResponse, null, 2));
    
    // Now let's use Mistral to extract structured data from the receipt
    const messages = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `You are an expert receipt parser. Please analyze the OCR text from this receipt and extract the following information in JSON format:
            1. Store/merchant name
            2. Date and time
            3. Total amount
            4. Payment method (if available)
            5. List of items purchased (if available)
            
            Here is the receipt OCR text:
            ${JSON.stringify(ocrResponse, null, 2)}`
          }
        ]
      }
    ];
    
    console.log('Asking Mistral to extract structured data...');
    const chatResponse = await client.chat({
      model: "mistral-large-latest",
      messages: messages
    });
    
    console.log('\nExtracted Structured Data:');
    console.log(chatResponse.choices[0].message.content);
    
    return true;
  } catch (error) {
    console.error(`Error with OCR:`, error.message);
    if (error.response) {
      console.error('Response details:', JSON.stringify(error.response, null, 2));
    }
    return false;
  }
}

// Main function to run tests
async function runTests() {
  console.log('Starting Mistral OCR Test');
  console.log(`Using API key: ${MISTRAL_API_KEY.substring(0, 4)}...${MISTRAL_API_KEY.substring(MISTRAL_API_KEY.length - 4)}`);
  
  // Test with a receipt image
  const imagePath = path.join(projectRoot, 'tests', 'fixtures', 'images', 'fredmeyer-receipt.jpg');
  
  // Run test with OCR
  console.log('\n=== OCR TEST ===');
  await testOCR(imagePath);
}

// Run the tests
runTests().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});