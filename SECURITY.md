# Security policy

## Supported versions

Only the latest published stable release will receive security fixes. RC1 is
not published and has no production-support claim.

## Reporting

Do not open a public issue for a suspected vulnerability or include secrets,
PII, exploit data, or customer records. Use GitHub private vulnerability
reporting after the repository owner enables it. Before that channel exists,
retain the report locally and contact the owner through a verified private route.

## Scope

Important areas include tool/effect authorization, approval binding,
cross-tenant isolation, memory poisoning, prompt injection, PII/secrets,
provenance, idempotency, package integrity, and evaluator manipulation.

## Limitations

RC1 has a dry-run effect gateway only. Passing tests does not prove safety,
legal compliance, ethical approval, or fitness for a live integration.
