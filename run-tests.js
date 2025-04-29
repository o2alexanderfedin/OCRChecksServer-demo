import Jasmine from 'jasmine';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const jasmine = new Jasmine();
jasmine.loadConfig({
  spec_dir: 'src',
  spec_files: [
    '**/*.test.ts',
    '**/*.test.f.ts'
  ],
  helpers: [
    'helpers/**/*.ts'
  ],
  stopSpecOnExpectationFailure: false,
  random: false
});

jasmine.execute();