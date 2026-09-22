# Branch-protection recommendation

Before a public remote is created, protect `main` with:

- pull requests required, including one independent approving review;
- dismissal of stale approvals after changes;
- `verify` CI required and up to date;
- conversation resolution required;
- force pushes and branch deletion disabled;
- administrators subject to the same rules;
- signed commits or verified signatures considered according to contributor access;
- CI token permissions read-only unless a separate, reviewed release workflow needs more.

This is a recommendation, not evidence that repository settings are currently
configured. RC1 has no remote.
