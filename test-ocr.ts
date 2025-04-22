import fs from 'fs/promises';
import path from 'path';

interface OCRResult {
  check_number: string | null;
  amount: string | null;
  date: string | null;
  payee: string | null;
  payer: string | null;
  bank_name: string | null;
  routing_number: string | null;
  account_number: string | null;
  memo: string | null;
}

async function processImage(imagePath: string): Promise<OCRResult> {
  try {
    const imageBuffer = await fs.readFile(imagePath);
    console.log(`Processing image ${path.basename(imagePath)} (${imageBuffer.length} bytes)`);

    const response = await fetch('http://localhost:8787', {
      method: 'POST',
      headers: {
        'Content-Type': 'image/jpeg'
      },
      body: imageBuffer
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to process image: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('OCR Result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
}

async function testOCR() {
  try {
    const results: Record<string, OCRResult> = {};
    const checksDir = path.join(process.cwd(), 'Checks');
    const files = await fs.readdir(checksDir);

    for (const file of files) {
      if (file.startsWith('telegram') && (file.endsWith('.jpg') || file.endsWith('.jpeg'))) {
        const imagePath = path.join(checksDir, file);
        try {
          results[file] = await processImage(imagePath);
        } catch (error) {
          console.error(`Failed to process ${file}:`, error);
          results[file] = {
            check_number: null,
            amount: null,
            date: null,
            payee: null,
            payer: null,
            bank_name: null,
            routing_number: null,
            account_number: null,
            memo: null
          };
        }
      }
    }

    await fs.writeFile('ocr-results.json', JSON.stringify(results, null, 2));
    console.log('Results saved to ocr-results.json');
  } catch (error) {
    console.error('Error in testOCR:', error);
    process.exit(1);
  }
}

testOCR().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 