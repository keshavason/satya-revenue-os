// SPDX-License-Identifier: Apache-2.0
import { assertContractVersion, assertFields, ValidationError } from "./index.js";

export const CLAIM_CLASSES = Object.freeze(["observed_fact", "external_datum", "inference", "hypothesis", "opinion", "prediction", "recommendation"]);
export const EVIDENCE_STATES = Object.freeze(["unknown", "declared", "observed", "tested", "verified", "blocked"]);
export const EFFECT_STATES = Object.freeze(["not-started", "dispatched", "succeeded", "failed", "indeterminate", "compensated"]);
export const MEMORY_STATES = Object.freeze(["candidate", "active", "superseded", "invalidated", "expired"]);

function assertString(value, path, { nonempty = true } = {}) {
  if (typeof value !== "string" || (nonempty && !value.trim())) throw new ValidationError("TYPE_STRING", path, "Expected a non-empty string");
}

function assertArray(value, path) {
  if (!Array.isArray(value)) throw new ValidationError("TYPE_ARRAY", path, "Expected an array");
}

function assertEnum(value, values, path) {
  if (!values.includes(value)) throw new ValidationError("ENUM", path, `Expected one of: ${values.join(", ")}`, { value, values });
}

function assertInstant(value, path) {
  assertString(value, path);
  if (!Number.isFinite(Date.parse(value))) throw new ValidationError("DATE_TIME", path, "Expected an ISO date-time");
}

function assertConfidence(value, path) {
  if (typeof value !== "number" || value < 0 || value > 1) throw new ValidationError("CONFIDENCE_RANGE", path, "Confidence must be between 0 and 1");
}

export function validateSkillManifest(value) {
  const required = ["contractVersion", "id", "version", "inputSchema", "outputSchema", "preconditions", "postconditions", "failureCodes", "evidence", "permissions", "effects", "approval", "cost", "compatibility", "entrypoint"];
  assertFields(value, required);
  assertContractVersion(value.contractVersion);
  assertString(value.id, "$/id");
  if (!/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/.test(value.id)) throw new ValidationError("SKILL_ID", "$/id", "Skill id must be stable lowercase dotted or hyphenated text");
  assertString(value.version, "$/version");
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(value.version)) throw new ValidationError("SEMVER", "$/version", "Skill version must be semantic versioning");
  for (const name of ["inputSchema", "outputSchema", "entrypoint"]) assertString(value[name], `$/${name}`);
  for (const name of ["preconditions", "postconditions", "failureCodes", "evidence", "permissions", "effects", "compatibility"]) assertArray(value[name], `$/${name}`);
  if (!value.effects.length) throw new ValidationError("EFFECTS_AMBIGUOUS", "$/effects", "Effects must explicitly include 'none' for a pure skill");
  if (!value.permissions.length) throw new ValidationError("PERMISSIONS_AMBIGUOUS", "$/permissions", "Permissions must explicitly include 'none' for an unprivileged skill");
  if (!value.approval || typeof value.approval !== "object") throw new ValidationError("APPROVAL_POLICY", "$/approval", "Approval policy is required");
  if (!value.cost || typeof value.cost !== "object") throw new ValidationError("COST_HINT", "$/cost", "Cost hints are required");
  return value;
}

export function validateClaim(value) {
  assertFields(value, ["contractVersion", "id", "text", "class", "evidenceState", "sources", "confidence", "createdAt", "validity", "contradictions", "derivedFrom"]);
  assertContractVersion(value.contractVersion);
  assertString(value.id, "$/id"); assertString(value.text, "$/text");
  assertEnum(value.class, CLAIM_CLASSES, "$/class"); assertEnum(value.evidenceState, EVIDENCE_STATES, "$/evidenceState");
  assertArray(value.sources, "$/sources"); assertArray(value.contradictions, "$/contradictions"); assertArray(value.derivedFrom, "$/derivedFrom");
  assertConfidence(value.confidence, "$/confidence"); assertInstant(value.createdAt, "$/createdAt");
  if (!value.validity || typeof value.validity !== "object") throw new ValidationError("VALIDITY", "$/validity", "Validity object is required");
  return value;
}

export function validateEvidence(value) {
  assertFields(value, ["contractVersion", "id", "state", "source", "capturedAt", "contentHash", "trust", "supports", "contradicts"]);
  assertContractVersion(value.contractVersion); assertString(value.id, "$/id"); assertEnum(value.state, EVIDENCE_STATES, "$/state");
  assertString(value.source, "$/source"); assertInstant(value.capturedAt, "$/capturedAt"); assertString(value.contentHash, "$/contentHash");
  assertEnum(value.trust, ["trusted", "untrusted", "quarantined"], "$/trust"); assertArray(value.supports, "$/supports"); assertArray(value.contradicts, "$/contradicts");
  return value;
}

export function validateRunEvent(value) {
  assertFields(value, ["contractVersion", "runId", "sequence", "type", "occurredAt", "payload", "previousHash"]);
  assertContractVersion(value.contractVersion);
  assertString(value.runId, "$/runId"); assertString(value.type, "$/type"); assertInstant(value.occurredAt, "$/occurredAt");
  if (!Number.isSafeInteger(value.sequence) || value.sequence < 0) throw new ValidationError("EVENT_SEQUENCE", "$/sequence", "Sequence must be a non-negative safe integer");
  if (value.previousHash !== null) assertString(value.previousHash, "$/previousHash");
  return value;
}

export function validateApproval(value) {
  assertFields(value, ["contractVersion", "id", "tenantId", "operationHash", "destination", "fields", "amount", "expiresAt", "maxUses", "uses", "status"]);
  assertContractVersion(value.contractVersion);
  for (const key of ["id", "tenantId", "operationHash", "destination", "status"]) assertString(value[key], `$/${key}`);
  assertArray(value.fields, "$/fields"); assertInstant(value.expiresAt, "$/expiresAt");
  if (!Number.isSafeInteger(value.maxUses) || value.maxUses < 1 || !Number.isSafeInteger(value.uses) || value.uses < 0) throw new ValidationError("APPROVAL_USE_COUNT", "$/uses", "Approval use counts must be non-negative integers and maxUses positive");
  return value;
}

export function validateEffectRequest(value) {
  const fields = ["contractVersion", "operationId", "tenantId", "capability", "effect", "destination", "fields", "arguments", "amount", "sourceTrust", "provenanceId", "approvalId"];
  assertFields(value, fields, fields);
  assertContractVersion(value.contractVersion);
  for (const key of ["operationId", "tenantId", "capability", "effect", "destination", "provenanceId"]) assertString(value[key], `$/${key}`);
  assertEnum(value.sourceTrust, ["trusted", "untrusted", "quarantined"], "$/sourceTrust");
  assertArray(value.fields, "$/fields");
  return value;
}

export function validateEffectReceipt(value) {
  const required = ["contractVersion", "operationId", "tenantId", "state", "attempt", "requestedAt", "updatedAt", "requestHash", "dryRun"];
  const allowed = [...required, "result", "failure", "compensation"];
  assertFields(value, required, allowed);
  assertContractVersion(value.contractVersion); assertEnum(value.state, EFFECT_STATES, "$/state");
  assertString(value.operationId, "$/operationId"); assertString(value.tenantId, "$/tenantId"); assertString(value.requestHash, "$/requestHash");
  assertInstant(value.requestedAt, "$/requestedAt"); assertInstant(value.updatedAt, "$/updatedAt");
  return value;
}

export function validateMemoryRecord(value) {
  assertFields(value, ["contractVersion", "id", "type", "tenantId", "purpose", "source", "actor", "sensitivity", "confidence", "validFrom", "validTo", "reviewAt", "contradictions", "status", "content"]);
  assertContractVersion(value.contractVersion);
  for (const key of ["id", "type", "tenantId", "source", "actor", "sensitivity", "status"]) assertString(value[key], `$/${key}`);
  assertEnum(value.status, MEMORY_STATES, "$/status"); assertConfidence(value.confidence, "$/confidence"); assertArray(value.purpose, "$/purpose"); assertArray(value.contradictions, "$/contradictions");
  assertInstant(value.validFrom, "$/validFrom");
  for (const key of ["validTo", "reviewAt"]) if (value[key] !== null) assertInstant(value[key], `$/${key}`);
  return value;
}

export function validateAdapter(value) {
  const required = ["contractVersion", "id", "version", "name", "vertical", "economicUnit", "salesMotion", "lifecycleStates", "metricDefinitions", "constraints", "channels", "complianceNotes", "economicDefaults", "requiredEvidence", "unsupportedAssumptions", "planningProfile"];
  assertFields(value, required, required);
  assertContractVersion(value.contractVersion);
  for (const name of ["id", "version", "name", "vertical", "economicUnit", "salesMotion"]) assertString(value[name], `$/${name}`);
  for (const name of ["lifecycleStates", "metricDefinitions", "constraints", "channels", "complianceNotes", "economicDefaults", "requiredEvidence", "unsupportedAssumptions"]) {
    assertArray(value[name], `$/${name}`);
    if (!value[name].length) throw new ValidationError("ARRAY_EMPTY", `$/${name}`, `${name} must not be empty`);
  }
  if (!value.lifecycleStates.includes("UNKNOWN")) throw new ValidationError("UNKNOWN_STATE_REQUIRED", "$/lifecycleStates", "Adapter lifecycle must include UNKNOWN");
  for (const [index, metric] of value.metricDefinitions.entries()) {
    assertFields(metric, ["id", "unit", "formula", "period", "grain"], ["id", "unit", "formula", "period", "grain"], `$/metricDefinitions/${index}`);
  }
  for (const [index, item] of value.economicDefaults.entries()) {
    if (item.evidence !== "modelled" || item.bounded !== true || !item.asOf || !item.source) throw new ValidationError("UNBOUNDED_ADAPTER_DEFAULT", `$/economicDefaults/${index}`, "Economic defaults must be bounded, dated, sourced, and modelled");
  }
  assertFields(value.planningProfile, ["typicalSalesCycleDays", "primaryDecisionMetric"], ["typicalSalesCycleDays", "primaryDecisionMetric"], "$/planningProfile");
  return value;
}

export function validateEvalCase(value) {
  assertFields(value, ["contractVersion", "id", "version", "adapter", "kind", "input", "expected", "scorers"]);
  assertContractVersion(value.contractVersion); assertString(value.id, "$/id"); assertString(value.version, "$/version"); assertArray(value.scorers, "$/scorers");
  return value;
}

export function validateEconomicInput(value) {
  assertFields(value, ["contractVersion", "currency", "period", "inputs"]);
  assertContractVersion(value.contractVersion); assertString(value.currency, "$/currency"); assertString(value.period, "$/period");
  return value;
}

export function validateEconomicResult(value) {
  const required = ["contractVersion", "kind", "status", "currency", "period", "values", "observedInputs", "modelledInputs", "assumptions", "missingValues", "sensitivity", "confidenceLimitations", "recommendation"];
  assertFields(value, required, required);
  assertContractVersion(value.contractVersion); assertString(value.kind, "$/kind"); assertString(value.status, "$/status"); assertString(value.currency, "$/currency"); assertString(value.period, "$/period");
  for (const key of ["observedInputs", "modelledInputs", "assumptions", "missingValues", "sensitivity", "confidenceLimitations"]) assertArray(value[key], `$/${key}`);
  if (!value.values || typeof value.values !== "object" || Array.isArray(value.values)) throw new ValidationError("TYPE_OBJECT", "$/values", "Expected calculations keyed by metric");
  if (!value.recommendation || typeof value.recommendation !== "object" || Array.isArray(value.recommendation)) throw new ValidationError("TYPE_OBJECT", "$/recommendation", "Expected a recommendation object");
  return value;
}

export function validateExperimentPlan(value) {
  assertFields(value, ["contractVersion", "id", "decision", "estimand", "population", "randomizationUnit", "variants", "allocation", "baseline", "mde", "power", "metrics", "duration", "stoppingRule", "multiplicityPlan", "confounders", "decisionRule"]);
  assertContractVersion(value.contractVersion); assertString(value.id, "$/id"); assertArray(value.variants, "$/variants"); assertArray(value.metrics, "$/metrics");
  return value;
}

export function validateExperimentResult(value) {
  assertFields(value, ["contractVersion", "planId", "status", "observations", "uncertainty", "srm", "decision", "warnings"]);
  assertContractVersion(value.contractVersion); assertString(value.planId, "$/planId"); assertString(value.status, "$/status"); assertArray(value.observations, "$/observations"); assertArray(value.warnings, "$/warnings");
  return value;
}
