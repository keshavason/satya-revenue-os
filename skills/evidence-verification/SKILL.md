---
name: evidence-verification
description: Verify provenance and evidence state for material commercial claims. Use before relying on claims in decisions; do not treat repetition or confidence as independent evidence.
---

# Evidence Verification

Inspect typed claims and preserve their claim class and evidence state. Report supported, contradicted, and unresolved claims. Do not promote declared or inferred material to observed, tested, or verified.

## Contract

Read [skill.json](skill.json) before execution. It declares the deterministic entrypoint, input and output shape, evidence expectations, failure codes, permissions, and effect boundary.

Return either a contract-valid `completed` artifact or a typed `abstained` result. Preserve provenance, warnings, contradictions, and unresolved evidence. Never perform network access, external writes, outreach, publication, financial operations, or data export.

