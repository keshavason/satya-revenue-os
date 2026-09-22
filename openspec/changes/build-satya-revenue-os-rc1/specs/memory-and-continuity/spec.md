# Spec Delta

## Purpose

Provides selective project continuity and governed memory without treating stale summaries, cross-tenant content, or unverified recollections as current truth.

## ADDED Requirements

### Requirement: Selective continuity preflight
Before a long-running project response, the system SHALL be able to retrieve relevant goals, decisions, changes, pending work, failed attempts, constraints, risks, and evidence without loading the full history. The result SHALL expose source identifiers and freshness.

#### Scenario: Resume after interruption
- **WHEN** a project resumes with a named goal and limited context budget
- **THEN** preflight returns the smallest relevant set covering current decisions, pending blockers, failures, and constraints with provenance

### Requirement: Memory lifecycle
Memory records SHALL declare type, tenant, source, actor, sensitivity, confidence, validity interval, expiry or review time, contradiction links, and status `candidate`, `active`, `superseded`, `invalidated`, or `expired`.

#### Scenario: Stale metric is not silently reused
- **WHEN** an active metric passes its review time
- **THEN** retrieval marks it stale and downstream recommendations either request refresh or preserve the warning

### Requirement: Tenant and purpose isolation
Memory retrieval SHALL enforce tenant and task-purpose boundaries before content reaches a model or skill.

#### Scenario: Cross-tenant lookup
- **WHEN** a run for tenant A queries a record that belongs only to tenant B
- **THEN** the record is not returned and the error reveals no protected content

### Requirement: Validated promotion
Commercially material facts SHALL enter memory as candidates and SHALL require independent validation before becoming active operational memory.

#### Scenario: CRM note proposes a policy change
- **WHEN** an untrusted CRM note asserts a new discount policy
- **THEN** the assertion remains quarantined and cannot alter pricing or approval behavior

