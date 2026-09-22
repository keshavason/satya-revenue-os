// SPDX-License-Identifier: Apache-2.0
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const files = [];
for (const root of ['bin','src','skills','evals','tools','test']) {
  if (!fs.existsSync(root)) continue;
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir,{withFileTypes:true})) {
      const file = path.join(dir,entry.name);
      if (entry.isDirectory()) stack.push(file);
      else if (/\.(?:js|mjs)$/.test(entry.name)) files.push(file);
    }
  }
}
const failures = [];
for (const file of files.sort()) {
  const result = spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  if (result.status !== 0) failures.push({ file, error: result.stderr.trim() });
}
console.log(JSON.stringify({ ok: failures.length === 0, checked: files.length, failures }, null, 2));
process.exitCode = failures.length ? 1 : 0;
