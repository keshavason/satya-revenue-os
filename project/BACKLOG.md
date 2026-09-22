# Prioritized backlog

## B-001 — RC1 implementation

- Status: complete
- Owner: implementation team
- Evidence: `openspec/changes/build-satya-revenue-os-rc1/tasks.md`.
- Acceptance: all required behavior implemented and exact tests/evals recorded.
- Next verification: archive the OpenSpec change only after owner review.

## B-002 — Optional framework adapters

- Status: deferred P2
- Owner: future maintainer
- Evidence: architecture comparison in the design document.
- Acceptance: same conformance suite passes for the adapter.
- Next verification: after RC1 core stabilizes.

## B-003 — Live connector conformance

- Status: deferred P1
- Owner: future integration maintainer
- Evidence: dry-run-only RC1 boundary.
- Acceptance: isolated end-to-end tests prove policy, approval, idempotency, and recovery.
- Next verification: separate OpenSpec change.

## B-004 — Durable authorization and audit backend

- Status: deferred P1
- Owner: future runtime maintainer
- Evidence: two low exact-version security findings and `project/RISKS.md` R-004/R-005.
- Acceptance: atomic approval/receipt state, authenticated ledger checkpoints, restart/race/rollback tests, and a new security scan.
- Next verification: separate OpenSpec design before implementation.

## B-005 — Live behavior benchmark

- Status: deferred P1
- Owner: future evaluation maintainer
- Evidence: current benchmark declares `fixture-conformance`.
- Acceptance: observed policy/effect/ledger events drive safety outcomes; raw live evidence remains versioned and privacy-bounded.
- Next verification: only after a sandboxed real connector or model adapter exists.
