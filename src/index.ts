import { Hono } from 'hono';
import { cors } from 'hono/cors';

interface Env {
  MISTRAL_API_KEY: string;
}

const app = new Hono<{ Bindings: Env }>();
app.use('*', cors());

interface MistralResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
}

const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let result = '';
  let i = 0;
  
  while (i < bytes.length) {
    const byte1 = bytes[i++];
    const byte2 = i < bytes.length ? bytes[i++] : 0;
    const byte3 = i < bytes.length ? bytes[i++] : 0;
    
    const char1 = byte1 >> 2;
    const char2 = ((byte1 & 3) << 4) | (byte2 >> 4);
    const char3 = ((byte2 & 15) << 2) | (byte3 >> 6);
    const char4 = byte3 & 63;
    
    result += base64Chars[char1] + base64Chars[char2];
    result += i - 1 < bytes.length ? base64Chars[char3] : '=';
    result += i < bytes.length ? base64Chars[char4] : '=';
  }
  
  return result;
}

app.post('/', async (c) => {
  try {
    const contentType = c.req.header('Content-Type');
    if (!contentType?.startsWith('image/')) {
      return new Response(JSON.stringify({ error: 'Invalid content type. Expected image/*' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const imageBuffer = await c.req.arrayBuffer();
    const base64Image = arrayBufferToBase64(imageBuffer);

    const prompt = `Please analyze this check image and extract the following information in JSON format:
- check_number: The check number
- amount: The amount on the check
- date: The date on the check
- payee: Who the check is made out to
- payer: Who wrote/signed the check
- bank_name: The name of the bank
- routing_number: The routing number
- account_number: The account number
- memo: Any memo or note on the check`;

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${c.env.MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: 'mistral-medium',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Mistral API error:', error);
      return new Response(JSON.stringify({ error: `Mistral API error: ${error}` }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result: MistralResponse = await response.json();
    if (!result.choices?.[0]?.message?.content) {
      return new Response(JSON.stringify({ error: 'No content in response' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      const jsonContent = JSON.parse(result.choices[0].message.content);
      return new Response(JSON.stringify(jsonContent), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e) {
      console.error('Failed to parse JSON from response:', result.choices[0].message.content);
      return new Response(JSON.stringify({ 
        error: 'Failed to parse JSON from response', 
        raw: result.choices[0].message.content 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

export default app; 