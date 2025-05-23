// Test script for anti-hallucination detection with tiny-test.jpg (CommonJS version)
// To run: node test-hallucination.cjs

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to read image and return base64
function imageToBase64(filePath) {
  const imageBuffer = fs.readFileSync(filePath);
  return imageBuffer.toString('base64');
}

// Function to make a direct request to the Mistral API
function callMistralApi(base64Image) {
  // Read API key from .dev.vars
  const devVars = fs.readFileSync('.dev.vars', 'utf8');
  const lines = devVars.split('\n');
  let apiKey = null;
  for (const line of lines) {
    if (line.startsWith('MISTRAL_API_KEY=')) {
      apiKey = line.substring('MISTRAL_API_KEY='.length);
      break;
    }
  }
  
  if (!apiKey) {
    throw new Error('MISTRAL_API_KEY not found in .dev.vars');
  }
  
  // Create data URL
  const dataUrl = `data:image/jpeg;base64,${base64Image}`;
  
  // Call Mistral API using curl (more reliable than node https for this case)
  const curlCmd = `curl -s -X POST https://api.mistral.ai/v1/ocr/process \\
    -H "Content-Type: application/json" \\
    -H "Authorization: Bearer ${apiKey}" \\
    -d '{"model":"mistral-ocr-2505-completion", "document":{"type":"image_url","imageUrl":"${dataUrl}"}}'`;
  
  try {
    const output = execSync(curlCmd, { maxBuffer: 10 * 1024 * 1024 }); // 10MB max buffer
    return JSON.parse(output.toString());
  } catch (error) {
    console.error('Error calling Mistral API:', error.message);
    if (error.stdout) {
      console.error('Response:', error.stdout.toString());
    }
    throw error;
  }
}

// Function to call our JSON extraction endpoint
function extractJson(ocrText) {
  // Create JSON with the OCR text
  const requestData = {
    "markdown": ocrText,
    "type": "check"
  };
  
  // Write to temporary file to avoid shell escaping issues
  const tmpFile = path.join(__dirname, 'tmp-request.json');
  fs.writeFileSync(tmpFile, JSON.stringify(requestData));
  
  // Call using curl
  const curlCmd = `curl -s -X POST http://localhost:8787/extract-json \\
    -H "Content-Type: application/json" \\
    -H "X-API-KEY: test-api-key" \\
    -d @${tmpFile}`;
  
  try {
    const output = execSync(curlCmd);
    
    // Clean up temp file
    fs.unlinkSync(tmpFile);
    
    return JSON.parse(output.toString());
  } catch (error) {
    console.error('Error calling extraction endpoint:', error.message);
    // Leave the temp file for debugging if there's an error
    throw error;
  }
}

async function runTest() {
  console.log('Testing anti-hallucination detection with tiny-test.jpg');
  
  // Path to test image
  const imagePath = path.join(__dirname, 'tiny-test.jpg');
  console.log('Image path:', imagePath);
  
  // Check if the file exists
  if (!fs.existsSync(imagePath)) {
    console.error(`Test image not found at path: ${imagePath}`);
    process.exit(1);
  }
  
  try {
    // Convert image to base64
    console.log('Converting image to base64...');
    const base64Image = imageToBase64(imagePath);
    
    // Call Mistral OCR API directly
    console.log('Calling Mistral OCR API...');
    const ocrResult = callMistralApi(base64Image);
    console.log('OCR successful. Extracted text length:', ocrResult.pages[0].markdown.length);
    
    // Start local server if not already running
    console.log('Starting local server in background...');
    const serverProcess = execSync('npm run start-local > server.log 2>&1 &', { stdio: 'inherit' });
    
    // Wait for server to start
    console.log('Waiting for server to start...');
    execSync('sleep 5');
    
    // Call extraction endpoint
    console.log('Calling JSON extraction endpoint...');
    const extractionResult = extractJson(ocrResult.pages[0].markdown);
    console.log('Extraction result:', JSON.stringify(extractionResult, null, 2));
    
    // Check for hallucination detection
    console.log('\n=== ANTI-HALLUCINATION TEST RESULTS ===');
    console.log('isValidInput flag present:', extractionResult.json.isValidInput !== undefined);
    console.log('isValidInput value:', extractionResult.json.isValidInput);
    console.log('Confidence score:', extractionResult.json.confidence);
    
    console.log('\nCheck data extracted:');
    console.log('- checkNumber:', extractionResult.json.checkNumber);
    console.log('- payee:', extractionResult.json.payee);
    console.log('- date:', extractionResult.json.date);
    console.log('- amount:', extractionResult.json.amount);
    
    // Test success criteria
    if (extractionResult.json.isValidInput === false) {
      console.log('\n✅ SUCCESS: Anti-hallucination detection working correctly!');
      console.log('   The tiny test image was correctly identified as potentially invalid input.');
    } else {
      console.log('\n❌ WARNING: Anti-hallucination detection may not be working correctly.');
      console.log('   The tiny test image was not flagged as potentially invalid input.');
    }
    
    // Kill the server process
    console.log('Stopping server...');
    execSync('pkill -f "wrangler dev" || true');
    
  } catch (error) {
    console.error('Error during test:', error);
    // Try to stop the server if it was started
    try {
      execSync('pkill -f "wrangler dev" || true');
    } catch (e) {
      // Ignore errors when stopping the server
    }
  }
}

// Run the test
runTest();