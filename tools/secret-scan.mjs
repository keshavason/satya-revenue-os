// SPDX-License-Identifier: Apache-2.0
import fs from 'node:fs';
import path from 'node:path';

const excluded = ['.git','node_modules','evals/results'];
const patterns = [
  ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['aws-access-key', /\bAKIA[0-9A-Z]{16}\b/],
  ['github-token', /\bgh[oprsu]_[A-Za-z0-9_]{30,}\b/],
  ['openai-key', /\bsk-[A-Za-z0-9_-]{20,}\b/],
  ['generic-secret-assignment', /\b(?:api[_-]?key|client[_-]?secret|password)\s*[:=]\s*["'][^"'\s]{12,}["']/i],
];
const findings = [];
let checked = 0;
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir,{withFileTypes:true})) {
    const file = path.relative('.',path.join(dir,entry.name)).replaceAll('\\','/');
    if (excluded.some((item) => file === item || file.startsWith(`${item}/`))) continue;
    if (entry.isDirectory()) walk(file);
    else {
      const bytes = fs.readFileSync(file);
      if (bytes.includes(0)) continue;
      checked += 1;
      const text = bytes.toString('utf8');
      for (const [id,pattern] of patterns) if (pattern.test(text)) findings.push({ id, file });
    }
  }
};
walk('.');
console.log(JSON.stringify({ ok: findings.length === 0, checked, findings }, null, 2));
process.exitCode = findings.length ? 1 : 0;
