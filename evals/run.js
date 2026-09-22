#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
import { resolve } from "node:path";
import metadata from "./metadata.json" with { type: "json" };
import { corpus } from "./corpus.js";
import { runBenchmark, writeReports } from "./runner.js";

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const repetitions = Number(option("--repetitions", "3"));
const output = resolve(option("--output", "evals/results/offline-rc1.json"));

try {
  const report = await runBenchmark({ cases: corpus, metadata, repetitions });
  const paths = await writeReports(report, output);
  process.stdout.write(`${JSON.stringify({ status: "completed", runId: report.runId, caseCount: report.caseCount, paths })}\n`);
} catch (error) {
  process.stderr.write(`${JSON.stringify({ status: "failed", error: error.message })}\n`);
  process.exitCode = 1;
}
