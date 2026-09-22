// SPDX-License-Identifier: Apache-2.0
import test from "node:test";
import assert from "node:assert/strict";
import {
  validateExperimentPlan, evaluateExperimentResult, createAttributionRecord,
  createForecastSnapshot, compareForecasts, createForecastBacktest, reconcileForecastHierarchy
} from "../src/domain/index.js";

const validPlan = {
  id: "exp-1", hypothesis: "A clearer checkout increases paid conversion without increasing refunds", estimand: "incremental paid conversion", population: "eligible new visitors", randomizationUnit: "visitor", allocation: { control: 0.5, treatment: 0.5 },
  baseline: 0.1, mde: 0.02, power: 0.8, primaryMetric: "paid-conversion", guardrailMetrics: ["refund-rate"],
  dataQualityMetrics: ["assignment-coverage"], multiplicityPlan: "one primary metric", confounders: ["seasonality"],
  srmPlan: "chi-square alert and stop", businessImpactRule: "incremental contribution exceeds implementation cost", decisionRule: "adopt only if primary and business rules pass and guardrails hold",
  variants: ["control", "treatment"], duration: "28 days", expectedSample: 12000, requiredMinSample: 10000,
  metricsTested: 1, materialGuardrailRisk: true
};

test("experiment validation requires causal decision fields before results", () => {
  assert.equal(validateExperimentPlan(validPlan).valid, true);
  const invalid = validateExperimentPlan({ id: "posthoc", variants: ["control", "treatment"] });
  assert.equal(invalid.valid, false);
  assert.equal(invalid.decision, "do-not-run");
  assert.ok(invalid.errors.some(({ path }) => path === "plan.primaryMetric"));
});

test("underpowered material-risk tests are do-not-run outcomes", () => {
  const result = validateExperimentPlan({ ...validPlan, expectedSample: 1000 });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(({ code }) => code === "UNDERPOWERED_HARM_RISK"));
});

test("post-hoc metrics and unregistered peeking are downgraded", () => {
  const posthoc = evaluateExperimentResult(validPlan, { primaryMetric: "clicks", decisionRulePassed: true, businessImpactRulePassed: true });
  assert.equal(posthoc.status, "downgraded");
  assert.equal(posthoc.claimClass, "association");
  const peeked = evaluateExperimentResult(validPlan, { primaryMetric: "paid-conversion", peeked: true, decisionRulePassed: true, businessImpactRulePassed: true });
  assert.equal(peeked.accepted, false);
  const accepted = evaluateExperimentResult(validPlan, { primaryMetric: "paid-conversion", decisionRulePassed: true, businessImpactRulePassed: true, multiplicityHandled: true });
  assert.equal(accepted.claimClass, "incremental-lift");
});

test("last-touch credit cannot be relabelled as incremental", () => {
  const credit = createAttributionRecord({ id: "a1", attributionClass: "credit", method: "last-touch", value: 5000, unit: "EUR", period: "month", sourceIds: ["analytics"] });
  assert.equal(credit.attributionClass, "credit");
  assert.throws(() => createAttributionRecord({ id: "a2", attributionClass: "incremental-lift", method: "last-touch", design: "randomized", value: 5000, unit: "EUR", period: "month", uncertainty: { lower: 100, upper: 9000 } }), /cannot be inferred/);
});

test("forecast comparison guards frames and hierarchy reconciliation is explicit", () => {
  const f = (id, amount, horizon = "Q4", grain = "region") => createForecastSnapshot({ id, asOf: "2026-09-01T00:00:00Z", horizon, grain, metricId: "revenue", value: { amount, currency: "EUR" }, modelVersion: "v1" });
  assert.equal(compareForecasts(f("a", 100), f("b", 120)).difference, 20);
  assert.equal(compareForecasts(f("a", 100), f("b", 120, "FY")).comparable, false);
  const reconciliation = reconcileForecastHierarchy({ parent: f("parent", 250, "Q4", "company"), children: [f("c1", 100), f("c2", 120)] });
  assert.equal(reconciliation.reconciledParent, 220);
  assert.equal(reconciliation.discrepancy, 30);
  assert.equal(createForecastBacktest({ forecastId: "a", forecast: 100, actual: 80, evaluatedAt: "2027-01-01" }).absolutePercentageError, 0.25);
});
