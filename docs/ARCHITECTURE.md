# Architecture

SATYA Revenue OS is an event-driven modular monorepo with four boundaries:

1. **Core** validates contracts, claims, evidence, policy, approvals, ledger,
   memory, and plans.
2. **Domain** calculates economics and checks experiments, attribution,
   lifecycle, and forecasts.
3. **Runtime** validates skill packages, selects a bounded plan, and records
   trusted host-registered functions. RC1 does not dynamically import discovered
   skill code.
4. **Packages** provide skills, vertical adapters, fixtures, and eval cases.

The append-only run ledger is the run audit source. Prose is an artifact, not
authority. State views can be regenerated from ordered, single-run events. The
local hash chain detects accidental or unsophisticated edits; it is not a
signature or protection from an attacker who can rewrite and rehash the file.

## Data flow

```text
goal + typed inputs
  -> registry validation
  -> bounded plan
  -> trusted host-registered pure skill/domain step
  -> typed artifact + provenance
  -> policy gateway (only for declared effects)
  -> dry-run receipt
  -> append-only run ledger
```

## Extension rules

Provider, workflow, connector, and storage adapters must preserve public
contracts and pass the same conformance suite. MCP can expose tools and data but
does not become memory, policy, or orchestration. Remote agents remain future
work until internal contracts stabilize.

The CLI's deterministic `run` and `continuity` commands are reference handlers,
not a claim that every exported component is automatically composed. An
embedding host must wire the runner, ledger, policy, approvals, and gateway or
remain effect-free.

The complete decisions and rejected alternatives are in the active
[OpenSpec design](../openspec/changes/build-satya-revenue-os-rc1/design.md).
