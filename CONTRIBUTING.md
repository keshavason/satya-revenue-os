# Contributing

## Development

1. Use Node.js 22+.
2. Run `npm install --ignore-scripts`.
3. Run `npm run verify` before proposing a change.
4. Add a focused OpenSpec change for behavior changes.

## Skills and adapters

Every new skill or adapter must declare its contract, version, permissions,
side effects, required evidence, failure states, compatible adapters, license,
and provenance. Include positive, dirty-input, abstention, and adversarial tests.

## Evidence rules

Distinguish observed fact, external datum, inference, hypothesis, opinion,
prediction, and recommendation. Do not import claims, benchmarks, datasets, or
code without source, version/date, license, and limitations.

## Pull requests

Use the pull-request template. Describe risk, migration, rollback, tests, and
the exact evidence for completion. AI review is not human approval.
