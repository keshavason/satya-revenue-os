---
name: economics-analysis
description: Calculate guarded commercial unit economics from explicit numeric inputs. Use for decision support; do not turn modelled values into observed facts or optimize revenue while contribution is negative.
---

# Economics Analysis

Validate denominators and classify inputs. Calculate contribution, contribution margin, and acquisition cost per customer. A non-positive contribution must produce a no-action decision instead of a growth recommendation.

## Contract

Read [skill.json](skill.json) before execution. It declares the deterministic entrypoint, input and output shape, evidence expectations, failure codes, permissions, and effect boundary.

Return either a contract-valid `completed` artifact or a typed `abstained` result. Preserve provenance, warnings, contradictions, and unresolved evidence. Never perform network access, external writes, outreach, publication, financial operations, or data export.

