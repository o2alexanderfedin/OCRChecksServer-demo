// Simple wrapper to run the Mistral API test with correct ES module settings
import { execSync } from 'child_process';

console.log('Running Mistral API direct test...');

try {
  execSync(
    'node --no-deprecation --import \'data:text/javascript,import { register } from "node:module"; import { pathToFileURL } from "node:url"; register("ts-node/esm", pathToFileURL("./"));\' scripts/test-mistral-api.js',
    { stdio: 'inherit' }
  );
} catch (error) {
  console.error('Test execution failed:', error.message);
  process.exit(1);
}