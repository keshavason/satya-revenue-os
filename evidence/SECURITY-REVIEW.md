# RC1 security review

- Candidate: `0.1.0-rc.1`
- Candidate digest: `sha256:e9c2fcb94753069f4921ae83f4046fa8312d15494f6e82e2fa00030b1dd577a9`
- Reviewer: Codex (AI)
- Scope: executable trust boundaries, prior-finding remediation, release tooling, and the exact local candidate payload.
- Limitations: partial line review of low-risk commercial data/prose; no live connector, network, destructive ledger rewrite, or external publication test.
- Human approval: not provided
- Open P0: 0
- Open P1: 4 accepted release-boundary risks; see `project/RISKS.md`.

## Exact scan receipt

- Final Standard scan: `b5054b03-763f-4f5c-bef5-589dfd19d88c`
- Directory snapshot: `codex-security-snapshot/v1:sha256:2124a84359ffc527a0ed669cad896aa82d44cb091d19b94530aa79113735e935`
- Completed: `2026-09-22T01:38:45.354106Z`
- Coverage: partial, with 8 recorded surfaces and explicit deferred paths.
- Result: 2 low findings; 0 critical, high, or medium findings.
- AI review is not a human security audit, certification, legal opinion, or publication approval.

## Initial findings and disposition

| Initial finding | Final disposition | Reproducible control |
|---|---|---|
| Unrestricted dynamic skill code loading | Fixed | `SkillRegistry.load()` always fails closed in RC1. |
| Skill reference path traversal | Fixed | Absolute paths and realpath/symlink escapes are rejected. |
| `__proto__` canonical hash omission | Fixed | Null-prototype canonical objects preserve dangerous own keys. |
| Approval reuse within a gateway | Fixed | Uses are consumed and namespaced by tenant, approval, and binding. |
| Cross-tenant receipt collision/early return | Fixed | Nested tenant maps, request-hash checks, and policy-before-return. |
| Shallow receipt/memory immutability | Fixed | Acyclic JSON-only snapshots are recursively frozen. |
| `maxParallel=0` infinite loop | Fixed | Positive safe-integer limits with hard caps. |
| Cyclic/amplified schema recursion | Fixed | Active-ref detection plus a shared 10,000-step work budget. |
| Caller-asserted trusted source | Fixed within the documented host boundary | Trusted provenance IDs must be supplied by the embedding host; no authenticated remote provenance store exists in RC1. |
| Self-reported eval outcomes | Re-scoped, not promoted | The runner and reports say fixture-conformance, not live behavior evidence. |
| Incomplete packed CLI dependency closure | Fixed | Actual tarball install ran packaged `help`, `doctor`, and `eval`. |
| Stale-manifest extra-file blind spot | Fixed | Release check compares the complete fresh workspace inventory. |

## Open findings

1. **Low — approval use state is process-local.** Recreating an `EffectGateway`
   with the original immutable approval resets the in-memory counter. This is an
   accepted dry-run limitation and a hard blocker for live connectors.
2. **Low — ledger hashes are not externally anchored.** A writer with local file
   access can replace and rehash the full ledger. The current chain detects
   corruption and unrecomputed edits; it is not adversarial tamper evidence.

## Decision

Security decision: **CONDITIONAL PASS for the local, offline, dry-run RC1
boundary**. Security decision for live effects or a high-trust shared audit
service: **NO-GO** until durable transactional approval/receipt storage,
authenticated provenance, and an external ledger anchor pass a new review.

