// SPDX-License-Identifier: Apache-2.0
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const exclude = new Set(['.git','node_modules','evals/results','evidence/RELEASE-MANIFEST.json']);
const files = [];
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const relative = path.relative('.', path.join(dir, entry.name)).replaceAll('\\','/');
    if ([...exclude].some((item) => relative === item || relative.startsWith(`${item}/`))) continue;
    if (entry.isDirectory()) walk(relative);
    else {
      const data = fs.readFileSync(relative);
      files.push({ path: relative, bytes: data.length, sha256: crypto.createHash('sha256').update(data).digest('hex') });
    }
  }
};
walk('.');
files.sort((a,b) => a.path.localeCompare(b.path));
const classify = (prefix) => files.filter((file) => file.path.startsWith(prefix)).map((file) => file.path);
const packageMetadata = JSON.parse(fs.readFileSync('package.json','utf8'));
const packageEntries = new Set(['package.json', ...(packageMetadata.files ?? [])].map((entry) => entry.replaceAll('\\','/').replace(/\/$/u, '')));
const payloadFiles = files.filter((file) => [...packageEntries].some((entry) => file.path === entry || file.path.startsWith(`${entry}/`)));
const candidateDigest = `sha256:${crypto.createHash('sha256').update(JSON.stringify({ release: JSON.parse(fs.readFileSync('package.json','utf8')).version, files: payloadFiles })).digest('hex')}`;
const manifest = {
  schemaVersion: '1.0.0',
  release: packageMetadata.version,
  generatedAt: new Date().toISOString(),
  models: [],
  providers: ['deterministic-local'],
  candidateDigest,
  datasets: classify('evals/cases/'),
  skills: classify('skills/').filter((file) => file.endsWith('/skill.json')),
  adapters: classify('adapters/').filter((file) => file.endsWith('/adapter.json')),
  files,
};
fs.mkdirSync('evidence', { recursive: true });
fs.writeFileSync('evidence/RELEASE-MANIFEST.json', `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ ok: true, files: files.length, skills: manifest.skills.length, adapters: manifest.adapters.length }));
