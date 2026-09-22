// SPDX-License-Identifier: Apache-2.0
import fs from 'node:fs';

const expected = ['bin','src','contracts','skills','adapters','evals','test','examples','docs','evidence','project','.github','openspec'];
const missing = expected.filter((item) => !fs.existsSync(item));
if (missing.length) throw new Error(`Missing architecture roots: ${missing.join(', ')}`);
console.log(JSON.stringify({ ok: true, checked: expected.length }));
