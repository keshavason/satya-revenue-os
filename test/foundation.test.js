// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { validateRecords } from '../tools/check-records.mjs';

test('repository architecture roots exist', () => {
  for (const root of ['bin','src','contracts','skills','adapters','evals','test','examples','docs','evidence','project','openspec']) {
    assert.equal(fs.existsSync(root), true, root);
  }
});

test('operational records contain required evidence fields', () => {
  assert.deepEqual(validateRecords(), []);
});

test('record validator rejects missing fields', () => {
  const errors = validateRecords(() => '# record\nStatus: open\n');
  assert.ok(errors.some((error) => error.includes('Evidence:')));
  assert.ok(errors.some((error) => error.includes('Next verification:')));
});

test('package has no runtime dependencies', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  assert.deepEqual(pkg.dependencies ?? {}, {});
  for (const file of ['evals/corpus.js', 'evals/metadata.json', 'evals/runner.js']) assert.ok(pkg.files.includes(file), `packed CLI requires ${file}`);
  assert.ok(pkg.files.includes('tools/'), 'packed CLI requires release tooling');
});
