# Testing and evals

Run all offline quality gates with `npm run verify`. Once review receipts and
the OpenSpec checklist are complete, run `npm run verify:release` for the local
technical release decision.

- unit tests: contracts, formulas, state transitions, policy, idempotency;
- integration tests: registry, planner, runner, ledger, CLI;
- scenario tests: realistic companies across six verticals;
- adversarial tests: untrusted instructions, evidence laundering, fake data,
  tenant crossing, approvals, memory, loops, and evaluator manipulation;
- regression tests: previously observed failures;
- release gates: docs, license, secrets, package dry-run, and clean quickstart.

Each attack family has a paired benign case to measure over-refusal. Deterministic
state/event scorers are required for future execution benchmarks. The RC1
benchmark is explicitly fixture-conformance: its outcome booleans validate the
corpus, pairing, scorer, and report contracts, not live model or connector
behavior. Dimensions remain separate; no unsupported global score is emitted.
