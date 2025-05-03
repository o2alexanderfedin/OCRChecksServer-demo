// A simple script to test the Mistral API directly with image inputs
// This version uses direct HTTPS requests to have more control over the connection
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

// Get API key from environment variable
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

if (!MISTRAL_API_KEY) {
  console.error('Error: Mistral API key not found in environment variables. Run with MISTRAL_API_KEY=xxx node direct-mistral-test.js');
  process.exit(1);
}

// Function to convert ArrayBuffer to base64 string
function arrayBufferToBase64(buffer) {
  return Buffer.from(buffer).toString('base64');
}

// Create a custom HTTPS agent with longer timeout
const httpsAgent = new https.Agent({
  keepAlive: true,
  timeout: 30000, // 30 seconds
  rejectUnauthorized: true // Verify SSL certificates
});

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testMistralAPI() {
  try {
    console.log('Reading test image...');
    const imagePath = path.join(__dirname, '..', 'small-test.jpg');
    const imageBuffer = fs.readFileSync(imagePath);
    
    console.log('Converting to base64...');
    const base64 = arrayBufferToBase64(imageBuffer);
    const dataUrl = `data:image/jpeg;base64,${base64}`;
    
    console.log('Data URL created, length:', dataUrl.length);
    console.log('Data URL prefix:', dataUrl.substring(0, 50), '...');
    
    console.log('Calling Mistral OCR API directly with fetch...');
    const startTime = Date.now();
    
    // Define the request options
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: 'mistral-ocr-latest',
        document: {
          type: 'image_url',
          imageUrl: dataUrl
        }
      }),
      agent: httpsAgent
    };
    
    console.log('Sending direct HTTPS request to api.mistral.ai...');
    const req = https.request({
      hostname: 'api.mistral.ai',
      port: 443,
      path: '/v1/ocr/process',
      method: 'POST',
      headers: options.headers,
      agent: httpsAgent
    }, (res) => {
      console.log(`Response status: ${res.statusCode} ${res.statusMessage}`);
      console.log('Response headers:', res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const duration = Date.now() - startTime;
        console.log(`Request completed in ${duration}ms`);
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const response = JSON.parse(data);
            console.log('Success! Response excerpt:', JSON.stringify(response).substring(0, 500), '...');
          } catch (e) {
            console.error('Error parsing JSON response:', e.message);
            console.log('Raw response:', data.substring(0, 500), '...');
          }
        } else {
          console.error('Error response:', data.substring(0, 500), '...');
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Request error:', error.message);
      console.error('Error details:', error);
    });
    
    req.write(options.body);
    req.end();
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testMistralAPI();