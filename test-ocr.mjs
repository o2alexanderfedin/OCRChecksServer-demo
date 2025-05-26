// Test script to check OCR output directly
import fs from 'fs';
import { Mistral } from '@mistralai/mistralai';

// Read the API key from .dev.vars
const loadApiKey = () => {
  try {
    const content = fs.readFileSync('.dev.vars', 'utf8');
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.startsWith('MISTRAL_API_KEY=')) {
        return line.substring('MISTRAL_API_KEY='.length);
      }
    }
    throw new Error('MISTRAL_API_KEY not found in .dev.vars');
  } catch (error) {
    console.error('Error loading API key:', error);
    process.exit(1);
  }
};

const MISTRAL_API_KEY = loadApiKey();
const client = new Mistral({ apiKey: MISTRAL_API_KEY });

// Function to test OCR directly
async function testOCR(imagePath) {
  try {
    console.log(`Testing OCR with image: ${imagePath}`);
    
    // Read the image file
    const imageBuffer = fs.readFileSync(imagePath);
    
    // Convert to base64
    const base64 = imageBuffer.toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64}`;
    
    // Call Mistral OCR API
    console.log('Calling Mistral OCR API...');
    const response = await client.ocr.process({
      model: "mistral-ocr-latest",
      document: {
        type: 'image_url',
        imageUrl: dataUrl
      }
    });
    
    // Extract OCR text
    const ocrText = response.pages[0].markdown;
    
    // Save OCR text to file
    const outputPath = imagePath.replace(/\.(jpg|jpeg|png|HEIC)$/i, '-ocr.txt');
    fs.writeFileSync(outputPath, ocrText);
    
    console.log(`OCR text saved to: ${outputPath}`);
    console.log(`OCR text length: ${ocrText.length} characters`);
    console.log(`OCR text sample: ${ocrText.substring(0, 300)}...`);
    
    return ocrText;
  } catch (error) {
    console.error('Error running OCR:', error);
    return null;
  }
}

// Run OCR test
const imagePath = process.argv[2];
if (!imagePath) {
  console.error('Usage: node test-ocr.mjs <image-path>');
  process.exit(1);
}

testOCR(imagePath).catch(error => {
  console.error('Unhandled error:', error);
});