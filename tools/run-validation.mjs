// SPDX-License-Identifier: Apache-2.0
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = process.cwd();
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'satya-rc1-validation-'));
const npmCache = path.join(tempRoot, 'npm-cache');
const env = { ...process.env, npm_config_cache: npmCache, NPM_CONFIG_CACHE: npmCache };
const steps = [];

function run(command, cwd = root) {
  const startedAt = new Date().toISOString();
  const start = performance.now();
  const result = spawnSync(command, { cwd, env, encoding: 'utf8', shell: true, timeout: 300_000 });
  const step = { command, cwd, startedAt, completedAt: new Date().toISOString(), durationMs: Math.round((performance.now() - start) * 1000) / 1000, exitCode: result.status, signal: result.signal, stdout: result.stdout ?? '', stderr: result.stderr ?? '', ok: result.status === 0 };
  steps.push(step);
  return step;
}

const commands = [
  'npm install --ignore-scripts', 'npm run doctor', 'npm run format:check', 'npm run lint', 'npm test',
  'npm run eval', 'npm run examples:check', 'npm run docs:check', 'npm run ci:check',
  'npm run licenses:check', 'npm run secrets:check', 'npm run records:check', 'npm run tree:check',
  'npm run manifest', 'npm pack --dry-run --json',
  'D:\\CODEX\\tools\\ai-toolkit\\node\\openspec.cmd validate build-satya-revenue-os-rc1 --strict --json',
  'git remote -v'
];
for (const command of commands) run(command);

const packRoot = path.join(tempRoot, 'pack');
fs.mkdirSync(packRoot, { recursive: true });
const packed = run(`npm pack --json --pack-destination "${packRoot}"`);
let tarball = null;
if (packed.ok) {
  try { tarball = path.join(packRoot, JSON.parse(packed.stdout)[0].filename); }
  catch { steps.push({ command: 'parse npm pack output', cwd: root, startedAt: new Date().toISOString(), completedAt: new Date().toISOString(), durationMs: 0, exitCode: 1, signal: null, stdout: '', stderr: 'npm pack did not return the expected JSON array', ok: false }); }
}
if (tarball) {
  const packageSmoke = path.join(tempRoot, 'package-smoke');
  fs.mkdirSync(packageSmoke, { recursive: true });
  run(`npm install --ignore-scripts "${tarball}"`, packageSmoke);
  const packagedCli = 'node node_modules/@satya/revenue-os/bin/satya-revenue.mjs';
  run(`${packagedCli} help`, packageSmoke);
  run(`${packagedCli} doctor`, packageSmoke);
  run(`${packagedCli} eval smoke-eval.json`, packageSmoke);
}

const cleanRoot = path.join(tempRoot, 'clean-snapshot');
const excluded = new Set(['.git', 'node_modules', 'evals/results']);
fs.cpSync(root, cleanRoot, { recursive: true, filter: (source) => {
  const relative = path.relative(root, source).replaceAll('\\', '/');
  return ![...excluded].some((entry) => relative === entry || relative.startsWith(`${entry}/`));
} });
for (const command of [
  'npm install --ignore-scripts', 'npm run doctor', 'npm run verify',
  'node bin/satya-revenue.mjs skills',
  'node bin/satya-revenue.mjs economics examples/saas/workspace.json',
  'node bin/satya-revenue.mjs plan examples/ecommerce/workspace.json',
  'node bin/satya-revenue.mjs experiment examples/ecommerce/experiment.json'
]) run(command, cleanRoot);

const manifest = JSON.parse(fs.readFileSync(path.join(root, 'evidence/RELEASE-MANIFEST.json'), 'utf8'));
const receipt = {
  schemaVersion: '1.0.0', candidate: '0.1.0-rc.1', candidateDigest: manifest.candidateDigest,
  generatedAt: new Date().toISOString(), reviewer: { type: 'ai', system: 'Codex' },
  environment: { platform: process.platform, arch: process.arch, node: process.version, npm: run('npm --version').stdout.trim() },
  status: steps.every((step) => step.ok) ? 'passed' : 'failed',
  cleanDirectory: cleanRoot, commands: steps,
  limitations: ['Offline validation only.', 'The benchmark is fixture-conformance, not live model or connector evidence.']
};
fs.mkdirSync(path.join(root, 'evidence'), { recursive: true });
fs.writeFileSync(path.join(root, 'evidence/VALIDATION-RECEIPT.json'), `${JSON.stringify(receipt, null, 2)}\n`, 'utf8');
const resolvedTemp = path.resolve(tempRoot); const resolvedBase = path.resolve(os.tmpdir());
if (!resolvedTemp.startsWith(`${resolvedBase}${path.sep}`)) throw new Error('Refusing to remove a non-temporary validation directory');
fs.rmSync(resolvedTemp, { recursive: true, force: true });
console.log(JSON.stringify({ status: receipt.status, candidateDigest: receipt.candidateDigest, commands: steps.length, receipt: 'evidence/VALIDATION-RECEIPT.json' }));
process.exitCode = receipt.status === 'passed' ? 0 : 1;
