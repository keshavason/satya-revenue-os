#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0

import { main } from '../src/cli.js';

main(process.argv.slice(2)).then(
  (code) => { process.exitCode = code; },
  (error) => {
    console.error(JSON.stringify({ status: 'internal-error', error: error.message }));
    process.exitCode = 70;
  },
);
