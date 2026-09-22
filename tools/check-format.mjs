// SPDX-License-Identifier: Apache-2.0
import fs from 'node:fs';
import path from 'node:path';

const roots = ['bin', 'src', 'tools', 'test', 'evals'];
const files = [];
for (const root of roots) {
  if (!fs.existsSync(root)) continue;
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const target = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(target);
      else if (/\.(?:js|mjs|json|md)$/.test(entry.name)) files.push(target);
    }
  };
  walk(root);
}
const errors = [];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  if (!text.endsWith('\n')) errors.push(`${file}: missing final newline`);
  if (/[^\r\n\t ] +$/m.test(text)) errors.push(`${file}: trailing whitespace`);
}
console.log(JSON.stringify({ ok: errors.length === 0, checked: files.length, errors }, null, 2));
process.exitCode = errors.length ? 1 : 0;
