// SPDX-License-Identifier: Apache-2.0
import { spawnSync } from 'node:child_process';

const commands = [];
for (const vertical of ['saas','ecommerce','professional-services','local-business','hospitality','industrial-b2b']) {
  commands.push(['plan', `examples/${vertical}/workspace.json`]);
  commands.push(['economics', `examples/${vertical}/workspace.json`]);
}
commands.push(['experiment','examples/ecommerce/experiment.json']);
commands.push(['run','market-research','examples/saas/market-research-input.json']);
commands.push(['continuity','examples/continuity-input.json']);
const failures = [];
for (const args of commands) {
  const result = spawnSync(process.execPath, ['bin/satya-revenue.mjs', ...args], { encoding: 'utf8' });
  if (result.status !== 0) failures.push({ args, status: result.status, stderr: result.stderr.trim() });
  else {
    try { JSON.parse(result.stdout); } catch { failures.push({ args, status: 'invalid-json-output' }); }
  }
}
console.log(JSON.stringify({ ok: failures.length === 0, commands: commands.length, failures }, null, 2));
process.exitCode = failures.length ? 1 : 0;
