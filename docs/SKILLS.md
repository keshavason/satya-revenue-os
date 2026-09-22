# Skill specification

A skill is a directory under `skills/` with:

- `SKILL.md`: portable discovery and concise instructions;
- `skill.json`: machine-enforced SATYA contract;
- optional `references/` or `scripts/` only when they materially improve work.

Required manifest concepts include stable ID/version, input/output contracts,
preconditions, postconditions, failure codes, evidence requirements,
permissions, declared effects, approval policy, cost hints, adapters, and a
deterministic handler identifier.

Instructions never grant permissions. A skill that recommends outreach produces
a draft; a separately authorized effect would be needed to send it. Dirty,
contradictory, or insufficient inputs must preserve uncertainty or return a typed
abstention.

RC1 validates manifest references after canonical path resolution and rejects
escapes from the configured skills root. Discovery never imports the declared
entrypoint. `SkillRegistry.load()` is deliberately disabled; executable
third-party skills need a later process-isolated capability protocol. The
reference runner accepts only functions explicitly registered by a trusted host.

Descriptions should be discriminating enough for discovery without becoming a
catalog. Conditional detail belongs in linked references.
