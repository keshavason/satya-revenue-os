// SPDX-License-Identifier: Apache-2.0
import test from "node:test";
import assert from "node:assert/strict";
import { calculateUnitEconomics, EconomicValidationError } from "../src/domain/index.js";

const m = (value, unit, period = "month", evidence = "observed", extra = {}) => ({ value, unit, period, evidence, ...extra });

test("unit economics distinguish incremental and fully-loaded CAC and expose formulas", () => {
  const result = calculateUnitEconomics({ currency: "EUR", period: "month", inputs: {
    acquisitionSpendIncremental: m(1000, "EUR"), acquisitionSpendFullyLoaded: m(1600, "EUR"), newCustomers: m(20, "customers"),
    revenue: m(10000, "EUR"), cogs: m(2000, "EUR"), variableCosts: m(1000, "EUR"), deliveryCosts: m(500, "EUR"),
    averageRevenuePerCustomer: m(100, "currency/customer/period"), churnRate: m(0.05, "ratio"), expansionRate: m(0.01, "ratio"),
    visitors: m(1000, "people"), convertedCustomers: m(20, "customers"), wonDeals: m(8, "deals"), totalDeals: m(20, "deals"),
    pipelineValue: m(40000, "EUR"), activeOpportunities: m(20, "opportunities"), salesCycleDays: m(40, "days", undefined),
    cashInflows: m(12000, "EUR"), cashOutflows: m(9000, "EUR"), fixedCosts: m(5000, "EUR"),
    unitContribution: m(25, "currency/unit", undefined)
  }});
  assert.equal(result.values.cacIncremental.value, 50);
  assert.equal(result.values.cacFullyLoaded.value, 80);
  assert.equal(result.values.grossMargin.value, 0.8);
  assert.equal(result.values.contributionMargin.value, 0.65);
  assert.equal(result.values.ltv.value, 2000);
  assert.equal(result.values.closeRate.value, 0.4);
  assert.equal(result.values.cashFlow.value, 3000);
  assert.equal(result.values.breakEvenUnits.value, 200);
  assert.ok(result.sensitivity.length > 5);
  assert.equal(result.recommendation.decision, "no-automatic-action");
});

test("LTV abstains without observed retention evidence or a bounded assumption", () => {
  const result = calculateUnitEconomics({ currency: "EUR", period: "month", inputs: {
    revenue: m(10000, "EUR"), cogs: m(2000, "EUR"), averageRevenuePerCustomer: m(100, "currency/customer/period")
  }});
  assert.equal(result.status, "insufficient-information");
  assert.match(result.missingValues[0], /retention/);
  assert.equal(result.values.ltv, undefined);
});

test("a bounded modelled retention horizon is explicit in assumptions", () => {
  const result = calculateUnitEconomics({ currency: "EUR", period: "month", inputs: {
    revenue: m(10000, "EUR"), cogs: m(2000, "EUR"), averageRevenuePerCustomer: m(100, "currency/customer/period"),
    retentionHorizonPeriods: m(12, "periods", undefined, "modelled", { bounded: true })
  }});
  assert.equal(result.values.ltv.value, 960);
  assert.deepEqual(result.modelledInputs, ["retentionHorizonPeriods"]);
  assert.equal(result.values.ltv.evidence, "modelled");
});

test("negative contribution margin blocks revenue-only recommendation", () => {
  const result = calculateUnitEconomics({ currency: "EUR", period: "month", inputs: {
    revenue: m(10000, "EUR"), cogs: m(8000, "EUR"), variableCosts: m(3500, "EUR")
  }});
  assert.equal(result.values.contributionMargin.value, -0.15);
  assert.equal(result.recommendation.decision, "do-not-proceed-on-revenue-alone");
});

test("units, periods, rates, and denominators fail closed", () => {
  assert.throws(() => calculateUnitEconomics({ currency: "EUR", period: "month", inputs: { revenue: m(10, "USD") } }), EconomicValidationError);
  assert.throws(() => calculateUnitEconomics({ currency: "EUR", period: "month", inputs: { revenue: m(10, "EUR", "year") } }), /must equal month/);
  assert.throws(() => calculateUnitEconomics({ inputs: { churnRate: m(1.2, "ratio") } }), /between 0 and 1/);
  assert.throws(() => calculateUnitEconomics({ inputs: { acquisitionSpendIncremental: m(10, "EUR"), newCustomers: m(0, "customers") } }), /denominator cannot be zero/);
});
