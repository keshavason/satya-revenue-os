# SATYA Revenue OS

SATYA Revenue OS is an open, local-first commercial decision system for humans
and AI agents. It turns typed business inputs into evidence-bounded plans,
calculations, experiments, and review artifacts while keeping recommendation
separate from execution.

> RC1 status: local candidate under construction. It performs no live outreach,
> CRM writes, publication, payments, or other external commercial effects.

## Quickstart

Requirements: Node.js 22 or newer. No paid API or runtime dependency is needed.

```sh
npm install --ignore-scripts
npm run doctor
npm test
npm run eval
node bin/satya-revenue.mjs --help
```

Try a vertical example:

```sh
node bin/satya-revenue.mjs economics examples/saas/workspace.json
node bin/satya-revenue.mjs plan examples/industrial-b2b/workspace.json
node bin/satya-revenue.mjs run market-research examples/saas/market-research-input.json
```

## What is implemented in RC1

- typed claims, provenance, memory, approvals, effect receipts, and run events;
- bounded skill planning and a dry-run-only effect gateway;
- unit economics, experiment checks, attribution classes, and forecasting checks;
- Agent Skills-compatible packages with stricter SATYA manifests;
- SaaS, ecommerce, professional-services, local-business, hospitality, and
  industrial-B2B adapters;
- offline unit, integration, scenario, failure, regression, and adversarial evals.

Discovered skill packages are validated but never dynamically imported by RC1.
The local runner executes only functions explicitly registered by its trusted
embedding host; process-isolated third-party skill execution is future work.

## Trust boundaries

Untrusted content may inform analysis but cannot change policy or grant
authority. `read` is not `write`; `recommend` is not `execute`. Every effect is
declared, provenance checked, policy checked, idempotent, and represented by a
tenant-scoped receipt. RC1 ships no live effect connector.

## Documentation

- [Quickstart](docs/QUICKSTART.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Skill specification](docs/SKILLS.md)
- [Adapter guide](docs/ADAPTERS.md)
- [Testing and evals](docs/TESTING.md)
- [Security model](docs/SECURITY-MODEL.md)
- [Threat model](docs/THREAT-MODEL.md)
- [Governance](docs/GOVERNANCE.md)
- [Branch protection](docs/BRANCH-PROTECTION.md)
- [Integration boundaries](docs/INTEGRATIONS.md)
- [Versioning](docs/VERSIONING.md)

## Contributing and security

Read [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md). Do not
report vulnerabilities in public issues. This project is not a compliance,
legal, financial, or human ethical certification.

## License

Original code and documentation are prepared under Apache-2.0. Third-party
sources are references only unless explicitly listed in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
