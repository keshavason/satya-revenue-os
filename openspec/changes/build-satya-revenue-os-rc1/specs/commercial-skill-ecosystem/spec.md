# Spec Delta

## Purpose

Provides portable commercial skills that are discoverable as Agent Skills while remaining governed by explicit SATYA contracts, evidence requirements, and effect boundaries.

## ADDED Requirements

### Requirement: Portable skill package
Each skill SHALL contain a concise `SKILL.md` with a discriminating name and description, plus a machine-readable SATYA manifest. Conditional details SHALL be progressively disclosed through linked references or scripts.

#### Scenario: Host discovers a skill
- **WHEN** an Agent Skills-compatible host scans the package
- **THEN** it can discover the skill from `SKILL.md` without loading all supporting material

### Requirement: Functional minimum portfolio
RC1 SHALL include functional skills covering continuity, market/competitor/customer research, ICP and qualification, positioning and offer/pricing analysis, experiment design, economic analysis, pipeline/forecast review, evidence verification, and SATYA commercial review. Each SHALL produce contract-valid output or a typed abstention.

#### Scenario: Dirty input reaches a skill
- **WHEN** a skill receives contradictory, incomplete, or adversarial business data
- **THEN** it preserves contradictions, requests only material missing evidence, or abstains without inventing facts

### Requirement: Skill composition
Skills SHALL exchange typed artifacts rather than relying on shared prose. Composing skills SHALL preserve provenance, confidence, warnings, budgets, and unresolved failures.

#### Scenario: Research feeds positioning
- **WHEN** a positioning skill consumes market and customer research
- **THEN** each positioning claim remains linked to supporting and contradicting evidence

### Requirement: No hidden execution
A skill SHALL NOT perform undeclared writes, network egress, outreach, publication, financial changes, or data exports. A recommendation skill SHALL not be treated as an execution skill.

#### Scenario: Outreach preparation
- **WHEN** an outreach skill prepares a sequence
- **THEN** the result is a draft artifact and no message is sent without a separately authorized effect

