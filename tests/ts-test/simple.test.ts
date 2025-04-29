
import 'jasmine';

describe('Simple TypeScript Test Suite', () => {
  it('should pass a simple test', () => {
    expect(true).toBe(true);
  });
  
  it('should handle TypeScript types', () => {
    const example: string = 'example';
    expect(typeof example).toBe('string');
  });
});
