#!/usr/bin/env node
import Jasmine from 'jasmine';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process';
import { loadDevVarsToEnv } from './load-dev-vars.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Run GitFlow branch check unless it's bypassed
if (!process.argv.includes('--bypass-gitflow-check')) {
  try {
    console.log('Running GitFlow branch check...');
    // Run the pre-test-check.sh script synchronously
    const preTestCheck = spawn('bash', [join(projectRoot, 'scripts', 'pre-test-check.sh')], {
      stdio: 'inherit',
      env: { ...process.env, NONINTERACTIVE: process.env.CI ? 'true' : 'false' }
    });
    
    // Wait for the pre-test check to complete
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
loadDevVarsToEnv();

console.log('Running unit tests...');
const jasmine = new Jasmine();
jasmine.loadConfig({
  spec_dir: 'tests',
  spec_files: [
    'unit/**/*.test.ts'
  ],
  helpers: [],
  stopSpecOnExpectationFailure: false,
  random: false
});

// Add reporter for detailed output
jasmine.addReporter({
  jasmineStarted: function(suiteInfo) {
    console.log(`Running ${suiteInfo.totalSpecsDefined} tests`);
  },
  suiteStarted: function(result) {
    console.log(`Suite started: ${result.description}`);
  },
  specStarted: function(result) {
    console.log(`Test started: ${result.description}`);
  },
  specDone: function(result) {
    console.log(`Test finished: ${result.description} - ${result.status}`);
    if (result.status === 'failed') {
      console.log(`Failures: ${JSON.stringify(result.failedExpectations, null, 2)}`);
    }
  },
  jasmineDone: function(result) {
    console.log(`Tests finished with status: ${result.overallStatus}`);
    
    // Show GitFlow reminder if tests failed
    if (result.overallStatus === 'failed') {
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
    }
  }
});

// Add proper error handling
try {
  jasmine.execute().catch(error => {
    console.error('Error executing tests:', error);
    process.exit(1);
  });
} catch (error) {
  console.error('Error executing tests:', error);
  process.exit(1);
}