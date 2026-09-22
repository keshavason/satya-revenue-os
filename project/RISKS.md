# Risk register

## R-001 — Scope breadth hides shallow behavior

- Status: mitigated for RC1; accepted P1 for live behavior
- Owner: repository maintainer
- Evidence: 41/41 planned tasks, 59 tests, 15 examples, and 30-command receipt; eval remains fixture-conformance.
- Mitigation: keep fixture and live claims distinct; require connector/model execution before behavioral claims.
- Next verification: add live-behavior cases only with a real adapter and independent observations.

## R-002 — Dry-run gateway is not a live integration proof

- Status: accepted P1
- Owner: runtime maintainer
- Evidence: RC1 explicitly forbids live external effects.
- Mitigation: label connectors unverified and require separate conformance before enabling execution.
- Next verification: future integration change with sandboxed end-to-end tests.

## R-003 — Canonical license integrity

- Status: mitigated
- Owner: repository maintainer
- Evidence: `LICENSE` was replaced from a bundled, unmodified Apache-2.0 reference and contains the canonical terms marker.
- Mitigation: automated license gate checks the file and SPDX metadata; provenance remains recorded.
- Next verification: license gate before publication.

## R-004 — Approval and receipt state is process-local

- Status: accepted P1
- Owner: runtime maintainer
- Evidence: final security finding `authorization.approval-use-state-ephemeral`.
- Mitigation: sealed dry-run connector; documentation forbids live use without durable transactional state.
- Next verification: multi-process compare-and-swap conformance before any live connector.

## R-005 — Ledger has no adversarial trust anchor

- Status: accepted P1
- Owner: runtime maintainer
- Evidence: final security finding `audit-integrity.unanchored-ledger-chain`.
- Mitigation: claim only corruption detection; do not present the local hash chain as malicious-rewrite proof.
- Next verification: authenticated external head/checkpoint and rollback tests before shared high-trust deployment.

## R-006 — Trusted provenance is host-owned

- Status: accepted P1
- Owner: integration maintainer
- Evidence: policy fails closed without `trustedProvenanceIds`, but RC1 has no authenticated remote provenance service.
- Mitigation: embedding hosts must construct grants and trusted provenance outside model-controlled inputs.
- Next verification: connector-specific identity and provenance threat model.

## R-007 — Publication authority and human review absent

- Status: accepted P1
- Owner: repository owner
- Evidence: exact SATYA review states `Human approval: not provided`; Git remote list is empty.
- Mitigation: release check always reports `publicationAuthorized: false`.
- Next verification: exact-version human security/legal/product review and explicit owner authorization.
