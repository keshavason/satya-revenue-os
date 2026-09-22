// SPDX-License-Identifier: Apache-2.0
import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const manifestExclusions = new Set(['.git','node_modules','evals/results','evidence/RELEASE-MANIFEST.json']);

function currentInventory(directory = '.') {
  const files = [];
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const relative = path.relative(directory, path.join(current, entry.name)).replaceAll('\\','/');
      if ([...manifestExclusions].some((excluded) => relative === excluded || relative.startsWith(`${excluded}/`))) continue;
      if (entry.isDirectory()) walk(path.join(current, entry.name));
      else files.push(relative);
    }
  };
  walk(directory);
  return files.sort();
}

export function assessRelease() {
  const checks = [];
  const add = (id, ok, evidence) => checks.push({ id, ok, evidence });
  const tasks = fs.readFileSync('openspec/changes/build-satya-revenue-os-rc1/tasks.md','utf8');
  add('tasks-complete', !tasks.includes('- [ ]'), `${(tasks.match(/- \[x\]/g) ?? []).length}/41`);
  add('manifest-present', fs.existsSync('evidence/RELEASE-MANIFEST.json'), 'evidence/RELEASE-MANIFEST.json');
  add('security-review-present', fs.existsSync('evidence/SECURITY-REVIEW.md'), 'evidence/SECURITY-REVIEW.md');
  add('satya-review-present', fs.existsSync('evidence/SATYA-REVIEW.md'), 'evidence/SATYA-REVIEW.md');
  add('validation-receipt-present', fs.existsSync('evidence/VALIDATION-RECEIPT.json'), 'evidence/VALIDATION-RECEIPT.json');
  let candidateDigest = null;
  try {
    const manifest = JSON.parse(fs.readFileSync('evidence/RELEASE-MANIFEST.json', 'utf8'));
    candidateDigest = manifest.candidateDigest;
    const packageMetadata = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const packageEntries = new Set(['package.json', ...(packageMetadata.files ?? [])].map((entry) => entry.replaceAll('\\','/').replace(/\/$/u, '')));
    const payloadFiles = manifest.files.filter((file) => [...packageEntries].some((entry) => file.path === entry || file.path.startsWith(`${entry}/`)));
    const expected = `sha256:${crypto.createHash('sha256').update(JSON.stringify({ release: manifest.release, files: payloadFiles })).digest('hex')}`;
    add('manifest-digest-valid', candidateDigest === expected, candidateDigest ?? 'missing');
    add('manifest-files-current', manifest.files.every((file) => fs.existsSync(file.path) && crypto.createHash('sha256').update(fs.readFileSync(file.path)).digest('hex') === file.sha256), `${manifest.files.length} entries`);
    const manifestedPaths = manifest.files.map((file) => file.path).sort();
    const inventory = currentInventory();
    add('manifest-inventory-complete', JSON.stringify(manifestedPaths) === JSON.stringify(inventory), `${manifestedPaths.length}/${inventory.length} entries`);
  } catch (error) { add('manifest-valid-json', false, error.message); }
  for (const file of ['evidence/SECURITY-REVIEW.md','evidence/SATYA-REVIEW.md']) {
    const review = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
    add(`${file}-bound`, Boolean(candidateDigest) && review.includes(candidateDigest), candidateDigest ?? 'missing digest');
    const requiredReviewFields = ['Reviewer: Codex (AI)', 'Scope:', 'Limitations:', 'Open P0:', 'Open P1:', 'Human approval: not provided'];
    add(`${file}-structured`, requiredReviewFields.every((field) => review.includes(field)), requiredReviewFields.join(', '));
  }
  try {
    const receipt = JSON.parse(fs.readFileSync('evidence/VALIDATION-RECEIPT.json', 'utf8'));
    const commands = Array.isArray(receipt.commands) ? receipt.commands : [];
    const requiredCommands = ['npm test', 'npm run eval', 'npm pack --dry-run --json', 'openspec.cmd validate', 'git remote -v', 'npm run verify', 'satya-revenue.mjs eval smoke-eval.json'];
    add('validation-receipt-pass', receipt.status === 'passed' && receipt.candidateDigest === candidateDigest && commands.length > 0 && commands.every((command) => command.ok === true), `${receipt.status}:${receipt.candidateDigest}:${commands.length}`);
    add('validation-receipt-coverage', requiredCommands.every((required) => commands.some((command) => command.command.includes(required))), requiredCommands.join(', '));
  } catch (error) { add('validation-receipt-valid-json', false, error.message); }
  add('canonical-license', fs.readFileSync('LICENSE','utf8').includes('END OF TERMS AND CONDITIONS'), 'Apache-2.0 canonical terms marker');
  const risks = fs.readFileSync('project/RISKS.md','utf8');
  add('zero-open-p0', !/Status: open P0/i.test(risks), 'project/RISKS.md');
  let remotes = '';
  try { remotes = execFileSync('git',['remote'],{encoding:'utf8'}).trim(); } catch { remotes = 'git-error'; }
  add('no-publication-remote', remotes === '', remotes || 'none');
  const technicalDecision = checks.every((check) => check.ok) ? 'GO' : 'NO-GO';
  return { schemaVersion: '1.0.0', candidate: '0.1.0-rc.1', technicalDecision, publicationAuthorized: false, checks };
}

if (process.argv[1]?.endsWith('release-check.mjs')) {
  const result = assessRelease();
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.technicalDecision === 'GO' ? 0 : 1;
}
