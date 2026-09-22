# Decision log

## D-001 — Framework-agnostic, dependency-light core

- Status: accepted for RC1
- Owner: repository maintainer
- Decision: Node.js ESM with no runtime dependencies; optional providers sit behind interfaces.
- Alternatives: bind core to LangGraph, OpenAI Agents SDK, or Temporal.
- Evidence: `openspec/changes/build-satya-revenue-os-rc1/design.md` and `evidence/SOURCES.md`.
- Consequence: RC1 implements a declared JSON-schema subset and deterministic reference runner.
- Rollback: introduce a vetted dependency behind the same public contracts.
- Next verification: rerun the conformance suite for any provider/framework adapter.

## D-002 — Apache-2.0 candidate license

- Status: technically prepared; still provisional until owner/legal review before publication
- Owner: repository maintainer
- Decision: prepare original code under Apache-2.0 for its patent grant and broad reuse.
- Evidence: external license research recorded in `evidence/SOURCES.md`.
- Consequence: no third-party material may be relicensed silently.
- Rollback: change before any public release after compatibility review.
- Next verification: human ownership/license review before publication; automated license gate already passes.

## D-003 — Local RC GO and publication NO-GO

- Status: accepted
- Owner: repository owner
- Decision: treat `0.1.0-rc.1` as a local offline/dry-run release candidate; do not publish or enable live effects.
- Alternatives: publish after automated gates alone, or delay all RC designation until production connectors exist.
- Evidence: exact candidate digest and decisions in `evidence/RC1-ASSESSMENT.md`.
- Consequence: the present implementation can be reviewed and extended without misrepresenting automated evidence as human approval or live proof.
- Rollback: invalidate the RC label if any package-payload file changes without a new digest and review.
- Next verification: human exact-version review and explicit publication authority.
