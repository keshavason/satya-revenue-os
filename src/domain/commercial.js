// SPDX-License-Identifier: Apache-2.0

export const COMMERCIAL_CONTRACT_VERSION = "1.0.0";

const ENUMS = Object.freeze({
  Party: ["person", "household", "account", "organization", "buying-group"],
  Offer: ["product", "service", "tariff", "bundle"],
  CommercialEvent: [
    "contact", "visit", "inquiry", "quote", "booking", "order", "contract",
    "usage", "return", "renewal", "default"
  ],
  Commitment: ["quote", "booking", "order", "contract", "subscription", "backlog"],
  EconomicEvent: [
    "revenue", "discount", "variable-cost", "delivery-cost", "commission",
    "refund", "cash-receipt"
  ]
});

export class DomainValidationError extends Error {
  constructor(path, message, code = "DOMAIN_VALIDATION_ERROR") {
    super(`${path}: ${message}`);
    this.name = "DomainValidationError";
    this.code = code;
    this.path = path;
  }
}

function assertRecord(value, path) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new DomainValidationError(path, "must be an object");
  }
}

function requiredString(value, path) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new DomainValidationError(path, "must be a non-empty string");
  }
  return value;
}

function isoDate(value, path) {
  requiredString(value, path);
  if (!Number.isFinite(Date.parse(value))) {
    throw new DomainValidationError(path, "must be an ISO-8601 timestamp");
  }
  return new Date(value).toISOString();
}

function oneOf(value, allowed, path) {
  if (!allowed.includes(value)) {
    throw new DomainValidationError(path, `must be one of: ${allowed.join(", ")}`);
  }
  return value;
}

function base(kind, input) {
  assertRecord(input, kind);
  return {
    contractVersion: input.contractVersion ?? COMMERCIAL_CONTRACT_VERSION,
    kind,
    id: requiredString(input.id, `${kind}.id`)
  };
}

export function createParty(input) {
  return Object.freeze({
    ...base("Party", input),
    partyType: oneOf(input.partyType, ENUMS.Party, "Party.partyType"),
    displayName: requiredString(input.displayName, "Party.displayName"),
    tenantId: requiredString(input.tenantId, "Party.tenantId"),
    attributes: Object.freeze({ ...(input.attributes ?? {}) })
  });
}

export function createOffer(input) {
  const result = {
    ...base("Offer", input),
    offerType: oneOf(input.offerType, ENUMS.Offer, "Offer.offerType"),
    name: requiredString(input.name, "Offer.name"),
    version: requiredString(input.version, "Offer.version"),
    activeFrom: isoDate(input.activeFrom, "Offer.activeFrom"),
    activeTo: input.activeTo == null ? null : isoDate(input.activeTo, "Offer.activeTo"),
    price: input.price == null ? null : validateMoney(input.price, "Offer.price")
  };
  if (result.activeTo && result.activeTo < result.activeFrom) {
    throw new DomainValidationError("Offer.activeTo", "cannot precede activeFrom");
  }
  return Object.freeze(result);
}

function validateMoney(value, path) {
  assertRecord(value, path);
  if (!Number.isFinite(value.amount)) {
    throw new DomainValidationError(`${path}.amount`, "must be finite");
  }
  return Object.freeze({
    amount: value.amount,
    currency: requiredString(value.currency, `${path}.currency`).toUpperCase()
  });
}

export function createCommercialEvent(input) {
  return Object.freeze({
    ...base("CommercialEvent", input),
    eventType: oneOf(input.eventType, ENUMS.CommercialEvent, "CommercialEvent.eventType"),
    occurredAt: isoDate(input.occurredAt, "CommercialEvent.occurredAt"),
    partyId: requiredString(input.partyId, "CommercialEvent.partyId"),
    offerId: input.offerId == null ? null : requiredString(input.offerId, "CommercialEvent.offerId"),
    sourceId: requiredString(input.sourceId, "CommercialEvent.sourceId"),
    attributes: Object.freeze({ ...(input.attributes ?? {}) })
  });
}

export function createCommitment(input) {
  return Object.freeze({
    ...base("Commitment", input),
    commitmentType: oneOf(input.commitmentType, ENUMS.Commitment, "Commitment.commitmentType"),
    partyId: requiredString(input.partyId, "Commitment.partyId"),
    offerId: requiredString(input.offerId, "Commitment.offerId"),
    status: requiredString(input.status, "Commitment.status"),
    effectiveAt: isoDate(input.effectiveAt, "Commitment.effectiveAt"),
    value: input.value == null ? null : validateMoney(input.value, "Commitment.value")
  });
}

export function createEconomicEvent(input) {
  return Object.freeze({
    ...base("EconomicEvent", input),
    eventType: oneOf(input.eventType, ENUMS.EconomicEvent, "EconomicEvent.eventType"),
    occurredAt: isoDate(input.occurredAt, "EconomicEvent.occurredAt"),
    amount: validateMoney(input.amount, "EconomicEvent.amount"),
    partyId: input.partyId == null ? null : requiredString(input.partyId, "EconomicEvent.partyId"),
    commitmentId: input.commitmentId == null ? null : requiredString(input.commitmentId, "EconomicEvent.commitmentId"),
    sourceId: requiredString(input.sourceId, "EconomicEvent.sourceId")
  });
}

export function createMetricDefinition(input) {
  const result = {
    ...base("MetricDefinition", input),
    name: requiredString(input.name, "MetricDefinition.name"),
    formula: requiredString(input.formula, "MetricDefinition.formula"),
    numerator: input.numerator == null ? null : requiredString(input.numerator, "MetricDefinition.numerator"),
    denominator: input.denominator == null ? null : requiredString(input.denominator, "MetricDefinition.denominator"),
    unit: requiredString(input.unit, "MetricDefinition.unit"),
    period: requiredString(input.period, "MetricDefinition.period"),
    grain: requiredString(input.grain, "MetricDefinition.grain"),
    currency: input.currency == null ? null : requiredString(input.currency, "MetricDefinition.currency").toUpperCase(),
    source: requiredString(input.source, "MetricDefinition.source"),
    version: requiredString(input.version, "MetricDefinition.version"),
    owner: requiredString(input.owner, "MetricDefinition.owner"),
    biases: Object.freeze([...(input.biases ?? [])])
  };
  if (result.unit === "currency" && !result.currency) {
    throw new DomainValidationError("MetricDefinition.currency", "is required for currency metrics");
  }
  return Object.freeze(result);
}

export function createLifecycleTransition(input, allowedStates = []) {
  assertRecord(input, "LifecycleTransition");
  const known = new Set(["UNKNOWN", ...allowedStates]);
  const from = requiredString(input.from ?? "UNKNOWN", "LifecycleTransition.from");
  const to = requiredString(input.to, "LifecycleTransition.to");
  if (!known.has(from)) throw new DomainValidationError("LifecycleTransition.from", `unknown state ${from}`);
  if (!known.has(to)) throw new DomainValidationError("LifecycleTransition.to", `unknown state ${to}`);
  return Object.freeze({
    ...base("LifecycleTransition", input),
    subjectId: requiredString(input.subjectId, "LifecycleTransition.subjectId"),
    from,
    to,
    occurredAt: isoDate(input.occurredAt, "LifecycleTransition.occurredAt"),
    sourceId: requiredString(input.sourceId, "LifecycleTransition.sourceId")
  });
}

export function reconstructLifecycleAt(transitions, at, allowedStates = []) {
  const cutoff = isoDate(at, "at");
  const normalized = transitions
    .map((item) => createLifecycleTransition(item, allowedStates))
    .filter((item) => item.occurredAt <= cutoff)
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt) || a.id.localeCompare(b.id));
  let state = "UNKNOWN";
  for (const transition of normalized) {
    if (transition.from !== "UNKNOWN" && transition.from !== state) {
      throw new DomainValidationError(
        "LifecycleTransition.from",
        `history discontinuity at ${transition.id}: expected ${state}, received ${transition.from}`,
        "LIFECYCLE_HISTORY_DISCONTINUITY"
      );
    }
    state = transition.to;
  }
  return Object.freeze({ state, at: cutoff, transitionIds: normalized.map(({ id }) => id) });
}

export function createForecastSnapshot(input) {
  const value = validateMoney(input.value, "ForecastSnapshot.value");
  return Object.freeze({
    ...base("ForecastSnapshot", input),
    asOf: isoDate(input.asOf, "ForecastSnapshot.asOf"),
    horizon: requiredString(input.horizon, "ForecastSnapshot.horizon"),
    grain: requiredString(input.grain, "ForecastSnapshot.grain"),
    metricId: requiredString(input.metricId, "ForecastSnapshot.metricId"),
    value,
    components: Object.freeze([...(input.components ?? [])]),
    modelVersion: requiredString(input.modelVersion, "ForecastSnapshot.modelVersion"),
    uncertainty: input.uncertainty == null ? null : Object.freeze({ ...input.uncertainty })
  });
}

export function createDecisionRecord(input) {
  const result = {
    ...base("DecisionRecord", input),
    decidedAt: isoDate(input.decidedAt, "DecisionRecord.decidedAt"),
    decision: requiredString(input.decision, "DecisionRecord.decision"),
    alternatives: Object.freeze([...(input.alternatives ?? [])]),
    evidenceIds: Object.freeze([...(input.evidenceIds ?? [])]),
    approver: input.approver == null ? null : requiredString(input.approver, "DecisionRecord.approver"),
    reversible: Boolean(input.reversible),
    expectedOutcome: requiredString(input.expectedOutcome, "DecisionRecord.expectedOutcome"),
    actualOutcome: input.actualOutcome ?? null,
    wouldChangeDecision: Object.freeze([...(input.wouldChangeDecision ?? [])])
  };
  if (result.alternatives.length === 0) {
    throw new DomainValidationError("DecisionRecord.alternatives", "must contain at least one alternative");
  }
  return Object.freeze(result);
}

export function validateCommercialContract(value) {
  assertRecord(value, "contract");
  const factories = {
    Party: createParty,
    Offer: createOffer,
    CommercialEvent: createCommercialEvent,
    Commitment: createCommitment,
    EconomicEvent: createEconomicEvent,
    MetricDefinition: createMetricDefinition,
    ForecastSnapshot: createForecastSnapshot,
    DecisionRecord: createDecisionRecord
  };
  if (!factories[value.kind]) {
    throw new DomainValidationError("contract.kind", `unsupported contract kind ${value.kind}`);
  }
  return factories[value.kind](value);
}
