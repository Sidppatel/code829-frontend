import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { tokens } from '../packages/shared/src/tokens/tokens';

const outPath = resolve(
  dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')),
  '..',
  'packages/shared/src/tokens/tokens.json',
);

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(tokens, null, 2) + '\n', 'utf8');
console.log(`wrote ${outPath}`);
