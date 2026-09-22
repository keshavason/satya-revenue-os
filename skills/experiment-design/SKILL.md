---
name: experiment-design
description: Validate a pre-registered commercial experiment contract before results are inspected. Use for estimand, population, metrics, power, and stopping rules; reject post-hoc victory design.
---

# Experiment Design

Require decision, estimand, population, randomization unit, baseline, MDE, power, duration, primary and guardrail metrics, and a stopping rule. Abstain when results were already seen. Output a draft plan, not a causal result.

## Contract

Read [skill.json](skill.json) before execution. It declares the deterministic entrypoint, input and output shape, evidence expectations, failure codes, permissions, and effect boundary.

Return either a contract-valid `completed` artifact or a typed `abstained` result. Preserve provenance, warnings, contradictions, and unresolved evidence. Never perform network access, external writes, outreach, publication, financial operations, or data export.

