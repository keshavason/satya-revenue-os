# Spec Delta

## Purpose

Coordinates eligible commercial capabilities through deterministic policy, explicit budgets, idempotency, and human approval without granting an LLM authority to execute effects.

## ADDED Requirements

### Requirement: State-based planning
The planner SHALL select skills from declared goals, current state, preconditions, dependencies, risk, budgets, and available evidence. It SHALL reject cycles and stop when no eligible step can advance the goal.

#### Scenario: Delegation cycle is stopped
- **WHEN** candidate steps form a circular dependency or exceed depth, step, time, or cost limits
- **THEN** planning terminates with an explicit budget or cycle failure and no additional action

### Requirement: Deterministic effect policy
Every effectful operation SHALL pass a non-generative policy decision immediately before dispatch. Decisions SHALL be `allow`, `deny`, `modify`, `ask`, or `defer`; writes, egress, financial, administrative, and destructive effects SHALL fail closed when policy is unavailable.

#### Scenario: Tool output cannot authorize another tool
- **WHEN** untrusted tool output instructs the system to send data to another service
- **THEN** that text grants no permission and the proposed sink is evaluated against the original goal and policy

### Requirement: Exact approval binding
An approval SHALL bind to the canonical operation, tenant, destination, transmitted fields, monetary amount if any, expiry, and use count. Any material change SHALL invalidate it.

#### Scenario: Recipient change invalidates approval
- **WHEN** an approved draft is retargeted to a different recipient
- **THEN** dispatch is blocked until a new exact approval is recorded

### Requirement: Idempotent effect boundary
Effect requests SHALL carry a stable operation identifier and SHALL produce a receipt that distinguishes not-started, dispatched, succeeded, failed, indeterminate, and compensated states.

#### Scenario: Retry does not duplicate effect
- **WHEN** a caller retries an operation whose receipt is already succeeded
- **THEN** the existing receipt is returned and no duplicate dispatch occurs

### Requirement: Model routing is bounded
Routing SHALL consider task complexity, risk, economic value, reasoning need, context size, latency, and monetary budget. A fallback SHALL never bypass policy or evidence requirements.

#### Scenario: Cheap model is ineligible for high-risk review
- **WHEN** a task is classified high-risk and a candidate model lacks the required reasoning or tool controls
- **THEN** the router escalates within budget or returns a blocked result without executing

