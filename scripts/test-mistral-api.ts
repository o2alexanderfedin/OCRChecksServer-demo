// A simple script to test the Mistral API directly with image inputs
import { Mistral } from '@mistralai/mistralai.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { addDevVarsToEnv } from './load-dev-vars.ts';

// Get directory info for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Load environment variables from .dev.vars file
console.log('Loading environment variables from .dev.vars file...');
await addDevVarsToEnv();

// Get API key from .dev.vars (loaded into environment variables)
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

if (!MISTRAL_API_KEY) {
  console.error('Error: Mistral API key not found. Please add it to your .dev.vars file or set it as an environment variable.');
  console.error('Example .dev.vars file:');
  console.error('MISTRAL_API_KEY=your_api_key_here');
  process.exit(1);
}

// Create Mistral client
const client = new Mistral({ apiKey: MISTRAL_API_KEY });

// Function to convert ArrayBuffer to base64 string
function arrayBufferToBase64Simple(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Function to convert ArrayBuffer to base64 with chunking
function arrayBufferToBase64Chunked(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 8192;
  let binary = '';
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    for (let j = 0; j < chunk.length; j++) {
      binary += String.fromCharCode(chunk[j]);
    }
  }
  
  return btoa(binary);
}

// Function to send an image URL to Mistral API
async function testWithImageUrl(imageUrl) {
  console.log(`Testing with image URL: ${imageUrl}`);
  
  try {
    const response = await client.ocr.process({
      model: "mistral-ocr-latest",
      document: {
        type: 'image_url',
        imageUrl: imageUrl
      }
    });
    
    console.log('Success with URL! Response:');
    console.log(JSON.stringify(response, null, 2));
    return true;
  } catch (error) {
    console.error('Error with URL:', error.message);
    if (error.response) {
      console.error('Response details:', JSON.stringify(error.response, null, 2));
    }
    return false;
  }
}

// Function to send a base64 image to Mistral API
async function testWithBase64(imagePath, converterFn) {
  console.log(`Testing with base64 image: ${imagePath} using ${converterFn.name}`);
  
  try {
    // Read image file
    const imageBuffer = fs.readFileSync(imagePath);
    
    // Convert to base64
    const base64Content = converterFn(imageBuffer.buffer);
    console.log(`Base64 length: ${base64Content.length}`);
    console.log(`Base64 start: ${base64Content.substring(0, 50)}...`);
    
    // Create data URL
    const mimeType = path.extname(imagePath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${base64Content}`;
    console.log(`Data URL start: ${dataUrl.substring(0, 100)}...`);
    
    // Send to Mistral API
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
    console.error(`Error with base64 (${converterFn.name}):`, error.message);
    if (error.response) {
      console.error('Response details:', JSON.stringify(error.response, null, 2));
    }
    return false;
  }
}

// Main function to run tests
async function runTests() {
  console.log('Starting Mistral API direct tests');
  console.log(`Using API key: ${MISTRAL_API_KEY.substring(0, 4)}...${MISTRAL_API_KEY.substring(MISTRAL_API_KEY.length - 4)}`);
  
  // Test images
  const imagePath = path.join(projectRoot, 'tests', 'fixtures', 'images', 'rental-bill.jpg');
  
  // Known working image URL for comparison
  const knownWorkingUrl = 'https://docs.mistral.ai/images/logo.svg';
  
  // Test results
  let results = {
    urlTests: {
      knownWorkingUrl: false
    },
    base64Tests: {
      simpleConverter: false,
      chunkedConverter: false
    }
  };
  
  // Run tests with URLs
  console.log('\n=== URL TESTS ===');
  results.urlTests.knownWorkingUrl = await testWithImageUrl(knownWorkingUrl);
  
  // Run tests with base64
  console.log('\n=== BASE64 TESTS ===');
  results.base64Tests.simpleConverter = await testWithBase64(imagePath, arrayBufferToBase64Simple);
  results.base64Tests.chunkedConverter = await testWithBase64(imagePath, arrayBufferToBase64Chunked);
  
  // Summary
  console.log('\n=== TEST RESULTS SUMMARY ===');
  console.log(JSON.stringify(results, null, 2));
}

// Run the tests
runTests().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});