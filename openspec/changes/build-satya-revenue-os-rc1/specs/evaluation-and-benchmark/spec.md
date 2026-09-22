# Spec Delta

## Purpose

Measures correctness, evidence, decisions, robustness, safety, usefulness, cost, latency, and generalization through executable, versioned evaluations of outputs and trajectories.

## ADDED Requirements

### Requirement: Layered executable evaluation
The repository SHALL provide unit, integration, scenario, adversarial, regression, golden, failure, and cross-industry tests that run with one documented command and return non-zero on gate failure.

#### Scenario: Fresh clone evaluation
- **WHEN** a contributor installs the declared Node version and runs the documented verification command
- **THEN** all offline RC1 tests and evals execute without paid APIs or external credentials

### Requirement: Deterministic trajectory scoring
Where possible, scorers SHALL inspect final state, run events, provenance, approvals, and receipts instead of trusting model-written self-reports. Semantic judges SHALL be explicitly identified and SHALL NOT be the sole release gate for high-risk behavior.

#### Scenario: Output attacks its evaluator
- **WHEN** generated text tells a judge to mark the case as passed
- **THEN** deterministic policy and event scorers ignore that instruction and score observed behavior

### Requirement: Safety and utility pairing
Each adversarial family SHALL include a paired benign case. Reports SHALL separate benign utility, attack success, real consequence, unauthorized action, leakage, over-refusal, cost, latency, and recovery.

#### Scenario: Prompt injection defense over-refuses
- **WHEN** a defense blocks both a malicious instruction and the paired harmless research task
- **THEN** the report records the security success and the utility failure separately

### Requirement: Reproducible benchmark record
Every benchmark result SHALL record repository revision, runtime, fixtures, policies, skill versions, adapter versions, scorer versions, configuration, timestamps, repetitions, and raw case outcomes. Claims of improvement SHALL require comparable before-and-after evidence.

#### Scenario: Incomparable benchmark
- **WHEN** two result sets use different fixtures or policies without a declared comparison method
- **THEN** the benchmark refuses an improvement claim

### Requirement: Required abstention cases
The corpus SHALL include cases where the correct result is insufficient information and cases where the correct commercial decision is no action.

#### Scenario: Missing economics
- **WHEN** a pricing recommendation lacks costs, capacity, or willingness-to-pay evidence needed for the decision
- **THEN** the golden outcome requires an explicit limitation or abstention rather than fabricated precision

