// Script to convert HEIC to JPEG
const fs = require('fs');
const path = require('path');
const heicConvert = require('heic-convert');

async function convertHEICtoJPEG(inputPath, outputPath) {
  try {
    console.log(`Converting ${inputPath} to ${outputPath}...`);
    
    // Read HEIC file
    const inputBuffer = fs.readFileSync(inputPath);
    
    // Convert to JPEG
    const outputBuffer = await heicConvert({
      buffer: inputBuffer,
      format: 'JPEG',
      quality: 0.9
    });
    
    // Write output JPEG
    fs.writeFileSync(outputPath, outputBuffer);
    
    console.log(`Successfully converted ${inputPath} to ${outputPath}`);
    console.log(`Output file size: ${outputBuffer.length} bytes`);
    
    return true;
  } catch (error) {
    console.error('Error converting HEIC to JPEG:', error);
    return false;
  }
}

// Get input/output paths from command line arguments
const inputPath = process.argv[2];
const outputPath = process.argv[3] || inputPath.replace('.HEIC', '.jpg');

if (!inputPath) {
  console.error('Usage: node convert-heic.js <input-heic-path> [output-jpg-path]');
  process.exit(1);
}

// Run conversion
convertHEICtoJPEG(inputPath, outputPath).then(success => {
  process.exit(success ? 0 : 1);
});