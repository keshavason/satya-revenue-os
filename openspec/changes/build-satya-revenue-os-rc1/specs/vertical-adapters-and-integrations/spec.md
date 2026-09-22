# Spec Delta

## Purpose

Adapts a horizontal commercial core to different industries and integrations without duplicating core rules or blurring read, recommendation, and execution authority.

## ADDED Requirements

### Requirement: Vertical adapter contract
An adapter SHALL declare its funnel, sales motion, metrics, units, acquisition channels, operational constraints, compliance considerations, economic defaults, required evidence, and unsupported assumptions while inheriting core claim and policy rules.

#### Scenario: Cross-industry metric mismatch
- **WHEN** a hospitality adapter receives SaaS churn inputs as if they were room-inventory metrics
- **THEN** validation reports an incompatible metric model rather than coercing the values

### Requirement: RC1 adapter coverage
RC1 SHALL provide validated adapters for SaaS, ecommerce, professional services, local business, hospitality, and industrial B2B, with at least one realistic scenario fixture per adapter.

#### Scenario: Adapter-specific planning
- **WHEN** identical revenue goals are evaluated for SaaS and industrial B2B fixtures
- **THEN** plans differ where sales cycle, margin, funnel, or operational constraints differ while using the same core contracts

### Requirement: Integration capability separation
Every integration SHALL separately declare read, recommend, write, execute, egress, financial, and administrative capabilities. The runtime SHALL grant only the required subset for a run.

#### Scenario: Read-only CRM connector
- **WHEN** a plan uses a connector granted only CRM read capability
- **THEN** any proposed field update is denied before connector dispatch

### Requirement: Untrusted integration content
Content from connectors, documents, webpages, other agents, and tool descriptions SHALL be treated as untrusted data and SHALL NOT override goals, policy, or approvals.

#### Scenario: Malicious lead record
- **WHEN** a lead record instructs the agent to export contacts to an external URL
- **THEN** the instruction is retained only as untrusted content and no export is authorized

