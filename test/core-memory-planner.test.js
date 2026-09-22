// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import test from "node:test";
import { createMemoryRecord, MemoryStore, transitionMemory } from "../src/core/memory.js";
import { planGoal, PlanningAbstention } from "../src/core/planner.js";

const memory = (overrides = {}) => createMemoryRecord({ id: "m1", type: "material_fact", tenantId: "tenant-a", purpose: ["forecast"], source: "crm:1", actor: "system", confidence: 0.7, validFrom: "2026-09-01T00:00:00Z", reviewAt: "2026-09-20T00:00:00Z", content: { goal: "forecast", value: 42 }, ...overrides });

test("material memory needs independent validation and stale content remains warned", () => {
  const candidate = memory();
  assert.throws(() => transitionMemory(candidate, "active"), (error) => error.code === "MEMORY_VALIDATION_REQUIRED");
  const active = transitionMemory(candidate, "active", { validation: { independent: true, evidenceId: "e1" } });
  const store = new MemoryStore(); store.add(active);
  store.add(transitionMemory(memory({ id: "other", tenantId: "tenant-b", source: "crm:secret", content: { secret: "never" } }), "active", { validation: { independent: true, evidenceId: "e2" } }));
  const result = store.retrieve({ tenantId: "tenant-a", purpose: "forecast", goal: "forecast" }, { now: new Date("2026-09-22T00:00:00Z") });
  assert.equal(result.length, 1); assert.equal(result[0].stale, true); assert.equal(JSON.stringify(result).includes("never"), false);
  assert.throws(() => { active.content.value = 99; }, TypeError);
  assert.equal(store.propagateDeletion("crm:1", { tenantId: "tenant-a" }).invalidated, 1);
  assert.equal(store.retrieve({ tenantId: "tenant-a", purpose: "forecast" }).length, 0);
  assert.throws(() => transitionMemory(active, "candidate"), (error) => error.code === "MEMORY_TRANSITION");
  assert.throws(() => memory({ id: "non-json", content: { values: new Map([["x", 1]]) } }), (error) => error.code === "CANONICAL_OBJECT");
  const cyclicContent = {}; cyclicContent.self = cyclicContent;
  assert.throws(() => memory({ id: "cyclic", content: cyclicContent }), (error) => error.code === "CANONICAL_CYCLE");
});

test("planner detects cycles, cost bounds, missing evidence and creates bounded groups", () => {
  const skills = [
    { id: "collect", capabilities: ["collect"], dependencies: [], preconditions: [], cost: { units: 1 } },
    { id: "forecast", capabilities: ["forecast"], dependencies: ["collect"], preconditions: [], cost: { units: 2 } }
  ];
  const plan = planGoal({ goal: { id: "g1", capabilities: ["forecast"] }, skills, limits: { maxParallel: 1, maxCost: 3 } });
  assert.deepEqual(plan.groups.map((group) => group.map((step) => step.id)), [["collect"], ["forecast"]]);
  assert.throws(() => planGoal({ goal: { id: "g", capabilities: ["a"] }, skills: [{ id: "a", dependencies: ["b"], preconditions: [], cost: 0 }, { id: "b", dependencies: ["a"], preconditions: [], cost: 0 }] }), (error) => error instanceof PlanningAbstention && error.code === "DEPENDENCY_CYCLE");
  assert.throws(() => planGoal({ goal: { id: "g", capabilities: ["forecast"] }, skills, limits: { maxCost: 2 } }), (error) => error.code === "PLAN_UNAFFORDABLE");
  assert.throws(() => planGoal({ goal: { id: "g", capabilities: ["forecast"] }, skills: skills.map((entry) => entry.id === "collect" ? { ...entry, preconditions: ["verified_source"] } : entry), state: {} }), (error) => error.code === "EVIDENCE_INSUFFICIENT");
  assert.throws(() => planGoal({ goal: { id: "g", capabilities: ["forecast"] }, skills, limits: { maxParallel: 0 } }), (error) => error.code === "PLAN_LIMIT_INVALID");
});
