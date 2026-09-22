// SPDX-License-Identifier: Apache-2.0

const CLASSES = new Set(["credit", "association", "incremental-lift", "forecast"]);
const CAUSAL_DESIGNS = new Set(["randomized", "quasi-experimental"]);

export class AttributionValidationError extends Error {
  constructor(path, message) {
    super(`${path}: ${message}`);
    this.name = "AttributionValidationError";
    this.code = "ATTRIBUTION_VALIDATION_ERROR";
    this.path = path;
  }
}

export function createAttributionRecord(input) {
  if (!input || typeof input !== "object") throw new AttributionValidationError("input", "must be an object");
  if (!CLASSES.has(input.attributionClass)) throw new AttributionValidationError("attributionClass", "must be credit, association, incremental-lift, or forecast");
  if (!Number.isFinite(input.value)) throw new AttributionValidationError("value", "must be finite");
  if (input.attributionClass === "incremental-lift") {
    if (input.method === "last-touch" || !CAUSAL_DESIGNS.has(input.design)) {
      throw new AttributionValidationError("attributionClass", "incremental lift requires a causal design and cannot be inferred from last-touch credit");
    }
    if (!input.uncertainty || !Number.isFinite(input.uncertainty.lower) || !Number.isFinite(input.uncertainty.upper)) {
      throw new AttributionValidationError("uncertainty", "incremental lift requires finite uncertainty bounds");
    }
  }
  return Object.freeze({
    contractVersion: "1.0.0",
    kind: "AttributionRecord",
    id: String(input.id),
    attributionClass: input.attributionClass,
    method: String(input.method),
    design: input.design ?? null,
    value: input.value,
    unit: String(input.unit),
    period: String(input.period),
    sourceIds: Object.freeze([...(input.sourceIds ?? [])]),
    uncertainty: input.uncertainty ? Object.freeze({ ...input.uncertainty }) : null
  });
}

function comparableKey(snapshot) {
  return [snapshot.asOf, snapshot.horizon, snapshot.grain, snapshot.metricId, snapshot.value?.currency].join("|");
}

export function compareForecasts(left, right) {
  if (comparableKey(left) !== comparableKey(right)) {
    return Object.freeze({ comparable: false, reason: "Forecasts differ in as-of date, horizon, grain, metric, or currency." });
  }
  return Object.freeze({ comparable: true, difference: right.value.amount - left.value.amount, unit: left.value.currency });
}

export function createForecastBacktest({ forecastId, actual, forecast, evaluatedAt }) {
  if (!Number.isFinite(actual) || !Number.isFinite(forecast)) throw new AttributionValidationError("backtest", "actual and forecast must be finite");
  const error = forecast - actual;
  return Object.freeze({
    contractVersion: "1.0.0",
    kind: "ForecastBacktest",
    forecastId,
    evaluatedAt,
    actual,
    forecast,
    error,
    absoluteError: Math.abs(error),
    absolutePercentageError: actual === 0 ? null : Math.abs(error / actual),
    limitation: actual === 0 ? "Percentage error is undefined when actual is zero." : null
  });
}

export function reconcileForecastHierarchy({ parent, children, method = "bottom-up" }) {
  if (!parent || !Array.isArray(children) || children.length === 0) throw new AttributionValidationError("hierarchy", "parent and children are required");
  const childTotal = children.reduce((sum, child) => sum + child.value.amount, 0);
  const sameCurrency = children.every((child) => child.value.currency === parent.value.currency);
  const sameFrame = children.every((child) => child.asOf === parent.asOf && child.horizon === parent.horizon && child.metricId === parent.metricId);
  if (!sameCurrency || !sameFrame) throw new AttributionValidationError("hierarchy", "children must share currency, as-of date, horizon, and metric with parent");
  return Object.freeze({
    method,
    originalParent: parent.value.amount,
    childTotal,
    discrepancy: parent.value.amount - childTotal,
    reconciledParent: method === "bottom-up" ? childTotal : parent.value.amount,
    reconciled: parent.value.amount === childTotal
  });
}
