// Test script for anti-hallucination detection with tiny-test.jpg
import { ScannerFactory } from './src/scanner/factory.ts';
import { workerIoE } from './src/io.ts';
import { Document, DocumentType } from './src/ocr/types.ts';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { addDevVarsToEnv } from './scripts/load-dev-vars.ts';

// Load environment variables
await addDevVarsToEnv();

// Create dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if Mistral API key is available
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
if (!MISTRAL_API_KEY) {
  console.error('Error: MISTRAL_API_KEY environment variable not set');
  process.exit(1);
}

// Create a complete IoE implementation
const io = {
  ...workerIoE,
  console: console,
  fs: {
    writeFileSync: fs.writeFileSync,
    readFileSync: fs.readFileSync,
    existsSync: fs.existsSync,
    promises: fs.promises
  },
  process: process,
  asyncImport: async (path) => import(path),
  performance: {
    now: () => performance.now()
  },
  tryCatch: (f) => {
    try {
      return ['ok', f()];
    } catch (error) {
      return ['error', error];
    }
  }
};

async function runTest() {
  console.log('Testing anti-hallucination detection with tiny-test.jpg');
  
  // Create scanner
  const scanner = ScannerFactory.createMistralCheckScanner(io, MISTRAL_API_KEY);
  
  // Load test image
  const imagePath = path.resolve(__dirname, 'tiny-test.jpg');
  console.log('Image path:', imagePath);
  
  // Check if the file exists
  if (!fs.existsSync(imagePath)) {
    console.error(`Test image not found at path: ${imagePath}`);
    process.exit(1);
  }
  
  const imageBuffer = fs.readFileSync(imagePath);
  
  // Create document
  const document = {
    content: imageBuffer.buffer,
    type: DocumentType.Image,
    name: 'tiny-test.jpg'
  };
  
  try {
    // Process document
    console.log('Processing document...');
    const result = await scanner.processDocument(document);
    
    console.log('Process result:', JSON.stringify(result, null, 2));
    
    if (Array.isArray(result) && result[0] === 'ok') {
      const data = result[1];
      
      console.log('\n=== ANTI-HALLUCINATION TEST RESULTS ===');
      console.log('OCR confidence:', data.ocrConfidence);
      console.log('Extraction confidence:', data.extractionConfidence);
      console.log('Overall confidence:', data.overallConfidence);
      
      // Check for hallucination detection
      const checkData = data.json;
      console.log('isValidInput flag present:', checkData.isValidInput !== undefined);
      console.log('isValidInput value:', checkData.isValidInput);
      console.log('Confidence score:', checkData.confidence);
      
      console.log('\nCheck data extracted:');
      console.log('- checkNumber:', checkData.checkNumber);
      console.log('- payee:', checkData.payee);
      console.log('- date:', checkData.date);
      console.log('- amount:', checkData.amount);
      
      // Test success criteria
      if (checkData.isValidInput === false) {
        console.log('\n✅ SUCCESS: Anti-hallucination detection working correctly!');
        console.log('   The tiny test image was correctly identified as potentially invalid input.');
      } else {
        console.log('\n❌ WARNING: Anti-hallucination detection may not be working correctly.');
        console.log('   The tiny test image was not flagged as potentially invalid input.');
      }
    } else {
      console.error('Error processing document:', result);
    }
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
runTest();