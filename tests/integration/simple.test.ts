import fs from 'fs/promises';
import path from 'path';
import 'jasmine';

describe('Simple Integration Test', () => {
  it('should run a basic test', async () => {
    // Just a simple test to verify integration tests can run
    expect(true).toBe(true);
  });
  
  it('can access the file system', async () => {
    // Check if we can access the Checks directory
    const checksDir = path.join(process.cwd(), 'Checks');
    const exists = await fs.access(checksDir)
      .then(() => true)
      .catch(() => false);
    
    // This should create a pending test if the directory doesn't exist
    if (!exists) {
      pending('Checks directory not found');
      return;
    }
    
    // If the directory exists, this should pass
    expect(exists).toBe(true);
  });
});