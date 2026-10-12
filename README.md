# SATYA Revenue OS

SATYA Revenue OS is an open, local-first commercial decision system for humans and AI agents. It turns typed business inputs into evidence-bounded plans, calculations, experiments and review artifacts while keeping recommendation separate from execution.

> RC1 status: local candidate under construction. It performs no live outreach, CRM writes, publication, payments or other external commercial effects.

## SATYA Commons v0.1 — documentary commercial adaptation

The [local reference and publication scope](docs/COMMONS-REFERENCE.md) pins [SATYA Commons v0.1](https://github.com/keshavason/satya-review/blob/f63587e5f16dc103d1369b40630ccaef5347a29d/docs/SATYA-COMMONS.md) at commit `f63587e5f16dc103d1369b40630ccaef5347a29d`. This is public design and review guidance, not an operational multi-agent federation or ethical certification.

Read [ethical continuity](docs/ETHICAL-CONTINUITY.md), the [commercial reflective-loop design](docs/REFLECTIVE-LOOP.md) and [governance](docs/GOVERNANCE.md). Non-harm, discernment, truthfulness from the outset, legitimate responsibility, consequence review and care apply together. A teacher explains transferable improvements; a mirror preserves substantive objections; reviewer agreement cannot grant permissions.

The source remains versioned rather than silently copied or overwritten. Identified archives and independent adaptations are possible under the applicable license; upstream updates never change local policy automatically. The human-facing design calls for honest conditions, respect for current intent, an option not to buy and no exploitation of vulnerability or spiritual claims.

**This publication changes documentation only.** It does not instantiate reviewers, share data, connect AJUTIA, MiTrabajadorIA or INFoBOT, or add live effects to RC1. AI-assisted review and maintainer publication authorization are disclosed; independent human peer review and comparative evaluation are not claimed. Private work and conversations are not authorized for disclosure by using the protocols.

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

- typed claims, provenance, memory, approvals, effect receipts and run events;
- bounded skill planning and a dry-run-only effect gateway;
- unit economics, experiment checks, attribution classes and forecasting checks;
- Agent Skills-compatible packages with stricter SATYA manifests;
- SaaS, ecommerce, professional-services, local-business, hospitality and industrial-B2B adapters;
- offline unit, integration, scenario, failure, regression and adversarial evals.

Discovered skill packages are validated but never dynamically imported by RC1. The local runner executes only functions explicitly registered by its trusted embedding host; process-isolated third-party skill execution is future work.

The proposed reflective roles, behavioral care evaluations and federated exchange layer are **not implemented by listing them in documentation**. Existing tests do not establish their efficacy.

## Trust boundaries

Untrusted content may inform analysis but cannot change policy or grant authority. `read` is not `write`; `recommend` is not `execute`. The scoped gateway design separates declarations, provenance, policy checks, idempotency and tenant-scoped receipts. RC1 ships no live effect connector. A documentary recommendation or matching hash is not an authenticated human approval.

## Documentation

- [Commons reference and publication scope](docs/COMMONS-REFERENCE.md)
- [Quickstart](docs/QUICKSTART.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Skill specification](docs/SKILLS.md)
- [Adapter guide](docs/ADAPTERS.md)
- [Testing and evals](docs/TESTING.md)
- [Security model](docs/SECURITY-MODEL.md)
- [Threat model](docs/THREAT-MODEL.md)
- [Governance](docs/GOVERNANCE.md)
- [Branch-protection recommendations](docs/BRANCH-PROTECTION.md)
- [Integration boundaries](docs/INTEGRATIONS.md)
- [Versioning](docs/VERSIONING.md)

## Contributing and security

Read [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md). Do not report vulnerabilities in public issues. This project is not a compliance, legal, financial or human ethical certification. A successful CI run applies to its exact candidate and test scope, not every claim about the protocol.

## License

Original local code and documentation remain under [Apache-2.0](LICENSE). The linked Commons source retains its own MIT license; referencing it does not relicense either project or grant rights over third-party data. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
