# Threat model

## Assets

Business evidence, customer and tenant data, pricing/offer decisions, memory,
approval authority, effect destinations, credentials, audit continuity, and
release artifacts.

## Trust boundaries

- user intent versus retrieved content;
- tenant A versus tenant B;
- recommendation versus effect;
- model/runtime versus deterministic policy gateway;
- source repository versus third-party package or dataset;
- eval output versus deterministic scorer.

## Principal threats

Prompt/tool injection, malicious CRM and documents, poisoned memory, fake reviews
or analytics, evidence laundering, cross-tenant leakage, PII/secret egress,
approval tampering/fatigue, duplicate effects, race conditions, delegation loops,
mutable dependencies, and evaluator manipulation.

## Residual risk

RC1 tests a local deterministic implementation and dry-run gateway. It does not
prove resistance of future LLMs, remote tools, connectors, operators, or hosting
environments. Those require scoped threat models and conformance tests.
