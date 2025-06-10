#!/usr/bin/env node
/**
 * Simple verification script to check that test files can find their images
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Create dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);

console.log('Verifying test files can find their images...');

// Check receipt scanner test
const receiptTestPath = path.join(projectRoot, 'tests/integration/scanner/receipt-scanner.test.ts');
const checkTestPath = path.join(projectRoot, 'tests/integration/scanner/check-scanner.test.ts');
const imagesDir = path.join(projectRoot, 'tests/fixtures/images');

console.log(`\nVerifying receipt scanner test: ${receiptTestPath}`);
if (fs.existsSync(receiptTestPath)) {
  console.log('✅ Receipt scanner test file exists');
  
  // Read and check for TEST_IMAGES
  const receiptTestContent = fs.readFileSync(receiptTestPath, 'utf8');
  if (receiptTestContent.includes('TEST_IMAGES')) {
    console.log('✅ TEST_IMAGES array found in receipt scanner test');
    
    // Extract image names
    const imgNameRegex = /name: ['"]([^'"]+)['"]/g;
    const imgNames = [];
    let match;
    while ((match = imgNameRegex.exec(receiptTestContent)) !== null) {
      imgNames.push(match[1]);
    }
    
    console.log(`Found ${imgNames.length} image references: ${imgNames.join(', ')}`);
    
    // Check each image exists
    for (const imgName of imgNames) {
      const imgPath = path.join(imagesDir, imgName);
      if (fs.existsSync(imgPath)) {
        console.log(`✅ Image found: ${imgName}`);
      } else {
        console.log(`❌ Image NOT found: ${imgName}`);
      }
    }
  } else {
    console.log('❌ TEST_IMAGES array NOT found in receipt scanner test');
  }
} else {
  console.log('❌ Receipt scanner test file NOT found');
}

console.log(`\nVerifying check scanner test: ${checkTestPath}`);
if (fs.existsSync(checkTestPath)) {
  console.log('✅ Check scanner test file exists');
  
  // Read and check for TEST_IMAGES
  const checkTestContent = fs.readFileSync(checkTestPath, 'utf8');
  if (checkTestContent.includes('TEST_IMAGES')) {
    console.log('✅ TEST_IMAGES array found in check scanner test');
    
    // Extract image names
    const imgNameRegex = /name: ['"]([^'"]+)['"]/g;
    const imgNames = [];
    let match;
    while ((match = imgNameRegex.exec(checkTestContent)) !== null) {
      imgNames.push(match[1]);
    }
    
    console.log(`Found ${imgNames.length} image references: ${imgNames.join(', ')}`);
    
    // Check each image exists
    for (const imgName of imgNames) {
      const imgPath = path.join(imagesDir, imgName);
      if (fs.existsSync(imgPath)) {
        console.log(`✅ Image found: ${imgName}`);
      } else {
        console.log(`❌ Image NOT found: ${imgName}`);
      }
    }
  } else {
    console.log('❌ TEST_IMAGES array NOT found in check scanner test');
  }
} else {
  console.log('❌ Check scanner test file NOT found');
}

// List actual images in fixtures directory
console.log('\nListing actual images in fixtures directory:');
try {
  const files = fs.readdirSync(imagesDir);
  for (const file of files) {
    console.log(`- ${file}`);
  }
} catch (err) {
  console.error(`Error reading fixtures directory: ${err.message}`);
}