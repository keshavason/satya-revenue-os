# Proposal

## Why

SATYA Revenue OS does not yet exist as an implementation. The project needs a greenfield, framework-agnostic foundation that can turn commercial inputs into evidence-bounded plans and calculations while preventing unapproved side effects, silent claim inflation, and false attribution across industries.

## What Changes

- Create an independently installable JavaScript ESM repository with no runtime dependencies and a reproducible Node.js CLI.
- Define machine-validatable contracts for skills, claims, evidence, runs, approvals, effects, memory, experiments, economic models, adapters, and evaluation cases.
- Implement a deterministic planner and policy gate that selects eligible skills by state, dependencies, risk, budget, and approval requirements; execution remains separated from recommendation.
- Implement append-only provenance and useful memory with validity, contradiction, supersession, and stale-data handling.
- Implement economic and experimentation engines that expose assumptions, validation errors, attribution limits, and abstentions.
- Deliver a small but functional cross-industry skill ecosystem and vertical adapters rather than an exhaustive prompt catalog.
- Deliver executable unit, integration, scenario, adversarial, regression, golden, failure, and cross-industry evaluations with machine-readable benchmark output.
- Deliver security, contribution, governance, versioning, release, and developer-experience documentation, plus CI definitions and evidence logs.
- Keep external model runtimes, CRM/email providers, MCP, A2A, LangGraph, OpenAI Agents SDK, and Temporal behind optional interfaces; RC1 SHALL NOT perform live external commercial actions.
- Treat `satya-review` as an independent reference and possible future integration; do not copy or modify it in this change.

## Capabilities

### New Capabilities

- `contracts-and-provenance`: Versioned contracts for skills, claims, evidence, run events, approvals, side-effect receipts, and failure states.
- `orchestration-and-policy`: Dynamic planning, deterministic eligibility checks, budget/risk routing, approval gates, idempotency, and stop/abstain behavior.
- `memory-and-continuity`: Selective continuity preflight and memory records with provenance, validity, contradiction, and obsolescence controls.
- `economics-and-experimentation`: Unit economics, funnel arithmetic, experiment design, causal/attribution boundaries, and explicit insufficient-information results.
- `commercial-skill-ecosystem`: Portable Agent Skills-compatible packages for research, strategy, sales, RevOps, evidence, governance, and execution preparation.
- `vertical-adapters-and-integrations`: Horizontal core with configurable industry adapters and read/recommend/execute integration boundaries.
- `evaluation-and-benchmark`: Executable conformance, scenario, adversarial, regression, cost/latency, usefulness, and generalization evaluations.
- `developer-and-open-source-governance`: Installation, CLI, examples, contribution workflow, security policy, licensing, decision/risk/work logs, and release gates.

### Modified Capabilities

None. This is a greenfield repository.

## Impact

- New local repository: `satya-revenue-os`.
- Primary runtime: Node.js 22+ using ESM and the native test runner; no runtime package dependencies in RC1.
- Public surfaces: CLI commands, JSON contracts, `SKILL.md` packages, library exports, adapter manifests, and benchmark reports.
- Storage: local JSON/JSONL under an explicitly selected workspace; no hidden writes outside it.
- Security posture: untrusted content is data, read does not imply write, recommend does not imply execute, and all declared effects are policy-checked before dispatch.
- Compatibility: optional framework/provider adapters MAY be added after conformance testing; the core domain model SHALL remain portable.
