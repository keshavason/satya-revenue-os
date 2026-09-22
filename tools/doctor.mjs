// SPDX-License-Identifier: Apache-2.0
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const required = ['bin', 'src', 'contracts', 'skills', 'adapters', 'evals', 'test', 'examples', 'docs', 'evidence', 'project', 'openspec'];
const missing = required.filter((entry) => !fs.existsSync(path.resolve(entry)));
const major = Number(process.versions.node.split('.')[0]);
const checks = {
  node: { actual: process.versions.node, required: '>=22', ok: major >= 22 },
  runtimeDependencies: { actual: Object.keys(JSON.parse(fs.readFileSync('package.json', 'utf8')).dependencies ?? {}).length, required: 0 },
  requiredDirectories: { missing, ok: missing.length === 0 },
  externalExecution: { enabled: false, ok: true },
};
const ok = Object.values(checks).every((check) => check.ok !== false && (check.required !== 0 || check.actual === 0));
console.log(JSON.stringify({ ok, checks }, null, 2));
process.exitCode = ok ? 0 : 1;
