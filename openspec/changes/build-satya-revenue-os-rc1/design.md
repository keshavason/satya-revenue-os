# Design

## Context

This is a greenfield repository; see `proposal.md` for motivation and the eight capability specs for observable behavior. The design must support small installations using a few skills and larger installations using many skills, while remaining useful offline and without provider credentials.

Primary evidence informing the design includes the Agent Skills specification, W3C PROV-O, OpenLineage, Temporal semantics, OpenAI Agents SDK, LangGraph, MCP, Inspect AI, promptfoo, NIST AI RMF/AML taxonomy, OWASP agent guidance, AgentDojo, established experimentation literature, public RevOps practices, accounting guidance, and primary vendor documentation. These are references, not imported authority; licenses and limits remain recorded separately.

## Goals / Non-Goals

**Goals:**

- Make claims, evidence, decisions, state transitions, approvals, and effects independently inspectable.
- Keep the domain model and conformance tests portable across model and workflow runtimes.
- Make the offline happy path executable with Node.js 22+ and no runtime package dependency.
- Prove useful behavior through deterministic tests and scenario fixtures before adding live connectors.
- Make partial installation natural: core plus selected skills/adapters.
- Preserve an extension path to durable workflow engines, model providers, MCP tools, and remote agents.

**Non-Goals:**

- RC1 will not send outreach, update a live CRM, publish content, move money, buy ads, or mutate external accounts.
- RC1 will not implement a general CRM, CDP, warehouse, email sender, browser agent, or statistical package.
- RC1 will not claim causal uplift, commercial ROI, legal compliance, or human ethical approval.
- RC1 will not depend on `satya-review`, though a future adapter may exchange review artifacts with it.
- RC1 will not choose one permanent agent framework or require an LLM for offline conformance.

## Decisions

### 1. Event-driven, framework-agnostic core

The source of truth will be an append-only run ledger plus typed artifacts. State views are projections from events; generated prose is never the source of permission or truth.

Core layers:

1. `core/contracts` — validators and canonical serialization.
2. `core/claims` — evidence classes, derivation, contradiction, validity, and confidence.
3. `core/ledger` — append-only run events and receipt verification.
4. `core/policy` — deterministic effect, approval, tenant, and budget decisions.
5. `core/planner` — eligibility graph and bounded plan generation.
6. `core/memory` — candidate/active/superseded/invalidated/expired records and continuity selection.
7. `domain/commercial` — portable parties, offers, commercial events, commitments, economic events, metrics, experiments, and decisions.
8. `runtime` — local deterministic runner and provider interfaces.

Alternatives considered:

- **LangGraph as the core:** useful optional runtime, rejected as the domain model because replay does not make external effects idempotent and would couple contracts to one graph engine.
- **OpenAI Agents SDK as the core:** useful adapter, rejected because the policy boundary must cover all tools/handoffs consistently and remain provider-neutral.
- **Temporal immediately:** its operation IDs, activity separation, replay, and compensation semantics are adopted; the server/runtime is deferred until real long-running jobs justify its operational cost.

### 2. Agent Skills discovery plus a SATYA manifest

Each skill package will use `SKILL.md` for discovery and progressive disclosure. `skill.json` will be authoritative for executable contracts: identity/version, input/output schema references, pre/postconditions, failure codes, evidence, permissions, effects, approvals, budget hints, compatible adapters, and entrypoint.

The core validates manifests before they enter the registry. Instructions never grant permissions; policy is external to skill prose.

Alternative considered: encoding the entire contract in frontmatter. Rejected because Agent Skills frontmatter is intentionally small, host behavior varies, and complex JSON contracts need deterministic validation.

### 3. Strict separation of plan, recommend, and effect

Planning creates a proposed sequence. Running a pure skill creates artifacts. Effect dispatch is a separate interface requiring capability grants, a fresh policy decision, and an exact approval when configured.

RC1 ships a `dry-run` effect adapter only. It records the canonical request and would-be decision but cannot reach a live service. This makes adversarial tests meaningful without risking external consequences.

### 4. Source-to-sink trust propagation

Every artifact carries trust/provenance metadata. Content from web, CRM, email, documents, OCR, connectors, other agents, and tool descriptions is untrusted by default. Taint does not make content unusable; it prevents content from silently becoming policy or authority.

The gateway checks tenant, subject, capability, operation, arguments, destination, transmitted fields, sensitivity, budget, approval, and idempotency immediately before dispatch. High-impact effects fail closed.

Alternative considered: a prompt-injection classifier as the primary control. Rejected because contextualized attacks can resemble legitimate persuasion and classifiers are probabilistic. Detection remains a signal, not authorization.

### 5. Evidence model compatible with PROV concepts

The minimum model uses entities (artifacts/sources), activities (runs/steps), and agents (human/system/provider), with `used`, `generated`, `derivedFrom`, `attributedTo`, `generatedAt`, `validFrom`, `validTo`, `invalidatedAt`, and contradiction edges.

Claims have two independent dimensions:

- evidence state: unknown, declared, observed, tested, verified, blocked;
- claim class: observed fact, external datum, inference, hypothesis, opinion, prediction, recommendation.

Confidence is not used to promote classes. Evidence may support or contradict a claim, and decision records state what would change the decision.

### 6. Memory is governed records, not accumulated chat

Four interfaces remain distinct:

- `run_state` — ephemeral execution state;
- `session_log` — ordered interaction/run history;
- `knowledge_memory` — validated cross-session records;
- `artifact_store` — immutable or versioned files referenced by ID/hash.

New persistent records enter as candidates. Retrieval filters tenant, purpose, sensitivity, validity, and relevance before ranking. Semantic search may become an index, never the source of truth.

Continuity preflight uses a deterministic relevance score over named goal, capability, status, recency, unresolved risk, and dependency. It reports omissions and freshness.

### 7. Horizontal commercial ontology

The core avoids a SaaS-only `lead → opportunity → subscription` assumption. It defines:

- `Party`: person, household, account, organization, buying group.
- `Offer`: product, service, tariff, bundle, and version.
- `CommercialEvent`: contact, visit, inquiry, quote, booking, order, contract, usage, return, renewal, default.
- `Commitment`: quote, booking, order, contract, subscription, backlog.
- `EconomicEvent`: revenue, discount, variable cost, delivery cost, commission, refund, cash receipt.
- `MetricDefinition`: formula, numerator/denominator, period, grain, currency, source, version, owner, biases.
- `DecisionRecord`: alternatives, evidence, approver, reversibility, expected outcome, actual outcome.

Lifecycle state machines are adapter-owned and versioned. `UNKNOWN` is a valid state. Stage history is immutable enough to reconstruct what was known at a forecast date.

### 8. Economics and experiments are pure engines

The economic engine accepts typed inputs and emits calculations, validation errors, assumptions, sensitivity, and missing evidence. It provides formulas rather than asserting universal benchmarks. CAC incremental and fully loaded, revenue and contribution margin, and observed versus modelled LTV remain distinct.

The experiment engine validates a pre-registered contract: decision, estimand, population, randomization unit, variants, allocation, baseline, MDE, power, primary/guardrail/data-quality metrics, duration/stopping rule, multiplicity plan, confounders, sample-ratio mismatch, uncertainty, incremental contribution, and decision.

RC1 implements design validation and deterministic arithmetic; it does not claim to replace a statistical analysis library. Unsupported causal claims are downgraded or rejected.

### 9. Adapters configure, not fork, the core

Six RC1 adapters — SaaS, ecommerce, professional services, local business, hospitality, and industrial B2B — provide metric definitions, funnel/lifecycle states, economic units, constraints, channel hints, compliance prompts, and scenario fixtures.

Adapters cannot override core claim classes, policy, provenance, or release gates. Schema composition and registry lookups replace copied core code.

### 10. Evaluation at three layers

1. **Unit/conformance:** validators, arithmetic, policy, idempotency, state transitions.
2. **Scenario:** fixtures model realistic companies and multi-step workflows; deterministic skills produce inspectable artifacts.
3. **Adversarial/benchmark:** prompt injection in data, evidence laundering, vanity metrics, false attribution, malformed analytics, memory poisoning, tenant crossing, approval tampering, cycles, evaluator manipulation, and paired benign cases.

The native Node test runner is the release gate. Benchmark output is JSON and Markdown. Inspect AI and promptfoo are future optional runners once their isolation and dependency costs are justified; AgentDojo patterns inform cases but its datasets are not copied into RC1.

Score dimensions: correctness, evidence quality, decision quality, consistency, robustness, safety, commercial usefulness, abstention quality, generalization, cost proxy, and latency. Improvement requires comparable versions and raw outcomes.

### 11. Repository and packaging layout

```text
satya-revenue-os/
├── bin/                         # CLI entrypoint
├── src/
│   ├── core/                    # contracts, claims, ledger, policy, planner, memory
│   ├── domain/                  # economics, experiments, lifecycle, forecasting
│   ├── runtime/                 # registry, runner, provider/effect interfaces
│   └── index.js                 # stable library exports
├── contracts/                   # JSON Schemas and examples
├── skills/<skill-name>/         # SKILL.md, skill.json, optional references/scripts
├── adapters/<vertical>/         # adapter.json and fixtures
├── evals/                       # cases, corpus metadata, benchmark runner
├── test/                        # native test suites
├── examples/                    # reproducible workspaces and walkthroughs
├── docs/                        # architecture, quickstart, specs, security, testing
├── evidence/                    # research, validation, release and review receipts
├── project/                     # WORKLOG, DECISIONS, RISKS, BACKLOG
├── .github/                     # CI and contribution templates
└── openspec/                    # planned and archived change specifications
```

### 12. Dependency and license strategy

RC1 code uses only Node built-ins at runtime. JSON Schema documents remain standards-compatible, while RC1's validators implement the required subset explicitly and reject unsupported schema features rather than pretending full JSON Schema compliance.

Apache-2.0 is the recommended code license because it is permissive and includes an express patent grant, but the final legal choice remains the repository owner's decision. Planning will prepare Apache-2.0, SPDX/REUSE metadata, and a third-party source register; release remains NO-GO if ownership or compatibility is unresolved.

Public sources with CC-BY-SA or proprietary terms are cited and paraphrased; their text, taxonomies, and datasets are not copied into the codebase.

## Risks / Trade-offs

- **[A broad RC1 becomes documentation-heavy]** → Gate every claimed capability with executable behavior; keep the initial skill set small and functional.
- **[No runtime dependencies means partial JSON Schema support]** → Declare the supported subset, provide conformance tests, and add a vetted validator later if it measurably reduces risk.
- **[Deterministic local skills cannot demonstrate model reasoning quality]** → Treat them as reference implementations and conformance oracles; add model adapters only after the core invariants pass.
- **[Append-only JSONL can corrupt under concurrent writers]** → RC1 uses one writer with atomic append discipline and detects partial records; multi-process locking/storage backends are P1 and documented.
- **[Claim/provenance metadata can become burdensome]** → Require full detail only for material claims and effects; allow lightweight records for low-risk internal notes.
- **[Adapters may encode cultural or jurisdictional assumptions]** → Defaults remain explicit hypotheses with source/date; adapters can extend but not silently globalize them.
- **[A dry-run gateway may hide integration-specific failures]** → Mark connector behavior unverified and keep publication NO-GO for claims of live execution.
- **[LLM judges can be gamed or circular]** → Deterministic state/event scorers are primary; semantic scores are supplemental and labeled.
- **[Security controls can over-refuse]** → Pair attacks with benign tasks and report utility separately from attack resistance.
- **[License choice is not legal advice]** → Record provenance per file/dataset and require human legal review before public release if the owner needs one.

## Migration Plan

1. Implement the local core, schemas, CLI, ledgers, and deterministic reference runner.
2. Add commercial engines, skills, adapters, fixtures, and scenario tests.
3. Add adversarial cases, benchmark reporting, security review, and SATYA review.
4. Run all offline gates and correct failures; record P0/P1 and residual risks.
5. Produce `0.1.0-rc.1` locally with no remote and no package publication.
6. If the RC is rejected, keep the evidence and change records, revert by commit, and do not publish.
7. Future model/framework/connectors are separate changes that must pass the same conformance and effect-policy tests.

