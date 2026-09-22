// SPDX-License-Identifier: Apache-2.0
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { planGoal, PlanningAbstention } from './core/planner.js';
import { calculateUnitEconomics } from './domain/economics.js';
import { validateExperimentPlan } from './domain/experiments.js';
import { composeCommercialPlan, loadAdapter, validateAdapterFixture } from './domain/adapters.js';
import { SkillRegistry } from './runtime/skill-registry.js';
import { executeSkill } from '../skills/runtime.js';
import { corpus } from '../evals/corpus.js';
import { runBenchmark, writeReports } from '../evals/runner.js';

const EXIT = Object.freeze({ ok: 0, invalid: 2, blocked: 3, internal: 70 });
const PACKAGE_ROOT = fileURLToPath(new URL('../', import.meta.url));
const HELP = `SATYA Revenue OS 0.1.0-rc.1

Usage: satya-revenue <command> [arguments]

Commands:
  doctor                         Check local prerequisites and boundaries
  validate                       Validate skills and vertical adapters
  skills                         List registered skills and declared effects
  plan <workspace-or-plan.json>  Build a vertical or skill-dependency plan
  run <skill-id> <input.json>    Run one deterministic, effect-free skill
  economics <input.json>         Calculate typed unit economics
  experiment <plan.json>         Validate an experiment contract
  continuity <input.json>        Run selective continuity preflight
  eval [output.json]             Run offline scenario and adversarial evals
  release-check                  Assess the exact local RC without publishing

Exit codes: 0 success; 2 invalid input; 3 safely blocked/abstained; 70 internal error.
All RC1 effects are dry-run only; this CLI contains no live connector.`;

async function readJson(file) {
  if (!file) throw Object.assign(new Error('A JSON input path is required'), { code: 'INPUT_REQUIRED' });
  try { return JSON.parse(await fs.readFile(file, 'utf8')); }
  catch (error) { throw Object.assign(new Error(`Cannot read JSON input ${file}: ${error.message}`), { code: 'INVALID_JSON' }); }
}

function print(value) { process.stdout.write(`${JSON.stringify(value, null, 2)}\n`); }

async function registry() {
  return new SkillRegistry().discover(path.join(PACKAGE_ROOT, 'skills'));
}

async function validateRepository() {
  const registered = await registry();
  const adapterRoot = path.join(PACKAGE_ROOT, 'adapters');
  const entries = await fs.readdir(adapterRoot, { withFileTypes: true });
  const adapters = [];
  for (const entry of entries.filter((item) => item.isDirectory()).sort((a,b) => a.name.localeCompare(b.name))) {
    const base = path.join(adapterRoot, entry.name);
    const adapter = await loadAdapter(path.join(base, 'adapter.json'));
    const fixture = JSON.parse(await fs.readFile(path.join(base, 'fixture.json'), 'utf8'));
    const validation = validateAdapterFixture(adapter, fixture);
    if (!validation.valid) throw Object.assign(new Error(`${adapter.id}: invalid fixture`), { code: 'ADAPTER_INVALID', details: validation.errors });
    adapters.push({ id: adapter.id, version: adapter.version, vertical: adapter.vertical });
  }
  return { status: 'valid', skills: registered.list().map(({ manifest }) => ({ id: manifest.id, version: manifest.version })), adapters };
}

async function commandPlan(file) {
  const input = await readJson(file);
  if (input.adapter && input.fixture && input.goal?.description) {
    const base = path.dirname(path.resolve(file));
    const adapter = await loadAdapter(path.resolve(base, input.adapter));
    const fixture = JSON.parse(await fs.readFile(path.resolve(base, input.fixture), 'utf8'));
    return composeCommercialPlan(input.goal, adapter, fixture);
  }
  const registered = await registry();
  const skills = registered.list().map(({ manifest }) => ({ ...manifest, capabilities: manifest.capabilities ?? [manifest.id] }));
  return planGoal({ goal: input.goal ?? input, skills, state: input.state ?? {}, limits: input.limits ?? {} });
}

async function commandEval(output = 'evals/results/latest.json') {
  const metadata = JSON.parse(await fs.readFile(path.join(PACKAGE_ROOT, 'evals/metadata.json'), 'utf8'));
  const report = await runBenchmark({ cases: corpus, metadata, repetitions: 2 });
  const paths = await writeReports(report, output);
  return { status: 'completed', runId: report.runId, cases: report.caseCount, dimensions: report.dimensions, reports: paths };
}

export async function main(argv) {
  const [command, ...args] = argv;
  if (!command || ['--help','-h','help'].includes(command)) { process.stdout.write(`${HELP}\n`); return EXIT.ok; }
  if (['--version','-v'].includes(command)) { process.stdout.write('0.1.0-rc.1\n'); return EXIT.ok; }
  try {
    let result;
    switch (command) {
      case 'doctor': {
        const major = Number(process.versions.node.split('.')[0]);
        result = { status: major >= 22 ? 'healthy' : 'invalid', node: process.versions.node, runtimeDependencies: 0, liveEffects: false };
        break;
      }
      case 'validate': result = await validateRepository(); break;
      case 'skills': {
        const registered = await registry();
        result = { status: 'completed', skills: registered.list().map(({ manifest }) => ({ id: manifest.id, version: manifest.version, permissions: manifest.permissions, effects: manifest.effects })) };
        break;
      }
      case 'plan': result = await commandPlan(args[0]); break;
      case 'run': result = executeSkill(args[0], await readJson(args[1])); break;
      case 'economics': { const input = await readJson(args[0]); result = calculateUnitEconomics(input.economics ?? input); break; }
      case 'experiment': { const input = await readJson(args[0]); result = validateExperimentPlan(input.experiment ?? input); break; }
      case 'continuity': result = executeSkill('continuity-preflight', await readJson(args[0])); break;
      case 'eval': result = await commandEval(args[0]); break;
      case 'release-check': {
        const { assessRelease } = await import('../tools/release-check.mjs');
        result = assessRelease();
        print(result);
        return result.technicalDecision === 'GO' ? EXIT.ok : EXIT.blocked;
      }
      default: throw Object.assign(new Error(`Unknown command: ${command}`), { code: 'UNKNOWN_COMMAND' });
    }
    print(result);
    if (result?.status === 'abstained' || result?.status === 'blocked' || result?.valid === false || result?.decision === 'do-not-run') return EXIT.blocked;
    return EXIT.ok;
  } catch (error) {
    const blocked = error instanceof PlanningAbstention || /BLOCK|INSUFFICIENT|UNAVAILABLE|UNAFFORDABLE|CYCLE|EXCEEDED/.test(error.code ?? '');
    const invalid = !blocked && /INVALID|REQUIRED|VALIDATION|UNKNOWN|INPUT|JSON|TYPE/.test(error.code ?? '');
    process.stderr.write(`${JSON.stringify({ status: blocked ? 'blocked' : 'invalid', code: error.code ?? error.name, message: error.message, details: error.details ?? error.errors ?? null })}\n`);
    return blocked ? EXIT.blocked : invalid ? EXIT.invalid : EXIT.internal;
  }
}

export { EXIT };
