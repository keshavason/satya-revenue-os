// SPDX-License-Identifier: Apache-2.0

export class EconomicValidationError extends Error {
  constructor(path, message, code = "ECONOMIC_VALIDATION_ERROR") {
    super(`${path}: ${message}`);
    this.name = "EconomicValidationError";
    this.code = code;
    this.path = path;
  }
}

const EVIDENCE = new Set(["observed", "modelled"]);

function measure(input, name, { units, period = null, rate = false, positive = false } = {}) {
  if (input == null) return null;
  if (typeof input !== "object" || Array.isArray(input)) {
    throw new EconomicValidationError(`inputs.${name}`, "must be a typed measure");
  }
  if (!Number.isFinite(input.value)) {
    throw new EconomicValidationError(`inputs.${name}.value`, "must be finite");
  }
  if (positive && input.value < 0) {
    throw new EconomicValidationError(`inputs.${name}.value`, "cannot be negative");
  }
  if (!EVIDENCE.has(input.evidence)) {
    throw new EconomicValidationError(`inputs.${name}.evidence`, "must be observed or modelled");
  }
  if (units && !units.includes(input.unit)) {
    throw new EconomicValidationError(`inputs.${name}.unit`, `must be one of: ${units.join(", ")}`);
  }
  if (period && input.period !== period) {
    throw new EconomicValidationError(`inputs.${name}.period`, `must equal ${period}`);
  }
  let value = input.value;
  if (rate) {
    if (input.unit === "percent") value /= 100;
    if (value < 0 || value > 1) {
      throw new EconomicValidationError(`inputs.${name}.value`, "rate must be between 0 and 1");
    }
  }
  return Object.freeze({ ...input, value });
}

function divide(numerator, denominator, path) {
  if (denominator === 0) throw new EconomicValidationError(path, "denominator cannot be zero", "INVALID_DENOMINATOR");
  return numerator / denominator;
}

function calculation(id, value, unit, formula, names, typed, period = null) {
  const evidence = names.some((name) => typed[name]?.evidence === "modelled") ? "modelled" : "observed";
  return Object.freeze({ id, value, unit, period, formula, inputs: Object.freeze(names), evidence });
}

function sensitivityFor(calculationResult, pct = 0.1) {
  if (!calculationResult || !Number.isFinite(calculationResult.value)) return null;
  return Object.freeze({
    metric: calculationResult.id,
    change: pct,
    low: calculationResult.value * (1 - pct),
    base: calculationResult.value,
    high: calculationResult.value * (1 + pct),
    note: "One-driver local range; not a probabilistic confidence interval."
  });
}

export function calculateUnitEconomics(input) {
  if (!input || typeof input !== "object") throw new EconomicValidationError("input", "must be an object");
  const period = input.period ?? "month";
  const currency = (input.currency ?? "EUR").toUpperCase();
  const source = input.inputs ?? {};
  const typed = {};
  const money = ["currency", currency, currency.toLowerCase()];
  const specs = {
    acquisitionSpendIncremental: { units: money, period, positive: true },
    acquisitionSpendFullyLoaded: { units: money, period, positive: true },
    newCustomers: { units: ["customers"], period, positive: true },
    revenue: { units: money, period, positive: true },
    cogs: { units: money, period, positive: true },
    variableCosts: { units: money, period, positive: true },
    deliveryCosts: { units: money, period, positive: true },
    averageRevenuePerCustomer: { units: ["currency/customer/period"], period, positive: true },
    churnRate: { units: ["ratio", "percent"], period, rate: true },
    retentionRate: { units: ["ratio", "percent"], period, rate: true },
    expansionRate: { units: ["ratio", "percent"], period, rate: true },
    retentionHorizonPeriods: { units: ["periods"], positive: true },
    visitors: { units: ["people", "sessions", "leads"], period, positive: true },
    convertedCustomers: { units: ["customers"], period, positive: true },
    pipelineValue: { units: money, period, positive: true },
    activeOpportunities: { units: ["opportunities"], period, positive: true },
    wonDeals: { units: ["deals"], period, positive: true },
    totalDeals: { units: ["deals"], period, positive: true },
    salesCycleDays: { units: ["days"], positive: true },
    cashInflows: { units: money, period, positive: true },
    cashOutflows: { units: money, period, positive: true },
    fixedCosts: { units: money, period, positive: true },
    unitContribution: { units: ["currency/unit"], positive: false }
  };
  for (const [name, spec] of Object.entries(specs)) typed[name] = measure(source[name], name, spec);

  if (typed.churnRate && typed.retentionRate && Math.abs(typed.churnRate.value + typed.retentionRate.value - 1) > 1e-9) {
    throw new EconomicValidationError("inputs.retentionRate", "retention and churn must sum to 1 for the same period");
  }
  if (typed.retentionHorizonPeriods?.evidence === "modelled" && typed.retentionHorizonPeriods.bounded !== true) {
    throw new EconomicValidationError("inputs.retentionHorizonPeriods.bounded", "modelled retention horizon must be explicitly bounded");
  }

  const values = {};
  if (typed.acquisitionSpendIncremental && typed.newCustomers) {
    values.cacIncremental = calculation("cac.incremental", divide(typed.acquisitionSpendIncremental.value, typed.newCustomers.value, "cac.incremental"), `${currency}/customer`, "acquisitionSpendIncremental / newCustomers", ["acquisitionSpendIncremental", "newCustomers"], typed, period);
  }
  if (typed.acquisitionSpendFullyLoaded && typed.newCustomers) {
    values.cacFullyLoaded = calculation("cac.fully-loaded", divide(typed.acquisitionSpendFullyLoaded.value, typed.newCustomers.value, "cac.fully-loaded"), `${currency}/customer`, "acquisitionSpendFullyLoaded / newCustomers", ["acquisitionSpendFullyLoaded", "newCustomers"], typed, period);
  }
  if (typed.revenue && typed.cogs) {
    values.grossMargin = calculation("margin.gross", divide(typed.revenue.value - typed.cogs.value, typed.revenue.value, "margin.gross"), "ratio", "(revenue - cogs) / revenue", ["revenue", "cogs"], typed, period);
    const contributionCosts = typed.cogs.value + (typed.variableCosts?.value ?? 0) + (typed.deliveryCosts?.value ?? 0);
    const names = ["revenue", "cogs", ...(typed.variableCosts ? ["variableCosts"] : []), ...(typed.deliveryCosts ? ["deliveryCosts"] : [])];
    values.contributionMargin = calculation("margin.contribution", divide(typed.revenue.value - contributionCosts, typed.revenue.value, "margin.contribution"), "ratio", "(revenue - cogs - variableCosts - deliveryCosts) / revenue", names, typed, period);
  }
  if (typed.convertedCustomers && typed.visitors) {
    values.conversionRate = calculation("conversion", divide(typed.convertedCustomers.value, typed.visitors.value, "conversion"), "ratio", "convertedCustomers / visitors", ["convertedCustomers", "visitors"], typed, period);
  }
  if (typed.retentionRate) values.retentionRate = calculation("retention", typed.retentionRate.value, "ratio", "declared retention", ["retentionRate"], typed, period);
  if (typed.churnRate) values.churnRate = calculation("churn", typed.churnRate.value, "ratio", "declared churn", ["churnRate"], typed, period);
  if (typed.expansionRate) values.expansionRate = calculation("expansion", typed.expansionRate.value, "ratio", "declared expansion", ["expansionRate"], typed, period);
  if (typed.wonDeals && typed.totalDeals) {
    values.closeRate = calculation("close-rate", divide(typed.wonDeals.value, typed.totalDeals.value, "close-rate"), "ratio", "wonDeals / totalDeals", ["wonDeals", "totalDeals"], typed, period);
  }
  if (typed.revenue && typed.wonDeals) {
    values.averageDealSize = calculation("average-deal-size", divide(typed.revenue.value, typed.wonDeals.value, "average-deal-size"), `${currency}/deal`, "revenue / wonDeals", ["revenue", "wonDeals"], typed, period);
  }
  if (typed.pipelineValue && typed.activeOpportunities && typed.wonDeals && typed.totalDeals && typed.salesCycleDays) {
    const closeRate = divide(typed.wonDeals.value, typed.totalDeals.value, "pipeline-velocity.close-rate");
    const averageOpportunity = divide(typed.pipelineValue.value, typed.activeOpportunities.value, "pipeline-velocity.average-opportunity");
    values.pipelineVelocity = calculation("pipeline-velocity", divide(typed.activeOpportunities.value * averageOpportunity * closeRate, typed.salesCycleDays.value, "pipeline-velocity"), `${currency}/day`, "opportunities * average opportunity value * close rate / sales cycle days", ["pipelineValue", "activeOpportunities", "wonDeals", "totalDeals", "salesCycleDays"], typed, period);
  }
  if (typed.salesCycleDays) values.salesCycle = calculation("sales-cycle", typed.salesCycleDays.value, "days", "declared sales cycle", ["salesCycleDays"], typed);
  if (typed.cashInflows && typed.cashOutflows) {
    values.cashFlow = calculation("cash-flow", typed.cashInflows.value - typed.cashOutflows.value, currency, "cashInflows - cashOutflows", ["cashInflows", "cashOutflows"], typed, period);
  }
  if (typed.fixedCosts && typed.unitContribution) {
    if (typed.unitContribution.value <= 0) throw new EconomicValidationError("inputs.unitContribution.value", "must be greater than zero for break-even");
    values.breakEvenUnits = calculation("break-even", typed.fixedCosts.value / typed.unitContribution.value, "units", "fixedCosts / unitContribution", ["fixedCosts", "unitContribution"], typed, period);
  }

  const missingValues = [];
  if (typed.averageRevenuePerCustomer && values.grossMargin) {
    const netChurn = typed.churnRate ? typed.churnRate.value - (typed.expansionRate?.value ?? 0) : null;
    if (netChurn != null && netChurn > 0 && (typed.churnRate.evidence === "observed" || typed.retentionHorizonPeriods?.bounded)) {
      values.ltv = calculation("ltv", typed.averageRevenuePerCustomer.value * values.grossMargin.value / netChurn, `${currency}/customer`, "averageRevenuePerCustomer * grossMargin / (churnRate - expansionRate)", ["averageRevenuePerCustomer", "churnRate", ...(typed.expansionRate ? ["expansionRate"] : [])], typed, period);
    } else if (typed.retentionHorizonPeriods && (typed.retentionHorizonPeriods.evidence === "observed" || typed.retentionHorizonPeriods.bounded)) {
      values.ltv = calculation("ltv", typed.averageRevenuePerCustomer.value * values.grossMargin.value * typed.retentionHorizonPeriods.value, `${currency}/customer`, "averageRevenuePerCustomer * grossMargin * retentionHorizonPeriods", ["averageRevenuePerCustomer", "retentionHorizonPeriods"], typed, period);
    } else {
      missingValues.push("observed churn/retention horizon or a declared bounded retention assumption");
    }
  }
  const preferredCac = values.cacFullyLoaded ?? values.cacIncremental;
  if (preferredCac && typed.averageRevenuePerCustomer && values.contributionMargin?.value > 0) {
    values.payback = calculation("payback", preferredCac.value / (typed.averageRevenuePerCustomer.value * values.contributionMargin.value), "periods", "CAC / contribution per customer per period", [preferredCac === values.cacFullyLoaded ? "acquisitionSpendFullyLoaded" : "acquisitionSpendIncremental", "averageRevenuePerCustomer", "revenue", "cogs"], typed, period);
  }

  const assumptions = Object.entries(typed).filter(([, value]) => value?.evidence === "modelled").map(([name, value]) => Object.freeze({ name, value: value.value, unit: value.unit, bounded: value.bounded ?? null }));
  const observedInputs = Object.entries(typed).filter(([, value]) => value?.evidence === "observed").map(([name]) => name);
  const modelledInputs = assumptions.map(({ name }) => name);
  const negativeContribution = values.contributionMargin?.value < 0;
  const recommendation = negativeContribution
    ? Object.freeze({ decision: "do-not-proceed-on-revenue-alone", reason: "Declared costs produce negative contribution margin." })
    : Object.freeze({ decision: missingValues.length ? "insufficient-information" : "no-automatic-action", reason: missingValues.length ? "Material inputs are missing." : "Calculations do not independently authorize a commercial action." });
  return Object.freeze({
    contractVersion: "1.0.0",
    kind: "EconomicResult",
    status: missingValues.length ? "insufficient-information" : "complete",
    currency,
    period,
    values: Object.freeze(values),
    observedInputs: Object.freeze(observedInputs),
    modelledInputs: Object.freeze(modelledInputs),
    assumptions: Object.freeze(assumptions),
    missingValues: Object.freeze(missingValues),
    sensitivity: Object.freeze(Object.values(values).map((item) => sensitivityFor(item, input.sensitivityPct ?? 0.1)).filter(Boolean)),
    confidenceLimitations: Object.freeze([
      "Sensitivity ranges are deterministic local perturbations, not statistical intervals.",
      ...(modelledInputs.length ? ["At least one result depends on modelled input."] : [])
    ]),
    recommendation
  });
}
