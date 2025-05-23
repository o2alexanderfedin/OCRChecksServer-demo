// Simple Mistral API test
import { Mistral } from '@mistralai/mistralai';

// Hardcode the API key for testing
const API_KEY = 'fake_mistral_api_key_for_demo_purposes_only';

console.log(`Testing API key: ${API_KEY.substring(0, 4)}...`);

const client = new Mistral({
  apiKey: API_KEY
});

async function test() {
  try {
    const response = await client.chat.complete({
      model: 'mistral-tiny',
      messages: [
        { role: 'user', content: 'Hello, are you working?' }
      ]
    });
    
    console.log('SUCCESS - API key is valid!');
    console.log(response.choices[0].message.content);
  } catch (error) {
    console.error('ERROR - API key is invalid:');
    console.error(error.message);
  }
}

test();