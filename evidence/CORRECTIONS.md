# RC1 correction ledger

Status: closed for local RC1; residual risks are tracked separately.

## Preserved negative evidence

| Stage | Observed failure | Correction | Verification |
|---|---|---|---|
| Example gate | Ecommerce experiment lacked required hypothesis/allocation/business-impact fields; 14/15 examples passed. | Completed the contract-valid fixture. | 15/15 example commands pass. |
| Package dry-run | First sandboxed npm dry-run hit an `EPERM` cache path. | Validation uses an isolated temporary npm cache. | Dry-run and actual tarball install pass. |
| Regression test | First post-security suite expected `approval_exhausted` but the effective immutable state was `approval_inactive`; 56/57 passed. | Corrected the expectation without weakening rejection. | The suite now passes 59/59. |
| Initial security scan | 1 high, 8 medium, and 1 low finding across skill loading, paths, hashes, approvals, tenant receipts, memory, planner, schemas, provenance, and eval claims. | Added structural controls and regression tests; retained dry-run boundaries. | Final exact scan reports only 2 low residual findings. |
| Schema work bound | Per-branch numeric counters did not create a global work budget. | Shared mutable budget across all validation branches. | Amplified `allOf` test stops with `SCHEMA_WORK_LIMIT`. |
| Candidate binding | Digest omitted top-level package files and later omitted packaged eval/tool dependencies. | Digest now derives from the exact `package.json` file selection. | Manifest/release check and tarball smoke test pass. |
| Receipt isolation | Delimiter-concatenated keys could collide for NUL-containing identifiers. | Nested tenant/operation maps and canonical approval keys. | Adversarial identifier regression passes. |
| Duplicate receipt access | A succeeded receipt returned before current policy evaluation. | Policy is evaluated before any duplicate receipt disclosure. | Unauthorized duplicate is blocked. |
| Nested mutability | Receipt and non-plain memory content could remain mutable. | Canonical JSON snapshots plus recursive freeze; Map/Date/cycles rejected. | Mutation and non-JSON regressions pass. |
| Packed CLI | Tarball omitted statically imported eval and release modules. | Included dependency closure and resolved bundled assets from package root. | Installed tarball runs `help`, `doctor`, and 64-case eval. |
| Release inventory | A stale manifest could omit a newly added file. | Exact fresh inventory equality is required. | Release check reports complete inventory. |
| Exact scan continuity | Two intermediate scans became stale when real defects were corrected. | They were failed explicitly rather than misrepresented as final evidence. | Final scan is bound to the frozen candidate and snapshot. |

No negative result was converted into a success claim without rerunning its
affected gate. Generated eval results remain evidence of fixture conformance only.

