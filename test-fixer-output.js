import { YAMLFixer } from './dist/core/yaml-fixer.js';
import * as fs from 'fs';
import * as path from 'path';

const fixer = new YAMLFixer();
const fixturePath = path.join(process.cwd(), 'tests/fixtures/comprehensive-broken.yaml');
const content = fs.readFileSync(fixturePath, 'utf8');

const result = fixer.fix(content, { aggressive: true });

console.log('Fixed Count:', result.fixedCount);
console.log('Errors:', JSON.stringify(result.errors, null, 2));
console.log('Changes:', result.changes.map(c => `${c.type}: ${c.reason}`).join('\n'));
console.log(`\nFixed ${result.fixedCount} issues`);

console.log('\n=== AGGRESSIVE MODE ===');
const aggressiveResult = fixer.fix(content, { aggressive: true });
console.log(aggressiveResult.content);
console.log(`\nFixed ${aggressiveResult.fixedCount} issues`);
