// SPDX-License-Identifier: Apache-2.0
import { readFile } from "node:fs/promises";

const REQUIRED_ARRAYS = [
  "lifecycleStates", "metricDefinitions", "constraints", "channels",
  "complianceNotes", "economicDefaults", "requiredEvidence", "unsupportedAssumptions"
];

export function validateAdapter(adapter) {
  const errors = [];
  if (!adapter || typeof adapter !== "object" || Array.isArray(adapter)) {
    return Object.freeze({ valid: false, errors: [{ path: "adapter", code: "TYPE", message: "must be an object" }] });
  }
  for (const field of ["contractVersion", "id", "version", "name", "vertical", "economicUnit", "salesMotion"]) {
    if (typeof adapter[field] !== "string" || adapter[field].trim() === "") errors.push({ path: `adapter.${field}`, code: "REQUIRED", message: "must be a non-empty string" });
  }
  if (adapter.contractVersion !== "1.0.0") errors.push({ path: "adapter.contractVersion", code: "CONTRACT_VERSION", message: "must equal 1.0.0" });
  if (!/^[a-z][a-z0-9-]*$/.test(adapter.vertical ?? "")) errors.push({ path: "adapter.vertical", code: "VERTICAL_ID", message: "must be a lowercase stable identifier" });
  for (const field of REQUIRED_ARRAYS) {
    if (!Array.isArray(adapter[field]) || adapter[field].length === 0) errors.push({ path: `adapter.${field}`, code: "REQUIRED", message: "must be a non-empty array" });
  }
  if (!adapter.lifecycleStates?.includes("UNKNOWN")) errors.push({ path: "adapter.lifecycleStates", code: "UNKNOWN_REQUIRED", message: "must include UNKNOWN" });
  const stateSet = new Set(adapter.lifecycleStates ?? []);
  if (stateSet.size !== (adapter.lifecycleStates?.length ?? 0)) errors.push({ path: "adapter.lifecycleStates", code: "DUPLICATE", message: "states must be unique" });
  const metricIds = new Set();
  for (const [index, metric] of (adapter.metricDefinitions ?? []).entries()) {
    for (const field of ["id", "unit", "formula", "period", "grain"]) {
      if (typeof metric[field] !== "string" || metric[field] === "") errors.push({ path: `adapter.metricDefinitions[${index}].${field}`, code: "REQUIRED", message: "must be a non-empty string" });
    }
    if (metricIds.has(metric.id)) errors.push({ path: `adapter.metricDefinitions[${index}].id`, code: "DUPLICATE", message: "metric id must be unique" });
    metricIds.add(metric.id);
  }
  for (const [index, item] of (adapter.economicDefaults ?? []).entries()) {
    if (item.evidence !== "modelled" || item.bounded !== true || !item.asOf || !item.source) {
      errors.push({ path: `adapter.economicDefaults[${index}]`, code: "UNBOUNDED_DEFAULT", message: "defaults must be bounded, dated, sourced, and labelled modelled" });
    }
  }
  if (!adapter.planningProfile || typeof adapter.planningProfile !== "object") {
    errors.push({ path: "adapter.planningProfile", code: "REQUIRED", message: "must be an object" });
  } else {
    if (!Number.isFinite(adapter.planningProfile.typicalSalesCycleDays) || adapter.planningProfile.typicalSalesCycleDays < 0) errors.push({ path: "adapter.planningProfile.typicalSalesCycleDays", code: "RANGE", message: "must be a non-negative finite number" });
    if (!metricIds.has(adapter.planningProfile.primaryDecisionMetric)) errors.push({ path: "adapter.planningProfile.primaryDecisionMetric", code: "UNKNOWN_METRIC", message: "must reference a declared metric" });
  }
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors.map(Object.freeze)) });
}

export function validateAdapterFixture(adapter, fixture) {
  const base = validateAdapter(adapter);
  const errors = [...base.errors];
  if (!fixture || typeof fixture !== "object") errors.push({ path: "fixture", code: "TYPE", message: "must be an object" });
  else {
    for (const field of ["id", "tenantId", "asOf", "goal", "sourceNote"]) {
      if (typeof fixture[field] !== "string" || fixture[field] === "") errors.push({ path: `fixture.${field}`, code: "REQUIRED", message: "must be a non-empty string" });
    }
    if (fixture.asOf && !Number.isFinite(Date.parse(fixture.asOf))) errors.push({ path: "fixture.asOf", code: "DATE_TIME", message: "must be an ISO-8601 timestamp" });
    const metricIds = new Set((adapter.metricDefinitions ?? []).map(({ id }) => id));
    for (const id of Object.keys(fixture.metrics ?? {})) {
      if (!metricIds.has(id)) errors.push({ path: `fixture.metrics.${id}`, code: "INCOMPATIBLE_METRIC_MODEL", message: `${id} is not defined by the ${adapter.vertical} adapter` });
    }
    if (fixture.lifecycleState && !adapter.lifecycleStates?.includes(fixture.lifecycleState)) {
      errors.push({ path: "fixture.lifecycleState", code: "UNKNOWN_STATE", message: `${fixture.lifecycleState} is not a valid ${adapter.vertical} state` });
    }
  }
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors.map(Object.freeze)) });
}

export async function loadAdapter(path) {
  const adapter = JSON.parse(await readFile(path, "utf8"));
  const validation = validateAdapter(adapter);
  if (!validation.valid) {
    const error = new Error(`Invalid adapter ${path}: ${validation.errors.map(({ path: p, message }) => `${p} ${message}`).join("; ")}`);
    error.name = "AdapterValidationError";
    error.code = "ADAPTER_VALIDATION_ERROR";
    error.errors = validation.errors;
    throw error;
  }
  return Object.freeze(adapter);
}

export function composeCommercialPlan(goal, adapter, fixture) {
  const fixtureValidation = validateAdapterFixture(adapter, fixture);
  if (!fixtureValidation.valid) {
    return Object.freeze({ status: "abstained", reason: "invalid-adapter-input", errors: fixtureValidation.errors });
  }
  if (!goal || typeof goal.description !== "string" || !Number.isFinite(goal.targetRevenueIncreasePct) || goal.targetRevenueIncreasePct <= 0) {
    return Object.freeze({ status: "abstained", reason: "invalid-goal", errors: Object.freeze([{ path: "goal", code: "INVALID_GOAL", message: "description and a positive targetRevenueIncreasePct are required" }]) });
  }
  const metricIds = adapter.metricDefinitions.map(({ id }) => id);
  const longCycle = (adapter.planningProfile?.typicalSalesCycleDays ?? 0) >= 90;
  const capacityBound = adapter.constraints.some((item) => /capacity|inventory|utilization|room|labor|lead time/i.test(item));
  const firstChannel = adapter.channels[0];
  const steps = [
    Object.freeze({ type: "evidence-check", action: `Verify ${adapter.requiredEvidence[0]}`, authority: "read", metricIds: Object.freeze(metricIds.slice(0, 2)) }),
    Object.freeze({ type: "economics", action: `Model target per ${adapter.economicUnit} including contribution margin`, authority: "recommend", metricIds: Object.freeze(metricIds.filter((id) => /margin|contribution|utilization|retention|yield/.test(id)).slice(0, 3)) }),
    Object.freeze({
      type: longCycle ? "pipeline-review" : "bounded-experiment",
      action: longCycle
        ? `Improve qualification and stage evidence across a ${adapter.planningProfile.typicalSalesCycleDays}-day planning horizon`
        : `Pre-register a reversible ${firstChannel} experiment with adapter guardrails`,
      authority: "recommend",
      channel: firstChannel
    }),
    ...(capacityBound ? [Object.freeze({ type: "constraint-check", action: `Check operational capacity before recommending demand growth: ${adapter.constraints[0]}`, authority: "read" })] : [])
  ];
  return Object.freeze({
    contractVersion: "1.0.0",
    kind: "CommercialPlan",
    status: "proposed",
    goal: Object.freeze({ ...goal }),
    adapter: Object.freeze({ id: adapter.id, version: adapter.version, vertical: adapter.vertical }),
    economicUnit: adapter.economicUnit,
    lifecycle: Object.freeze([...adapter.lifecycleStates]),
    steps: Object.freeze(steps),
    constraints: Object.freeze([...adapter.constraints]),
    unsupportedAssumptions: Object.freeze([...adapter.unsupportedAssumptions]),
    effectBoundary: "recommend-only"
  });
}
