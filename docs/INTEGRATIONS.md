# Integration boundaries

An integration declares capabilities independently: `read`, `recommend`,
`write`, `execute`, `egress`, `financial`, and `admin`. A run receives only the
required subset. Connector content is untrusted and never grants authority.

RC1 exposes only a dry-run gateway. Future live adapters must implement exact
approval, idempotency, timeout/indeterminate receipts, recovery, tenant checks,
data minimization, destination controls, and end-to-end sandbox tests.

The in-memory approval and receipt stores prove contract semantics only. A live
adapter also needs durable tenant-scoped storage and an atomic transaction that
reserves an approval use before dispatch and records indeterminate outcomes.

MCP is suitable as a tool/data boundary, OpenTelemetry as optional transport,
and A2A as a possible future remote-agent boundary. None becomes policy or the
source of truth.
