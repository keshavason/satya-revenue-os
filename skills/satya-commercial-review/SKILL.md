---
name: satya-commercial-review
description: Apply an exact-artifact SATYA commercial review over purpose, evidence, affected parties, risks, authority, reversibility, and retention. It does not grant publication authority or human approval.
---

# Satya Commercial Review

Review the exact supplied artifact and hash it. Separate reviewer type, authority, failed gates, and limitations. A passing AI review remains neither human approval nor authorization to publish or execute.

## Contract

Read [skill.json](skill.json) before execution. It declares the deterministic entrypoint, input and output shape, evidence expectations, failure codes, permissions, and effect boundary.

Return either a contract-valid `completed` artifact or a typed `abstained` result. Preserve provenance, warnings, contradictions, and unresolved evidence. Never perform network access, external writes, outreach, publication, financial operations, or data export.

