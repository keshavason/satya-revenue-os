# Spec Delta

## Purpose

Makes the repository understandable, installable, testable, extensible, and reviewable while preserving license provenance, security reporting, and release evidence.

## ADDED Requirements

### Requirement: Reproducible developer path
The repository SHALL document and test a path to clone, verify prerequisites, run a demo, create or inspect a skill, run tests, and run evals without requiring undisclosed accounts or paid services.

#### Scenario: Quickstart verification
- **WHEN** a contributor follows the quickstart in a clean supported environment
- **THEN** the documented commands produce the described artifacts and exit statuses

### Requirement: Open-source project controls
The repository SHALL include an appropriate license, contribution guide, code of conduct, security policy, governance, architecture, testing guide, changelog, versioning policy, issue templates, pull-request template, and third-party attribution process.

#### Scenario: External contribution
- **WHEN** a contributor proposes a new skill or adapter
- **THEN** the templates require contract, tests, provenance, license, risk, and compatibility information

### Requirement: Operational project records
The project SHALL maintain a worklog, decision log, risk register, and prioritized backlog that distinguish inherited state, actions, verified effects, debt, and next verification.

#### Scenario: Material architecture change
- **WHEN** the core state or effect model changes
- **THEN** a decision record names alternatives, evidence, migration impact, rollback, and unresolved risk

### Requirement: Release gate
A public release candidate SHALL have coherent architecture, reproducible installation, functional skills, explicit contracts, functional orchestration, automated tests and evals, real documentation, security and SATYA reviews, verified licensing, reproducible examples, zero known P0 issues, and explicit P1 issues. AI review SHALL NOT be represented as human approval.

#### Scenario: Known P0 remains
- **WHEN** a P0 issue is open or licensing cannot be verified
- **THEN** the release assessment returns NO-GO and no publication claim

