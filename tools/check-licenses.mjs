// SPDX-License-Identifier: Apache-2.0
import fs from 'node:fs';
import path from 'node:path';

const errors = [];
for (const file of ['LICENSE','NOTICE','THIRD_PARTY_NOTICES.md','REUSE.toml','evidence/SOURCES.md']) if (!fs.existsSync(file)) errors.push(`missing ${file}`);
const packageLicense = JSON.parse(fs.readFileSync('package.json','utf8')).license;
if (packageLicense !== 'Apache-2.0') errors.push('package.json license mismatch');
const roots = ['src','bin','tools','test','evals'];
let checked = 0;
for (const root of roots) {
  if (!fs.existsSync(root)) continue;
  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current,{withFileTypes:true})) {
      const file = path.join(current,entry.name);
      if (entry.isDirectory()) stack.push(file);
      else if (/\.(?:js|mjs)$/.test(entry.name)) {
        checked += 1;
        if (!fs.readFileSync(file,'utf8').includes('SPDX-License-Identifier: Apache-2.0')) errors.push(`${file}: missing SPDX header`);
      }
    }
  }
}
console.log(JSON.stringify({ ok: errors.length === 0, checked, errors }, null, 2));
process.exitCode = errors.length ? 1 : 0;
