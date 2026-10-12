# Branch-protection recommendation

Recommended protection for `main`:

- pull requests required, including one independent approving review;
- dismissal of stale approvals after changes;
- `verify` CI required and up to date;
- conversation resolution required;
- force pushes and branch deletion disabled;
- administrators subject to the same rules;
- signed commits or verified signatures considered according to contributor access;
- CI token permissions read-only unless a separate, reviewed release workflow needs more.

These are recommendations, not evidence that all repository settings are configured. This repository now has a public GitHub remote; that does not change RC1's local, dry-run-only execution model. Administrative protection settings have not been verified by this documentary review. Do not bypass any protection or approval requirement actually enforced by GitHub.
