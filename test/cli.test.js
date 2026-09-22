// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const cli = (...args) => spawnSync(process.execPath, ['bin/satya-revenue.mjs', ...args], { encoding: 'utf8' });

test('CLI documents and returns stable exit codes', () => {
  assert.equal(cli('--help').status, 0);
  assert.match(cli('--help').stdout, /Exit codes: 0 success; 2 invalid input; 3 safely blocked/);
  assert.equal(cli('unknown').status, 2);
  assert.equal(cli('economics').status, 2);
});

test('CLI validates repository and lists skills', () => {
  const validated = cli('validate');
  assert.equal(validated.status, 0, validated.stderr);
  assert.equal(JSON.parse(validated.stdout).skills.length, 11);
  const skills = JSON.parse(cli('skills').stdout);
  assert.equal(skills.skills.every((skill) => skill.effects.includes('none')), true);
});

test('CLI safely blocks insufficient skill input', () => {
  const result = cli('run','market-research','package.json');
  assert.equal(result.status, 3);
  assert.equal(JSON.parse(result.stdout).status, 'abstained');
});
