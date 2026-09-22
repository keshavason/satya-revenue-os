---
name: icp-qualification
description: Evaluate candidate fit against explicit, observable ICP criteria. Use for transparent qualification; do not infer sensitive traits or turn a fit score into permission for outreach.
---

# Icp Qualification

Assess each candidate field against the provided criteria and expose unknown values. Use exact, deterministic matching for the reference implementation. The result is analysis only and never authorizes contact.

## Contract

Read [skill.json](skill.json) before execution. It declares the deterministic entrypoint, input and output shape, evidence expectations, failure codes, permissions, and effect boundary.

Return either a contract-valid `completed` artifact or a typed `abstained` result. Preserve provenance, warnings, contradictions, and unresolved evidence. Never perform network access, external writes, outreach, publication, financial operations, or data export.

