---
name: pipeline-forecast-review
description: Review a dated commercial pipeline and produce a transparent weighted forecast. Use when amount and probability are explicit; do not relabel weighted pipeline as causal lift.
---

# Pipeline Forecast Review

Require an as-of date and explicit amount and probability for every opportunity. Return deterministic weighted pipeline and limitations. Unknown fields must cause abstention, not silent imputation.

## Contract

Read [skill.json](skill.json) before execution. It declares the deterministic entrypoint, input and output shape, evidence expectations, failure codes, permissions, and effect boundary.

Return either a contract-valid `completed` artifact or a typed `abstained` result. Preserve provenance, warnings, contradictions, and unresolved evidence. Never perform network access, external writes, outreach, publication, financial operations, or data export.

