// SPDX-License-Identifier: Apache-2.0
import fs from 'node:fs';
import path from 'node:path';

const docs = ['README.md','CONTRIBUTING.md','SECURITY.md','docs/QUICKSTART.md','docs/ARCHITECTURE.md','docs/SKILLS.md','docs/ADAPTERS.md','docs/TESTING.md','docs/SECURITY-MODEL.md','docs/THREAT-MODEL.md','docs/GOVERNANCE.md','docs/BRANCH-PROTECTION.md','docs/VERSIONING.md','docs/INTEGRATIONS.md'];
const errors = [];
for (const file of docs) {
  if (!fs.existsSync(file)) { errors.push(`missing ${file}`); continue; }
  const text = fs.readFileSync(file, 'utf8');
  for (const match of text.matchAll(/\[[^\]]+\]\((?!https?:|#)([^)]+)\)/g)) {
    const target = match[1].split('#')[0];
    if (target.includes('<repository-url>')) continue;
    if (!fs.existsSync(path.resolve(path.dirname(file), target))) errors.push(`${file}: broken link ${target}`);
  }
}
console.log(JSON.stringify({ ok: errors.length === 0, checked: docs.length, errors }, null, 2));
process.exitCode = errors.length ? 1 : 0;
