# Quickstart

## Install and verify

```sh
git clone <repository-url>
cd satya-revenue-os
npm install --ignore-scripts
npm run doctor
npm run verify
```

The placeholder URL is intentionally not executable because RC1 has no remote.
For the local candidate, enter this repository directory directly.

## Inspect and run

```sh
node bin/satya-revenue.mjs skills
node bin/satya-revenue.mjs validate
node bin/satya-revenue.mjs economics examples/saas/workspace.json
node bin/satya-revenue.mjs plan examples/ecommerce/workspace.json
node bin/satya-revenue.mjs experiment examples/ecommerce/experiment.json
node bin/satya-revenue.mjs eval
```

Commands emit JSON to stdout and diagnostic errors to stderr. Exit codes are
documented by `node bin/satya-revenue.mjs --help`.

## Create a skill

Copy the structure of an existing skill, choose a distinct kebab-case name,
write `SKILL.md`, and add a matching `skill.json`. Then run:

```sh
node bin/satya-revenue.mjs validate
npm test
```
