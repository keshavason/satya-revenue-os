# Spec Delta

## Purpose

Defines portable, versioned contracts that preserve evidence classes, provenance, confidence, failures, approvals, and side effects across skills and runs.

## ADDED Requirements

### Requirement: Versioned skill contract
Every executable skill SHALL declare a stable identifier, semantic version, accepted input and output contracts, preconditions, postconditions, failure states, evidence expectations, side effects, permissions, approval policy, cost hints, and compatibility metadata. Invalid or unknown required fields SHALL fail validation before planning.

#### Scenario: Invalid skill is rejected
- **WHEN** a skill omits its declared side effects or uses an unsupported contract version
- **THEN** validation fails with a machine-readable path and no run is planned

### Requirement: Typed claims and evidence
Every material claim SHALL retain one explicit class from observed fact, external datum, inference, hypothesis, opinion, prediction, or recommendation, plus source references, confidence, creation time, validity, contradictions, and derivation links. Repetition SHALL NOT promote a claim to a stronger class.

#### Scenario: Inference remains an inference
- **WHEN** multiple agents repeat an inference derived from the same source
- **THEN** the output preserves the original derivation and does not relabel the claim as observed fact

### Requirement: Append-only run provenance
Each plan and execution attempt SHALL emit ordered run events for selection, validation, policy decisions, approvals, tool boundaries, results, failures, costs, and side-effect receipts. An agent SHALL NOT be able to rewrite prior events.

#### Scenario: Failed effect remains auditable
- **WHEN** an approved effect fails after dispatch
- **THEN** the ledger retains the approval, dispatch attempt, failure, and recovery status as distinct events

