---
name: positioning-offer-pricing
description: Develop a reversible positioning, offer, or pricing test from traceable research, costs, capacity, and willingness-to-pay evidence. Abstain when those inputs are missing.
---

# Positioning Offer Pricing

Require material research claims, costs, capacity, and observed willingness-to-pay values. Preserve supporting claim IDs. Recommend only a reversible price test, or no action when observed price does not exceed delivery cost.

## Contract

Read [skill.json](skill.json) before execution. It declares the deterministic entrypoint, input and output shape, evidence expectations, failure codes, permissions, and effect boundary.

Return either a contract-valid `completed` artifact or a typed `abstained` result. Preserve provenance, warnings, contradictions, and unresolved evidence. Never perform network access, external writes, outreach, publication, financial operations, or data export.

