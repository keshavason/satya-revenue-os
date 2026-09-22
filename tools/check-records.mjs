// SPDX-License-Identifier: Apache-2.0
import fs from 'node:fs';

const rules = {
  'project/WORKLOG.md': ['Status:', 'Evidence:', 'Next verification:'],
  'project/DECISIONS.md': ['Status:', 'Evidence:', 'Owner:', 'Next verification:'],
  'project/RISKS.md': ['Status:', 'Evidence:', 'Owner:', 'Next verification:'],
  'project/BACKLOG.md': ['Status:', 'Evidence:', 'Owner:', 'Next verification:'],
};

export function validateRecords(read = (file) => fs.readFileSync(file, 'utf8')) {
  const errors = [];
  for (const [file, fields] of Object.entries(rules)) {
    const text = read(file);
    for (const field of fields) if (!text.includes(field)) errors.push(`${file}: missing ${field}`);
  }
  return errors;
}

if (process.argv[1]?.endsWith('check-records.mjs')) {
  const errors = validateRecords();
  console.log(JSON.stringify({ ok: errors.length === 0, errors }, null, 2));
  process.exitCode = errors.length ? 1 : 0;
}
