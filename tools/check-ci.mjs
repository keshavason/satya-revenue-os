// SPDX-License-Identifier: Apache-2.0
import fs from 'node:fs';

const file = '.github/workflows/ci.yml';
const text = fs.readFileSync(file, 'utf8');
const errors = [];
if (!/^permissions:\s*\n\s+contents: read/m.test(text)) errors.push('CI must default to contents: read');
for (const match of text.matchAll(/uses:\s*([^\s#]+)/g)) {
  const ref = match[1].split('@')[1] ?? '';
  if (!/^[0-9a-f]{40}$/.test(ref)) errors.push(`mutable action reference: ${match[1]}`);
}
for (const command of ['npm ci --ignore-scripts','npm run verify']) if (!text.includes(command)) errors.push(`CI missing ${command}`);
console.log(JSON.stringify({ ok: errors.length === 0, errors }, null, 2));
process.exitCode = errors.length ? 1 : 0;
