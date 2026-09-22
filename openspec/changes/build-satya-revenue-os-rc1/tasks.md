# Tasks

## 1. Repository foundation

- [x] 1.1 Create package metadata, Node version declaration, ESM exports, CLI entrypoint, editor settings, ignore rules, and Apache-2.0/REUSE scaffolding; verify `npm install --ignore-scripts` and `npm run doctor` succeed without runtime dependencies.
- [x] 1.2 Create the planned source, contract, skill, adapter, eval, test, example, evidence, project, docs, and GitHub directories; verify the repository-tree test matches the documented architecture.
- [x] 1.3 Add `WORKLOG.md`, `DECISIONS.md`, `RISKS.md`, and `BACKLOG.md` with inherited state and planning decisions; verify record-format tests reject missing status, evidence, owner, or next-verification fields.

## 2. Contracts and provenance

- [x] 2.1 Implement canonical JSON serialization, hashing, contract-version checks, typed validation errors, and the explicitly supported JSON Schema subset; verify unit tests cover invalid versions, paths, unsupported keywords, and stable hashes.
- [x] 2.2 Add schemas and validators for skill manifests, claims, evidence, run events, approvals, effect requests/receipts, memory records, economic inputs/results, experiment plans/results, adapters, and eval cases; verify all positive examples pass and all negative fixtures fail for the intended reason.
- [x] 2.3 Implement claim derivation, contradiction, evidence-class preservation, validity, and confidence handling; verify a multi-agent repetition case cannot promote an inference to an observed fact.
- [x] 2.4 Implement append-only JSONL ledger writes, ordered event verification, partial-record detection, and run projections; verify tampering and truncated records are detected while failed effects remain fully reconstructable.

## 3. Policy, approvals, and effect safety

- [x] 3.1 Implement tenant/capability/source-to-sink policy evaluation with `allow`, `deny`, `modify`, `ask`, and `defer`; verify high-impact effects fail closed when policy is missing or unavailable.
- [x] 3.2 Implement exact approval canonicalization, expiry, use count, tenant, destination, field, and amount binding; verify changing any bound field invalidates approval.
- [x] 3.3 Implement operation IDs, deduplication, effect state transitions, receipts, indeterminate outcomes, and compensation records; verify retry after success performs no duplicate dispatch.
- [x] 3.4 Implement a dry-run-only effect gateway and capability-separated connector interface; verify no RC1 command can open a live network or mutate an external service.

## 4. Planner and runtime

- [x] 4.1 Implement the skill registry and validate `SKILL.md` discovery against `skill.json` contracts; verify malformed, duplicate, incompatible, and permission-ambiguous skills are rejected.
- [x] 4.2 Implement state-based eligibility, dependency graph construction, bounded parallel groups, cycle detection, stop conditions, and typed abstentions; verify cyclic, unaffordable, and evidence-insufficient goals stop deterministically.
- [x] 4.3 Implement model-route classification and provider interfaces with budget/risk/fallback checks; verify fallback cannot bypass policy or evidence requirements and the offline deterministic provider passes conformance.
- [x] 4.4 Implement the local runner that emits plan, step, policy, artifact, cost, failure, and receipt events; verify a multi-skill integration run is replayable from the ledger.

## 5. Memory and continuity

- [x] 5.1 Implement candidate, active, superseded, invalidated, and expired memory transitions with tenant, purpose, sensitivity, source, confidence, validity, and review time; verify illegal transitions and unvalidated material promotions fail.
- [x] 5.2 Implement retrieval filters and selective continuity scoring over goal, capability, dependencies, unresolved risks, failures, status, and freshness; verify a bounded preflight returns relevant decisions and blockers without loading unrelated history.
- [x] 5.3 Add cross-tenant, stale-metric, poisoned-policy, contradiction, rollback, and deletion-propagation scenarios; verify zero protected content leaks through results or errors.

## 6. Commercial domain engines

- [x] 6.1 Implement typed Party, Offer, CommercialEvent, Commitment, EconomicEvent, MetricDefinition, LifecycleTransition, ForecastSnapshot, and DecisionRecord contracts; verify unknown states and historical stage reconstruction work.
- [x] 6.2 Implement unit-economics formulas and validation for applicable CAC, LTV, margins, payback, conversion, retention, churn, expansion, sales cycle, pipeline velocity, deal size, close rate, cash flow, and break-even; verify units, periods, denominators, and rates are guarded.
- [x] 6.3 Implement observed versus modelled inputs, incremental versus fully-loaded acquisition cost, sensitivity reporting, and insufficient-information outputs; verify negative contribution margin prevents a revenue-only recommendation.
- [x] 6.4 Implement experiment-plan validation for estimand, population, randomization, baseline, MDE/power declaration, duration/stopping, primary/guardrail/data-quality metrics, multiplicity, confounders, SRM, and decision rule; verify post-hoc victory and peeking cases are rejected or downgraded.
- [x] 6.5 Implement attribution types for credit, association, incremental lift, and forecast, plus forecast backtest records and hierarchy reconciliation; verify last-touch credit is never relabeled incremental and incompatible forecasts are not compared.

## 7. Skills and adapters

- [x] 7.1 Create and validate functional skills for continuity preflight, evidence verification, market/customer/competitor research, ICP/qualification, positioning/offer/pricing, economics, experiment design, pipeline/forecast review, and SATYA commercial review; verify each returns a valid artifact or typed abstention for dirty inputs.
- [x] 7.2 Validate every new skill with the bundled skill validator and behavior-focused tests; verify descriptions are discriminating, references are reachable, and no scaffold placeholders remain.
- [x] 7.3 Create SaaS, ecommerce, professional-services, local-business, hospitality, and industrial-B2B adapters with units, lifecycle, metrics, constraints, channels, compliance notes, and unsupported assumptions; verify adapter schema and one realistic fixture per vertical.
- [x] 7.4 Add cross-industry composition scenarios; verify identical goals produce materially different but contract-valid plans where adapter economics and constraints differ.

## 8. Evaluation and red team

- [x] 8.1 Build an offline eval runner with versioned case metadata, deterministic outcome/event scorers, repetitions, raw results, and JSON/Markdown reports; verify tampered metadata and incomparable runs block improvement claims.
- [x] 8.2 Add golden, failure, insufficient-information, no-action, and regression cases across all six adapters; verify the expected abstentions count as correct outcomes.
- [x] 8.3 Add adversarial cases for prompt injection, malicious CRM/web/document/tool data, evidence laundering, fake reviews, vanity metrics, attribution fraud, PII/secrets, tenant crossing, approval tampering/fatigue, memory poisoning, loops, idempotency, and evaluator manipulation; verify each attack has a paired benign utility case.
- [x] 8.4 Report correctness, evidence quality, decision quality, consistency, robustness, safety, usefulness, abstention, generalization, cost proxy, latency, attack success, consequence, unauthorized action, leakage, over-refusal, and recovery separately; verify the benchmark never collapses these into an unsupported global score.

## 9. CLI, examples, and developer experience

- [x] 9.1 Implement CLI commands for `doctor`, `validate`, `skills`, `plan`, `run`, `economics`, `experiment`, `continuity`, `eval`, and `release-check`; verify help, success, validation failure, blocked, and internal-error exit codes.
- [x] 9.2 Create reproducible example workspaces for a small SaaS, ecommerce shop, professional service, local business, hotel/restaurant, and industrial B2B manufacturer; verify every walkthrough executes offline and produces the documented artifacts.
- [x] 9.3 Write README, architecture, quickstart, skill specification, adapter guide, testing guide, security model, threat model, governance, contribution, versioning, changelog, and integration-boundary documentation; verify commands and file links using automated docs checks.

## 10. Open-source and supply-chain controls

- [x] 10.1 Add issue forms, pull-request template, code of conduct, security policy, CI, pinned action references, minimal permissions, and branch-protection recommendations; verify workflow lint and local command parity.
- [x] 10.2 Add SPDX headers where applicable, REUSE configuration, source/license matrix, and third-party notices; verify every distributed file has a resolved license and no incompatible or unlicensed imported code/data is present.
- [x] 10.3 Add SBOM/AIBOM generation design and release provenance/signing instructions without claiming an achieved SLSA level; verify the local release manifest lists code, skills, adapters, fixtures, models/providers, and datasets actually present.

## 11. Release candidate verification

- [x] 11.1 Run formatting/static checks, unit tests, integration tests, scenario evals, adversarial evals, regression suite, docs checks, secret scan, license checks, package dry-run, and a clean-directory quickstart; record exact commands, versions, durations, and outputs in evidence receipts.
- [x] 11.2 Conduct an AI security review and exact-version SATYA review over the candidate hash; verify reviewers, scope, evidence, limitations, unresolved P0/P1, and the non-human nature of AI review are explicit.
- [x] 11.3 Correct reproducible failures, rerun affected and full gates, and preserve before/after evidence without deleting negative results; verify the decision and risk logs name every material correction.
- [x] 11.4 Produce a local `0.1.0-rc.1` assessment with architecture tree, functional components, exact test/eval results, failures, remaining weaknesses, risks, P0/P1, source comparison, and GO/NO-GO recommendation; verify no GitHub remote, package publication, or external release occurred.
