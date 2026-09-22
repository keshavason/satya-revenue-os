// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { canonicalJson, hashCanonical, validateSchema, ValidationError } from "../src/core/contracts/index.js";
import { validateApproval, validateEconomicResult, validateEffectReceipt, validateEvalCase, validateEvidence, validateExperimentResult } from "../src/core/contracts/validators.js";
import { createClaim, deriveClaim, contradictClaims } from "../src/core/claims.js";

test("canonical JSON and hashes are stable across key order", () => {
  const left = { z: [3, { b: true, a: "á" }], a: -0 };
  const right = { a: 0, z: [3, { a: "á", b: true }] };
  assert.equal(canonicalJson(left), canonicalJson(right));
  assert.equal(hashCanonical(left), hashCanonical(right));
  const dangerous = JSON.parse('{"__proto__":{"admin":true},"safe":1}');
  assert.match(canonicalJson(dangerous), /"__proto__"/);
  assert.notEqual(hashCanonical(dangerous), hashCanonical({ safe: 1 }));
  assert.throws(() => canonicalJson({ missing: undefined }), (error) => error.code === "CANONICAL_UNDEFINED" && error.path === "$/missing");
});

test("supported schema subset reports exact paths and rejects unsupported claims", () => {
  const schema = { type: "object", required: ["name"], properties: { name: { type: "string", minLength: 2 } }, additionalProperties: false };
  const result = validateSchema(schema, { name: "x", extra: true }, { throwOnError: false });
  assert.equal(result.valid, false);
  assert.deepEqual(result.errors.map((error) => error.path), ["$/name", "$/extra"]);
  assert.throws(() => validateSchema({ type: "string", minContains: 1 }, "x"), (error) => error.code === "UNSUPPORTED_SCHEMA_KEYWORD" && error.path === "$schema/minContains");
  const cyclic = { $defs: { node: { $ref: "#/$defs/node" } }, $ref: "#/$defs/node" };
  assert.throws(() => validateSchema(cyclic, {}), (error) => error.code === "SCHEMA_REF_CYCLE");
  let amplified = { type: "object" };
  for (let depth = 0; depth < 20; depth += 1) amplified = { allOf: [amplified, amplified] };
  assert.throws(() => validateSchema(amplified, {}), (error) => error.code === "SCHEMA_WORK_LIMIT");
});

test("repeated inference cannot become observed fact and contradictions remain symmetric", () => {
  const base = createClaim({ id: "c1", text: "Conversion may improve", class: "inference", evidenceState: "declared", sources: ["source:1"], confidence: 0.6, createdAt: "2026-09-22T00:00:00Z" });
  assert.throws(() => deriveClaim([base, base], { id: "c2", text: "Conversion improved", class: "observed_fact", confidence: 0.8 }), (error) => error instanceof ValidationError && error.code === "CLAIM_CLASS_PROMOTION");
  const other = createClaim({ id: "c3", text: "Conversion fell", class: "inference", evidenceState: "declared", sources: ["source:2"], confidence: 0.5, createdAt: "2026-09-22T00:00:00Z" });
  const [left, right] = contradictClaims(base, other);
  assert.deepEqual(left.contradictions, ["c3"]); assert.deepEqual(right.contradictions, ["c1"]);
});

test("contract catalog and specialized validators accept positive examples and reject exact negative fields", async () => {
  const catalog = JSON.parse(await readFile(new URL("../contracts/core.schema.json", import.meta.url), "utf8"));
  assert.equal(validateSchema(catalog, {}).valid, true);
  const examples = [
    [validateEvidence, { contractVersion: "1.0.0", id: "e1", state: "observed", source: "crm:1", capturedAt: "2026-09-22T00:00:00Z", contentHash: "sha256:a", trust: "trusted", supports: ["c1"], contradicts: [] }],
    [validateApproval, { contractVersion: "1.0.0", id: "a1", tenantId: "t1", operationHash: "sha256:x", destination: "dry-run", fields: [], amount: null, expiresAt: "2026-09-23T00:00:00Z", maxUses: 1, uses: 0, status: "active" }],
    [validateEffectReceipt, { contractVersion: "1.0.0", operationId: "op1", tenantId: "t1", state: "not-started", attempt: 0, requestedAt: "2026-09-22T00:00:00Z", updatedAt: "2026-09-22T00:00:00Z", requestHash: "sha256:x", dryRun: true }],
    [validateEconomicResult, { contractVersion: "1.0.0", kind: "EconomicResult", status: "complete", currency: "EUR", period: "month", values: {}, observedInputs: [], modelledInputs: [], assumptions: [], missingValues: [], sensitivity: [], confidenceLimitations: [], recommendation: { decision: "no-automatic-action" } }],
    [validateExperimentResult, { contractVersion: "1.0.0", planId: "p1", status: "insufficient", observations: [], uncertainty: null, srm: null, decision: null, warnings: [] }],
    [validateEvalCase, { contractVersion: "1.0.0", id: "case1", version: "1.0.0", adapter: "saas", kind: "golden", input: {}, expected: {}, scorers: ["correctness"] }]
  ];
  for (const [validator, value] of examples) {
    assert.equal(validator(value), value);
    assert.throws(() => validator({ ...value, contractVersion: "9.0.0" }), (error) => error.code === "UNSUPPORTED_CONTRACT_VERSION" && error.path === "$/contractVersion");
  }
});
