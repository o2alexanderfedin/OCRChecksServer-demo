// A simple script to test the Mistral OCR API with receipt image for text extraction
import { Mistral } from '@mistralai/mistralai';
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

// Function to send a base64 image to Mistral API for text extraction
async function testOCRText(imagePath) {
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
    
    // Get the text content with OCR
    const ocrResponse = await client.ocr.process({
      model: "mistral-ocr-latest",
      document: {
        type: 'image_url',
        imageUrl: dataUrl
      }
    });
    
    console.log('OCR Success! Response:');
    console.log(JSON.stringify(ocrResponse, null, 2));
    
    // Check if we have text content
    if (ocrResponse.pages && ocrResponse.pages.length > 0) {
      for (const page of ocrResponse.pages) {
        if (page.text) {
          console.log('\nExtracted OCR Text:');
          console.log(page.text);
        } else if (page.markdown) {
          console.log('\nMarkdown Content:');
          console.log(page.markdown);
        }
      }
    }
    
    // Also try to get the text through different means
    console.log('\nGetting text content using alternative methods...');
    const ocrText = await client.ocr.process({
      model: "mistral-ocr-latest",
      document: {
        type: 'image_url',
        imageUrl: dataUrl
      },
      responseFormat: 'text'
    });
    
    console.log('Text response format:');
    console.log(ocrText);
    
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
  console.log('Starting Mistral OCR Text Test');
  console.log(`Using API key: ${MISTRAL_API_KEY.substring(0, 4)}...${MISTRAL_API_KEY.substring(MISTRAL_API_KEY.length - 4)}`);
  
  // Test with a receipt image
  const imagePath = path.join(projectRoot, 'tests', 'fixtures', 'images', 'fredmeyer-receipt.jpg');
  
  // Run test with OCR
  console.log('\n=== OCR TEXT TEST ===');
  await testOCRText(imagePath);
}

// Run the tests
runTests().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});