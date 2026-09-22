# Changelog

All notable changes follow Keep a Changelog semantics and Semantic Versioning.

## [0.1.0-rc.1] - Unreleased

### Added

- Initial contracts, local runtime, commercial engines, skills, adapters, evals,
  CLI, documentation, and release gates.

### Security

- Dry-run-only sealed effect gateway, trusted-provenance policy checks,
  tenant-scoped receipts, consumed approval uses, confined skill references,
  tenant-and-binding-scoped approval counters, disabled dynamic skill imports,
  immutable memory, and shared-work-budget validators.
- Release candidate digests cover the exact npm package payload declared in
  `package.json`, including README, license, notice, and security policy.

### Known limitations

- No live connector has been validated.
- Multi-process ledger locking is not provided in RC1.
- The offline benchmark is fixture-conformance, not live behavior evidence.
- Durable transactional approval/receipt storage is not provided in RC1.
- Human legal and publication review remain outside automated gates.
