# Security model

Assume some malicious or misleading content reaches the model. Limit its impact
with capability separation, source-to-sink provenance, deterministic policy,
exact approvals, idempotency, tenant isolation, bounded budgets, and append-only
audit events.

Sources such as CRM records, email, web, OCR, documents, integrations, other
agents, and tool descriptions are untrusted data. They may support a claim but
cannot change goals, permissions, policy, or approvals.

High-impact effects fail closed if policy or trusted provenance is unavailable.
Approval binds to the canonical operation, tenant, destination, fields, amount,
trust/provenance, expiry, and use count. The local gateway consumes uses within
its process and namespaces counters by tenant, approval identity, and operation
binding; durable transactional approval storage remains required before a live
connector. Receipts are keyed by tenant and operation. RC1 has no live
effect connector and holds no credentials.

Skill discovery is data validation only. `SkillRegistry.load()` fails closed in
RC1, all manifest references are confined to the configured skills root, and
third-party code is not executed in-process.

Schema validation uses shared depth and work budgets across every branch. The
JSONL ledger detects corruption and unrecomputed edits, but its unkeyed local
hash chain is not proof against an attacker who can rewrite and rehash the
whole file. A live deployment needs authenticated external checkpoints or an
equivalent append-only storage control.

Callers must still avoid placing secrets or unnecessary PII in input artifacts,
ledger payloads, stdout, or raw eval results; RC1 does not provide a universal
runtime redactor. Future connectors require separate data inventory, retention,
deletion, and egress controls.
