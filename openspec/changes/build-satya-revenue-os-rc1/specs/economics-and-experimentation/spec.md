# Spec Delta

## Purpose

Calculates commercial economics and evaluates experiments while making assumptions, missing information, uncertainty, attribution limits, and guardrails explicit.

## ADDED Requirements

### Requirement: Unit economics with validation
The engine SHALL calculate applicable CAC, LTV, gross margin, contribution margin, payback, conversion, retention, churn, expansion, sales cycle, pipeline velocity, average deal size, close rate, and cash flow from declared inputs and units. It SHALL reject invalid denominators, incompatible periods, and impossible rates.

#### Scenario: Revenue growth destroys margin
- **WHEN** a proposal increases revenue but produces negative contribution margin under declared costs
- **THEN** the result exposes the loss and SHALL NOT recommend the proposal solely on revenue growth

### Requirement: Assumption-sensitive output
Every computed result SHALL identify observed inputs, assumptions, formulas, missing values, sensitivity drivers, and confidence limitations.

#### Scenario: LTV lacks retention evidence
- **WHEN** LTV is requested without an observed retention horizon or a declared bounded assumption
- **THEN** the engine returns insufficient information rather than an unqualified LTV

### Requirement: Experiment contract
An experiment SHALL declare baseline, hypothesis, primary metric, guardrail metrics, sample definition, duration or stopping rule, confounders, analysis method, business impact rule, and decision options before results are accepted.

#### Scenario: Post-hoc success claim is rejected
- **WHEN** a metric improves but no primary metric or baseline was registered
- **THEN** the result is labeled observational and cannot be reported as a successful controlled experiment

### Requirement: Attribution classes
Observed revenue, attributed revenue, and incremental revenue SHALL be represented as distinct types. A causal uplift claim SHALL require a design capable of supporting that claim and SHALL expose uncertainty.

#### Scenario: Last-touch analytics
- **WHEN** a campaign receives last-touch credit for all converted revenue
- **THEN** the engine may report attributed revenue but SHALL NOT relabel it as incremental revenue

### Requirement: No-action decision
The engine SHALL support `do-not-run` and `insufficient-information` as successful decision outcomes when risk, sample, cost, or evidence makes action unjustified.

#### Scenario: Underpowered harmful test
- **WHEN** the available sample cannot detect a decision-relevant effect and a guardrail risk is material
- **THEN** the recommended decision is not to run the test as proposed

