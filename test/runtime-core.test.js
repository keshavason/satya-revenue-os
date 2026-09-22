// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { AppendOnlyLedger, projectRun, verifyLedger } from "../src/core/ledger.js";
import { createApproval, PolicyEngine } from "../src/core/policy.js";
import { DryRunConnector, EffectGateway } from "../src/runtime/effects.js";
import { DeterministicProvider, ProviderChain, routeModel } from "../src/runtime/router.js";
import { LocalRunner } from "../src/runtime/runner.js";
import { SkillRegistry } from "../src/runtime/skill-registry.js";

const request = { contractVersion: "1.0.0", operationId: "op-1", tenantId: "tenant-a", capability: "crm.write", effect: "write", destination: "crm/a", fields: ["status"], arguments: { status: "qualified" }, amount: null, sourceTrust: "trusted", provenanceId: "evidence:1", approvalId: null };

test("dry-run effect gateway deduplicates succeeded operations and forbids live connectors", async () => {
  const policy = new PolicyEngine({ rules: [{ id: "dry", matches: () => true, decide: () => ({ decision: "allow", reason: "explicit_test_policy" }) }] });
  const gateway = new EffectGateway({ policy, connector: new DryRunConnector(), now: () => "2026-09-22T00:00:00Z" });
  const context = { goalTenantId: "tenant-a", grants: [{ tenantId: "tenant-a", capability: "crm.write" }], trustedProvenanceIds: ["evidence:1"] };
  const first = await gateway.dispatch(request, context); const second = await gateway.dispatch(request, context);
  assert.equal(first.receipt.state, "succeeded"); assert.equal(first.receipt.dryRun, true); assert.equal(second.duplicate, true); assert.equal(second.receipt.attempt, 1);
  const unauthorizedDuplicate = await gateway.dispatch(request, { goalTenantId: "tenant-b", grants: [], trustedProvenanceIds: [] });
  assert.equal(unauthorizedDuplicate.blocked, true); assert.equal(unauthorizedDuplicate.decision.reason, "capability_not_granted");
  assert.throws(() => { first.receipt.result.simulated = false; }, TypeError);
  assert.equal(second.receipt.result.simulated, true);
  assert.throws(() => new EffectGateway({ policy, connector: { dispatch() {} } }), (error) => error.code === "LIVE_CONNECTOR_FORBIDDEN");
});

test("failed dry-run attempts remain reconstructable and can be compensated", async () => {
  const policy = new PolicyEngine({ rules: [{ id: "dry", matches: () => true, decide: () => ({ decision: "allow", reason: "explicit_test_policy" }) }] });
  const gateway = new EffectGateway({ policy, connector: new DryRunConnector({ simulateFailure: "SIMULATED" }), now: () => "2026-09-22T00:00:00Z" });
  const context = { goalTenantId: "tenant-a", grants: [{ tenantId: "tenant-a", capability: "crm.write" }], trustedProvenanceIds: ["evidence:1"] };
  const failed = await gateway.dispatch(request, context);
  assert.equal(failed.receipt.state, "failed"); assert.equal(failed.receipt.failure.code, "SIMULATED");
  assert.equal(gateway.compensate("tenant-a", "op-1", { action: "none-required", reason: "dry-run" }).state, "compensated");
});

test("approval use count and tenant-scoped receipts are enforced", async () => {
  const policy = new PolicyEngine({ rules: [{ id: "approved", matches: () => true, decide: () => ({ decision: "allow", reason: "approved", requiresApproval: true }) }] });
  const approvedRequest = { ...request, approvalId: "approval-1" };
  const approval = createApproval(approvedRequest, { id: "approval-1", expiresAt: "2026-09-23T00:00:00Z", maxUses: 1 }, { now: () => "2026-09-22T00:00:00Z" });
  const gateway = new EffectGateway({ policy, now: () => "2026-09-22T00:00:00Z" });
  const context = { goalTenantId: "tenant-a", grants: [{ tenantId: "tenant-a", capability: "crm.write" }], trustedProvenanceIds: ["evidence:1"], approvals: [approval] };
  assert.equal((await gateway.dispatch(approvedRequest, context)).receipt.state, "succeeded");
  const second = await gateway.dispatch({ ...approvedRequest, operationId: "op-2" }, context);
  assert.equal(second.blocked, true); assert.equal(second.decision.reason, "approval_inactive");
  const otherTenant = { ...request, tenantId: "tenant-b" };
  const other = await gateway.dispatch(otherTenant, { goalTenantId: "tenant-b", grants: [], trustedProvenanceIds: ["evidence:1"] });
  assert.equal(other.blocked, true); assert.equal(other.decision.reason, "capability_not_granted");
});

test("approval usage state is isolated by tenant and binding even when ids collide", async () => {
  const policy = new PolicyEngine({ rules: [{ id: "approved", matches: () => true, decide: () => ({ decision: "allow", reason: "approved", requiresApproval: true }) }] });
  const requestA = { ...request, approvalId: "shared-id", operationId: "op-a" };
  const requestB = { ...requestA, tenantId: "tenant-b", operationId: "op-b" };
  const approvalA = createApproval(requestA, { id: "shared-id", expiresAt: "2026-09-23T00:00:00Z" }, { now: () => "2026-09-22T00:00:00Z" });
  const approvalB = createApproval(requestB, { id: "shared-id", expiresAt: "2026-09-23T00:00:00Z" }, { now: () => "2026-09-22T00:00:00Z" });
  const gateway = new EffectGateway({ policy, now: () => "2026-09-22T00:00:00Z" });
  const context = (tenantId, approval) => ({ goalTenantId: tenantId, grants: [{ tenantId, capability: "crm.write" }], trustedProvenanceIds: ["evidence:1"], approvals: [approval] });
  assert.equal((await gateway.dispatch(requestA, context("tenant-a", approvalA))).receipt.state, "succeeded");
  assert.equal((await gateway.dispatch(requestB, context("tenant-b", approvalB))).receipt.state, "succeeded");
});

test("tenant receipt isolation cannot be confused by delimiter-like identifier data", async () => {
  const policy = new PolicyEngine({ rules: [{ id: "dry", matches: () => true, decide: () => ({ decision: "allow", reason: "explicit_test_policy" }) }] });
  const gateway = new EffectGateway({ policy, now: () => "2026-09-22T00:00:00Z" });
  const first = { ...request, tenantId: "a\u0000b", operationId: "c" };
  const second = { ...request, tenantId: "a", operationId: "b\u0000c" };
  const context = (tenantId) => ({ goalTenantId: tenantId, grants: [{ tenantId, capability: "crm.write" }], trustedProvenanceIds: ["evidence:1"] });
  assert.equal((await gateway.dispatch(first, context(first.tenantId))).receipt.state, "succeeded");
  assert.equal((await gateway.dispatch(second, context(second.tenantId))).receipt.state, "succeeded");
});

test("routing escalates for risk and fallback cannot bypass gates", async () => {
  const routes = [{ id: "cheap", maxRisk: 1, maxContext: 100, reasoning: 1, cost: 1, latency: 1, toolControls: false }, { id: "safe", maxRisk: 5, maxContext: 1000, reasoning: 5, cost: 3, latency: 2, toolControls: true }];
  assert.equal(routeModel({ risk: 4, contextSize: 500, reasoning: 4, requiresTools: true }, routes, { budget: 4 }).id, "safe");
  const chain = new ProviderChain([new DeterministicProvider({ sum: ({ a, b }) => a + b })]);
  await assert.rejects(chain.execute({ task: "sum", input: { a: 1, b: 2 } }, { policyAllowed: false, evidenceSufficient: true }), (error) => error.code === "FALLBACK_GUARD");
  assert.equal((await chain.execute({ task: "sum", input: { a: 1, b: 2 } }, { policyAllowed: true, evidenceSufficient: true })).output, 3);
});

test("skill registry discovers the validated portfolio and rejects duplicate identity", async () => {
  const registry = await new SkillRegistry().discover(new URL("../skills", import.meta.url).pathname.replace(/^\/(.:\/)/, "$1"));
  assert.equal(registry.list().length, 11);
  const existing = registry.list()[0].manifest;
  assert.throws(() => registry.register(existing), (error) => error.code === "SKILL_DUPLICATE");
  await assert.rejects(registry.load(existing.id), (error) => error.code === "SKILL_CODE_LOADING_DISABLED");
});

test("multi-skill local run is fully replayable", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "satya-runner-"));
  const path = join(directory, "ledger.jsonl");
  const ledger = await new AppendOnlyLedger(path).initialize();
  const entries = new Map([
    ["one", { entrypoint: async () => ({ artifactId: "a1", value: 1 }) }],
    ["two", { entrypoint: async ({ artifacts }) => ({ artifactId: "a2", value: artifacts.a1.value + 1 }) }]
  ]);
  const registry = { get: (id) => entries.get(id) };
  const plan = { goalId: "g", groups: [[{ id: "one", skill: { cost: { units: 1 } } }], [{ id: "two", skill: { cost: { units: 1 } } }]], totalCost: 2 };
  const result = await new LocalRunner({ ledger, registry, clock: (() => { let tick = 0; return () => `2026-09-22T00:00:0${tick++}Z`; })(), runId: () => "run-1" }).run(plan);
  assert.equal(result.status, "completed"); assert.equal(result.artifacts.a2.value, 2);
  const replay = projectRun((await verifyLedger(path)).events);
  assert.equal(replay.status, "completed"); assert.deepEqual(replay.artifacts.map((entry) => entry.artifactId), ["a1", "a2"]);
  t.after(() => import("node:fs/promises").then(({ rm }) => rm(directory, { recursive: true, force: true })));
});
