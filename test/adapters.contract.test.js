// SPDX-License-Identifier: Apache-2.0
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { validateAdapter, validateAdapterFixture, composeCommercialPlan, calculateUnitEconomics } from "../src/domain/index.js";

const ROOT = resolve(import.meta.dirname, "..");
const VERTICALS = ["saas", "ecommerce", "professional-services", "local-business", "hospitality", "industrial-b2b"];
const json = async (path) => JSON.parse(await readFile(resolve(ROOT, path), "utf8"));

test("all six adapters and realistic fixtures satisfy their contracts", async (t) => {
  for (const vertical of VERTICALS) {
    await t.test(vertical, async () => {
      const adapter = await json(`adapters/${vertical}/adapter.json`);
      const fixture = await json(`adapters/${vertical}/fixture.json`);
      assert.deepEqual(validateAdapter(adapter).errors, []);
      assert.deepEqual(validateAdapterFixture(adapter, fixture).errors, []);
      assert.equal(fixture.evidence, "modelled");
      assert.match(fixture.sourceNote, /Synthetic/);
    });
  }
});

test("cross-industry metric mismatch is rejected without coercion", async () => {
  const adapter = await json("adapters/hospitality/adapter.json");
  const fixture = await json("adapters/hospitality/fixture.json");
  fixture.metrics["logo-retention"] = 0.98;
  const result = validateAdapterFixture(adapter, fixture);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(({ code }) => code === "INCOMPATIBLE_METRIC_MODEL"));
});

test("identical goals create materially different SaaS and industrial plans", async () => {
  const goal = { description: "Increase sustainable revenue by ten percent.", targetRevenueIncreasePct: 10 };
  const saas = await json("adapters/saas/adapter.json");
  const saasFixture = await json("adapters/saas/fixture.json");
  const industrial = await json("adapters/industrial-b2b/adapter.json");
  const industrialFixture = await json("adapters/industrial-b2b/fixture.json");
  const saasPlan = composeCommercialPlan(goal, saas, saasFixture);
  const industrialPlan = composeCommercialPlan(goal, industrial, industrialFixture);
  assert.equal(saasPlan.status, "proposed");
  assert.equal(industrialPlan.status, "proposed");
  assert.equal(saasPlan.effectBoundary, "recommend-only");
  assert.notEqual(saasPlan.economicUnit, industrialPlan.economicUnit);
  assert.equal(saasPlan.steps[2].type, "bounded-experiment");
  assert.equal(industrialPlan.steps[2].type, "pipeline-review");
  assert.notDeepEqual(saasPlan.lifecycle, industrialPlan.lifecycle);
});

test("six example workspaces are offline and economically executable", async () => {
  for (const vertical of VERTICALS) {
    const workspace = await json(`examples/${vertical}/workspace.json`);
    assert.equal(workspace.dataClassification, "synthetic");
    const result = calculateUnitEconomics(workspace.economics);
    assert.equal(result.kind, "EconomicResult");
  }
});
