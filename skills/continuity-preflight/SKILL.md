---
name: continuity-preflight
description: Select relevant, tenant-safe prior decisions and blockers before continuing commercial work. Use when resuming a goal; do not use as an unrestricted memory search.
---

# Continuity Preflight

Use the supplied goal, tenant, and governed records. Exclude records for other tenants and records that are expired or invalidated. Return selected decisions, blockers, and an omission count. Never infer permission from a prior record.

## Contract

Read [skill.json](skill.json) before execution. It declares the deterministic entrypoint, input and output shape, evidence expectations, failure codes, permissions, and effect boundary.

Return either a contract-valid `completed` artifact or a typed `abstained` result. Preserve provenance, warnings, contradictions, and unresolved evidence. Never perform network access, external writes, outreach, publication, financial operations, or data export.

