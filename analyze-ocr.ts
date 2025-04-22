import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function analyzeOCRResults() {
  try {
    // Read the OCR results file
    const resultsPath = join(__dirname, 'ocr-results.json');
    const results = JSON.parse(readFileSync(resultsPath, 'utf-8'));

    // Create a markdown file with all extracted text
    let markdownContent = '# OCR Results\n\n';
    
    results.forEach(({ file, result }: { file: string; result: any }) => {
      markdownContent += `## ${file}\n\n`;
      
      if (result.pages && result.pages.length > 0) {
        result.pages.forEach((page: any) => {
          if (page.markdown) {
            // Remove image references and clean up the markdown
            const cleanMarkdown = page.markdown
              .replace(/!\[.*?\]\(.*?\)/g, '') // Remove image references
              .replace(/\$\$/g, '$') // Fix LaTeX-style math
              .replace(/\\\$/g, '$') // Fix escaped dollar signs
              .trim();
            
            markdownContent += cleanMarkdown + '\n\n';
          }
        });
      } else {
        markdownContent += 'No text extracted from this image.\n\n';
      }
      
      markdownContent += '---\n\n';
    });

    // Save the concatenated markdown
    const markdownPath = join(__dirname, 'ocr-results.md');
    writeFileSync(markdownPath, markdownContent);
    console.log(`Markdown content saved to: ${markdownPath}`);

    // Print summary
    console.log('\nAnalysis Summary:');
    results.forEach(({ file, result }: { file: string; result: any }) => {
      const pageCount = result.pages?.length || 0;
      const hasText = result.pages?.some((page: any) => page.markdown && page.markdown.trim() !== '![img-0.jpeg](img-0.jpeg)');
      console.log(`\nFile: ${file}`);
      console.log(`- Pages: ${pageCount}`);
      console.log(`- Contains text: ${hasText ? 'Yes' : 'No'}`);
      if (hasText) {
        const textLength = result.pages
          .map((page: any) => page.markdown?.length || 0)
          .reduce((a: number, b: number) => a + b, 0);
        console.log(`- Total text length: ${textLength} characters`);
      }
    });

  } catch (error) {
    if (error instanceof Error) {
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
    } else {
      console.error('Unknown error:', error);
    }
  }
}

analyzeOCRResults(); 