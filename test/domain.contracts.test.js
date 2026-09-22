// SPDX-License-Identifier: Apache-2.0
import test from "node:test";
import assert from "node:assert/strict";
import {
  DomainValidationError,
  createParty,
  createMetricDefinition,
  createLifecycleTransition,
  reconstructLifecycleAt,
  createForecastSnapshot,
  createDecisionRecord
} from "../src/domain/index.js";

test("commercial contracts retain explicit type and version", () => {
  const party = createParty({ id: "party-1", partyType: "buying-group", displayName: "Plant buying group", tenantId: "tenant-a" });
  assert.equal(party.kind, "Party");
  assert.equal(party.contractVersion, "1.0.0");
  assert.throws(() => createParty({ id: "p", partyType: "lead", displayName: "Wrong", tenantId: "t" }), DomainValidationError);
});

test("metric definitions require currency where their declared unit is currency", () => {
  assert.throws(() => createMetricDefinition({
    id: "metric-1", name: "Revenue", formula: "sum(revenue)", unit: "currency", period: "month",
    grain: "account", source: "ledger", version: "1", owner: "finance"
  }), /required for currency metrics/);
});

test("lifecycle supports UNKNOWN and reconstructs the state known at a historical instant", () => {
  const allowed = ["qualified", "quoted", "won"];
  const transitions = [
    createLifecycleTransition({ id: "t3", subjectId: "o1", from: "quoted", to: "won", occurredAt: "2026-03-01T00:00:00Z", sourceId: "crm-3" }, allowed),
    createLifecycleTransition({ id: "t1", subjectId: "o1", from: "UNKNOWN", to: "qualified", occurredAt: "2026-01-01T00:00:00Z", sourceId: "crm-1" }, allowed),
    createLifecycleTransition({ id: "t2", subjectId: "o1", from: "qualified", to: "quoted", occurredAt: "2026-02-01T00:00:00Z", sourceId: "crm-2" }, allowed)
  ];
  assert.equal(reconstructLifecycleAt(transitions, "2026-02-15T00:00:00Z", allowed).state, "quoted");
  assert.equal(reconstructLifecycleAt([], "2026-02-15T00:00:00Z", allowed).state, "UNKNOWN");
  assert.throws(() => createLifecycleTransition({ id: "bad", subjectId: "o1", to: "imaginary", occurredAt: "2026-01-01", sourceId: "x" }, allowed), /unknown state/);
});

test("forecast and decision contracts retain review context", () => {
  const forecast = createForecastSnapshot({ id: "f1", asOf: "2026-09-01T00:00:00Z", horizon: "Q4", grain: "region", metricId: "revenue", value: { amount: 100, currency: "eur" }, modelVersion: "baseline-1" });
  const decision = createDecisionRecord({ id: "d1", decidedAt: "2026-09-02T00:00:00Z", decision: "no-action", alternatives: ["run", "no-action"], evidenceIds: [forecast.id], reversible: true, expectedOutcome: "Avoid unsupported commitment", wouldChangeDecision: ["Observed demand evidence"] });
  assert.equal(forecast.value.currency, "EUR");
  assert.equal(decision.approver, null);
  assert.deepEqual(decision.wouldChangeDecision, ["Observed demand evidence"]);
});
