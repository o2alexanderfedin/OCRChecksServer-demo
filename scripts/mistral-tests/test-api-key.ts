// A simple script to test if the Mistral API key is valid
import { Mistral } from '@mistralai/mistralai.js';

// Get the API key from environment variable
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

if (!MISTRAL_API_KEY) {
  console.error('Error: Mistral API key not found in environment variables');
  process.exit(1);
}

// Create Mistral client
const client = new Mistral({ apiKey: MISTRAL_API_KEY });

// Function to test the Mistral API key with a simple text generation
async function testMistralApiKey() {
  console.log(`Testing Mistral API key: ${MISTRAL_API_KEY.substring(0, 4)}...${MISTRAL_API_KEY.substring(MISTRAL_API_KEY.length - 4)}`);
  
  try {
    // Send a simple chat completion request
    const response = await client.chat.complete({
      model: "mistral-small-latest",
      messages: [
        { role: "user", content: "Hello, are you working properly?" }
      ]
    });
    
    console.log('Success! API key is valid.');
    console.log('Response:');
    console.log(response.choices[0].message.content);
    return true;
  } catch (error) {
    console.error('Error: API key is invalid or there is an issue with the Mistral API');
    console.error(`Error message: ${error.message}`);
    
    if (error.response) {
      console.error('Response details:', JSON.stringify(error.response, null, 2));
    }
    return false;
  }
}

// Run the test
testMistralApiKey().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});