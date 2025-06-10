#!/usr/bin/env node
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdir } from 'fs/promises';
import { addDevVarsToEnv } from './load-dev-vars.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Run GitFlow branch check unless it's bypassed
if (!process.argv.includes('--bypass-gitflow-check')) {
  try {
    console.log('Running GitFlow branch check...');
    const preTestCheck = spawn('bash', [join(projectRoot, 'scripts', 'pre-test-check.sh')], {
      stdio: 'inherit',
      env: { ...process.env, NONINTERACTIVE: process.env.CI ? 'true' : 'false' }
    });
    
    const exitCode = await new Promise((resolve) => {
      preTestCheck.on('exit', (code) => resolve(code));
    });
    
    if (exitCode !== 0) {
      console.error(`GitFlow branch check failed with code ${exitCode}`);
      console.error('To bypass this check, use --bypass-gitflow-check flag');
      process.exit(exitCode);
    }
    
    console.log('GitFlow branch check passed.');
  } catch (error) {
    console.error('GitFlow branch check error:', error.message);
    console.error('To bypass this check, use --bypass-gitflow-check flag');
    process.exit(1);
  }
}

// Load environment variables from .dev.vars
console.log('Loading environment variables from .dev.vars file...');
await addDevVarsToEnv();

// Find all test files
async function findTestFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await findTestFiles(fullPath));
    } else if (entry.name.endsWith('.test.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

console.log('Running unit tests...');

try {
  const testDir = join(projectRoot, 'tests', 'unit');
  const testFiles = await findTestFiles(testDir);
  
  console.log(`Found ${testFiles.length} test files`);
  
  let totalPassed = 0;
  let totalFailed = 0;
  const failedFiles: string[] = [];
  
  for (const testFile of testFiles) {
    console.log(`\nRunning: ${testFile.replace(projectRoot, '.')}`);
    
    const testProcess = spawn('npx', ['tsx', testFile], {
      stdio: 'pipe',
      env: { ...process.env, NODE_ENV: 'test' },
      cwd: projectRoot
    });
    
    let output = '';
    let errorOutput = '';
    
    testProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    testProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    const exitCode = await new Promise((resolve) => {
      testProcess.on('exit', (code) => resolve(code));
    });
    
    if (exitCode === 0) {
      console.log('✓ PASSED');
      totalPassed++;
    } else {
      console.log('✗ FAILED');
      console.log('STDOUT:', output);
      console.log('STDERR:', errorOutput);
      totalFailed++;
      failedFiles.push(testFile.replace(projectRoot, '.'));
    }
  }
  
  console.log(`\n=======================================`);
  console.log(`Test Results:`);
  console.log(`Total files: ${testFiles.length}`);
  console.log(`Passed: ${totalPassed}`);
  console.log(`Failed: ${totalFailed}`);
  
  if (totalFailed > 0) {
    console.log(`\nFailed files:`);
    failedFiles.forEach(file => console.log(`  - ${file}`));
    
    console.log('\n=====================================================');
    console.log('\x1b[33m⚠️  REMINDER: Follow GitFlow Process For Fixes!\x1b[0m');
    console.log('\x1b[36m1. Create a feature branch BEFORE fixing issues:\x1b[0m');
    console.log('   git flow feature start fix-[descriptive-name]');
    console.log('\x1b[36m2. Make fixes on the feature branch\x1b[0m');
    console.log('\x1b[36m3. Run tests again to verify fixes\x1b[0m');
    console.log('\x1b[36m4. Finish the feature when done:\x1b[0m');
    console.log('   git flow feature finish fix-[descriptive-name]');
    console.log('\nSee .claude/rules/gitflow-testing-workflow.md for details');
    console.log('=====================================================\n');
    
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed!');
  }
  
} catch (error) {
  console.error('Error running tests:', error);
  process.exit(1);
}