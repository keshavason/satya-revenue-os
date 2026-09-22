// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { AppendOnlyLedger, projectRun, verifyLedger } from "../src/core/ledger.js";
import { createApproval, checkApproval, PolicyEngine } from "../src/core/policy.js";

const effect = (overrides = {}) => ({ contractVersion: "1.0.0", operationId: "op-1", tenantId: "tenant-a", capability: "crm.write", effect: "write", destination: "crm/accounts/1", fields: ["status"], arguments: { status: "qualified" }, amount: null, sourceTrust: "trusted", provenanceId: "evidence:crm:1", approvalId: "approval-1", ...overrides });

test("ledger detects content tampering and partial records while projecting failures", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "satya-ledger-"));
  const path = join(directory, "run.jsonl");
  const ledger = await new AppendOnlyLedger(path).initialize();
  await ledger.append({ runId: "run-1", type: "plan.created", occurredAt: "2026-09-22T00:00:00Z", payload: { id: "p1" } });
  await ledger.append({ runId: "run-1", type: "step.failed", occurredAt: "2026-09-22T00:00:01Z", payload: { stepId: "s1", code: "EFFECT_FAILED" } });
  const verified = await verifyLedger(path);
  assert.equal(projectRun(verified.events).failures[0].code, "EFFECT_FAILED");
  const original = await readFile(path, "utf8");
  await writeFile(path, original.replace("EFFECT_FAILED", "HIDDEN_FAILURE"));
  await assert.rejects(verifyLedger(path), (error) => error.code === "LEDGER_TAMPERED");
  await writeFile(path, original.slice(0, -2));
  await assert.rejects(verifyLedger(path), (error) => error.code === "LEDGER_PARTIAL_RECORD");
  t.after(() => import("node:fs/promises").then(({ rm }) => rm(directory, { recursive: true, force: true })));
});

test("policy fails closed and exact approval binding detects every material change", () => {
  const request = effect();
  const unavailable = new PolicyEngine({ available: false });
  assert.deepEqual(unavailable.evaluate(request, {}), { decision: "deny", reason: "policy_unavailable" });
  const approval = createApproval(request, { id: "approval-1", expiresAt: "2026-09-23T00:00:00Z" });
  assert.equal(checkApproval(approval, request, { now: new Date("2026-09-22T01:00:00Z") }).valid, true);
  for (const changed of [
    effect({ tenantId: "tenant-b" }), effect({ destination: "crm/accounts/2" }), effect({ fields: ["email"] }),
    effect({ amount: { currency: "EUR", value: 1 } }), effect({ arguments: { status: "closed" } })
  ]) assert.equal(checkApproval(approval, changed, { now: new Date("2026-09-22T01:00:00Z") }).valid, false);
  const trusted = new PolicyEngine({ rules: [{ id: "allow", matches: () => true, decide: () => ({ decision: "allow", reason: "verified" }) }] });
  const baseContext = { goalTenantId: "tenant-a", grants: [{ tenantId: "tenant-a", capability: "crm.write" }] };
  assert.equal(trusted.evaluate(request, baseContext).reason, "trusted_provenance_unverified");
  assert.equal(trusted.evaluate(request, { ...baseContext, trustedProvenanceIds: ["evidence:crm:1"] }).decision, "allow");
});
