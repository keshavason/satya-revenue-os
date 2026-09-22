# Supply-chain and release provenance

CI uses minimal permissions and immutable action revisions. Runtime dependencies
are zero in RC1. Every future dependency, skill, connector, fixture, model, and
dataset must declare source, version, digest, license, permissions, data access,
network access, and rollback.

The local release manifest inventories present artifacts. Its candidate digest
binds the exact payload selected by the `package.json` `files` list plus package
metadata; the release gate separately verifies every manifest entry against the
current workspace. The manifest is still unsigned and is not an external trust
anchor. A future public release should generate CycloneDX or SPDX material,
sign artifacts with Sigstore, and verify builder identity and commit. This
document does not claim an achieved SLSA level or signed release.
