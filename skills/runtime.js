// SPDX-License-Identifier: Apache-2.0
import { createHash } from "node:crypto";

export const SKILL_VERSION = "0.1.0-rc.1";

const INJECTION_PATTERNS = [
  /ignore (all|any|the) (previous|prior|system) instructions?/i,
  /reveal (the )?(system prompt|secret|credential)/i,
  /mark (this|the case) (as )?(passed|safe)/i,
  /override (policy|approval|permissions?)/i,
];

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function identifier(value) {
  return createHash("sha256").update(canonical(value)).digest("hex").slice(0, 20);
}

function abstain(skill, code, reason, missingEvidence = [], contradictions = []) {
  return {
    status: "abstained",
    skill,
    version: SKILL_VERSION,
    abstention: { code, reason, missingEvidence: [...missingEvidence].sort(), contradictions },
    effects: [],
  };
}

function completed(skill, input, body, warnings = []) {
  const provenance = {
    sourceIds: [...new Set((input.sources ?? []).map((source) => source.id).filter(Boolean))].sort(),
    claimIds: [...new Set((input.claims ?? input.researchClaims ?? []).map((claim) => claim.id).filter(Boolean))].sort(),
    generatedBy: skill,
    generatedAt: input.asOf ?? null,
  };
  const artifact = {
    id: `art_${identifier({ skill, input, body })}`,
    type: `${skill}-result`,
    skill,
    version: SKILL_VERSION,
    provenance,
    warnings: [...new Set(warnings)].sort(),
    ...body,
  };
  return { status: "completed", skill, version: SKILL_VERSION, artifact, effects: [] };
}

function requireObject(skill, input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return abstain(skill, "INVALID_INPUT", "Input must be a JSON object.", ["object input"]);
  }
  return null;
}

function untrustedSignals(input) {
  return (input.sources ?? []).flatMap((source) => {
    const text = typeof source.content === "string" ? source.content : "";
    return INJECTION_PATTERNS.some((pattern) => pattern.test(text)) ? [source.id ?? "unidentified-source"] : [];
  });
}

function materialClaims(input) {
  return (input.claims ?? input.researchClaims ?? []).filter((claim) => claim && typeof claim === "object");
}

function validateClaims(skill, claims) {
  const missing = [];
  for (const [index, claim] of claims.entries()) {
    if (!claim.id) missing.push(`claims[${index}].id`);
    if (!claim.statement && !claim.text) missing.push(`claims[${index}].text`);
    if (!claim.class) missing.push(`claims[${index}].class`);
    if (!claim.evidenceState) missing.push(`claims[${index}].evidenceState`);
  }
  return missing.length ? abstain(skill, "INSUFFICIENT_EVIDENCE", "Material claims lack provenance fields.", missing) : null;
}

function research(skill, input, focus) {
  const invalid = requireObject(skill, input);
  if (invalid) return invalid;
  if (!input.question) return abstain(skill, "INSUFFICIENT_INFORMATION", "A bounded research question is required.", ["question"]);
  if (!Array.isArray(input.sources) || input.sources.length === 0) {
    return abstain(skill, "INSUFFICIENT_EVIDENCE", "Research cannot proceed without supplied sources in offline mode.", ["sources"]);
  }
  const usable = input.sources.filter((source) => source?.id && source?.observations && Array.isArray(source.observations));
  if (usable.length === 0) return abstain(skill, "INSUFFICIENT_EVIDENCE", "No source contains structured observations.", ["sources[].id", "sources[].observations"]);
  const signals = untrustedSignals(input);
  const findings = usable.flatMap((source) => source.observations.map((observation, index) => ({
    id: `${source.id}:${index + 1}`,
    statement: String(observation),
    class: source.claimClass ?? "external_datum",
    evidenceState: source.evidenceState ?? "declared",
    sourceIds: [source.id],
  }))).sort((a, b) => a.id.localeCompare(b.id));
  return completed(skill, input, {
    question: input.question,
    focus,
    findings,
    contradictions: input.contradictions ?? [],
    limitations: ["Offline synthesis of supplied sources; no independent retrieval performed."],
  }, signals.map((id) => `Untrusted instruction-like content ignored in ${id}.`));
}

const handlers = {
  "continuity-preflight": (input) => {
    const skill = "continuity-preflight";
    const invalid = requireObject(skill, input);
    if (invalid) return invalid;
    if (!input.goal || !input.tenantId) return abstain(skill, "INSUFFICIENT_INFORMATION", "Goal and tenant are required.", [!input.goal && "goal", !input.tenantId && "tenantId"].filter(Boolean));
    const records = Array.isArray(input.records) ? input.records : [];
    const purposes = new Set([].concat(input.purpose ?? []));
    const sensitivity = { public: 0, internal: 1, confidential: 2, restricted: 3 };
    const maxSensitivity = sensitivity[input.maxSensitivity ?? "internal"] ?? 1;
    const now = Date.parse(input.asOf ?? new Date().toISOString());
    const selected = records.filter((record) => record.tenantId === input.tenantId && record.status === "active")
      .filter((record) => purposes.size === 0 || record.purpose?.some((purpose) => purposes.has(purpose)))
      .filter((record) => (sensitivity[record.sensitivity ?? "internal"] ?? 99) <= maxSensitivity)
      .filter((record) => record.validTo == null || Date.parse(record.validTo) > now)
      .map((record) => ({ id: record.id, status: record.status, decision: record.decision, risks: record.risks ?? [], source: record.source ?? null, stale: record.reviewAt != null && Date.parse(record.reviewAt) <= now }))
      .sort((a, b) => String(a.id).localeCompare(String(b.id)));
    return completed(skill, input, { goal: input.goal, selectedRecords: selected, blockers: selected.flatMap((record) => record.risks).filter((risk) => risk?.severity === "blocker"), omittedCount: records.length - selected.length });
  },
  "evidence-verification": (input) => {
    const skill = "evidence-verification";
    const invalid = requireObject(skill, input);
    if (invalid) return invalid;
    const claims = materialClaims(input);
    if (!claims.length) return abstain(skill, "INSUFFICIENT_EVIDENCE", "At least one material claim is required.", ["claims"]);
    const claimError = validateClaims(skill, claims);
    if (claimError) return claimError;
    const verified = claims.map((claim) => ({
      ...claim,
      evidenceState: claim.evidenceState,
      verdict: claim.contradictions?.length ? "contradicted" : (["tested", "verified"].includes(claim.evidenceState) && (claim.sources?.length ?? 0) > 0 ? "supported" : "unverified"),
    }));
    return completed(skill, input, { claims: verified, unresolved: verified.filter((claim) => claim.verdict !== "supported").map((claim) => claim.id) });
  },
  "market-research": (input) => research("market-research", input, "market"),
  "customer-research": (input) => research("customer-research", input, "customer"),
  "competitor-research": (input) => research("competitor-research", input, "competitor"),
  "icp-qualification": (input) => {
    const skill = "icp-qualification";
    const invalid = requireObject(skill, input);
    if (invalid) return invalid;
    if (!Array.isArray(input.criteria) || !input.criteria.length || !Array.isArray(input.candidates)) return abstain(skill, "INSUFFICIENT_INFORMATION", "Explicit criteria and candidates are required.", ["criteria", "candidates"]);
    const criteria = [...input.criteria].sort((a, b) => String(a.id).localeCompare(String(b.id)));
    const qualified = input.candidates.map((candidate) => {
      const assessments = criteria.map((criterion) => ({ criterionId: criterion.id, met: candidate.attributes?.[criterion.field] === criterion.expected, observed: candidate.attributes?.[criterion.field] ?? null }));
      return { candidateId: candidate.id, assessments, qualified: assessments.every((item) => item.met) };
    });
    return completed(skill, input, { qualified, unknowns: qualified.filter((entry) => entry.assessments.some((item) => item.observed === null)).map((entry) => entry.candidateId) });
  },
  "positioning-offer-pricing": (input) => {
    const skill = "positioning-offer-pricing";
    const invalid = requireObject(skill, input);
    if (invalid) return invalid;
    const claims = materialClaims(input);
    const missing = [!claims.length && "researchClaims", !input.costs && "costs", !input.capacity && "capacity", !input.willingnessToPay && "willingnessToPay"].filter(Boolean);
    if (missing.length) return abstain(skill, "INSUFFICIENT_EVIDENCE", "Pricing requires research, cost, capacity, and willingness-to-pay evidence.", missing);
    const claimError = validateClaims(skill, claims);
    if (claimError) return claimError;
    const floor = Number(input.costs.variablePerUnit ?? 0) + Number(input.costs.deliveryPerUnit ?? 0);
    const candidates = (input.willingnessToPay.observedPrices ?? []).filter(Number.isFinite).sort((a, b) => a - b);
    if (!candidates.length) return abstain(skill, "INSUFFICIENT_EVIDENCE", "No observed willingness-to-pay values were supplied.", ["willingnessToPay.observedPrices"]);
    const midpoint = candidates[Math.floor(candidates.length / 2)];
    return completed(skill, input, { positioning: input.positioning ?? null, priceFloor: floor, observedMedian: midpoint, recommendation: midpoint > floor ? { action: "test-price", price: midpoint, reversible: true } : { action: "no-action", reason: "Observed willingness to pay does not exceed unit delivery cost." }, supportingClaimIds: claims.map((claim) => claim.id) });
  },
  "economics-analysis": (input) => {
    const skill = "economics-analysis";
    const invalid = requireObject(skill, input);
    if (invalid) return invalid;
    const required = ["revenue", "variableCost", "acquisitionCost", "customers"];
    const missing = required.filter((key) => !Number.isFinite(input[key]));
    if (missing.length) return abstain(skill, "INSUFFICIENT_INFORMATION", "Comparable numeric inputs are required.", missing);
    if (input.customers <= 0) return abstain(skill, "INVALID_DENOMINATOR", "Customers must be greater than zero.", ["customers"]);
    const contribution = input.revenue - input.variableCost;
    const cac = input.acquisitionCost / input.customers;
    return completed(skill, input, { revenue: input.revenue, contribution, contributionMargin: input.revenue === 0 ? null : contribution / input.revenue, cac, decision: contribution <= 0 ? { action: "no-action", reason: "Non-positive contribution prevents a revenue-only growth recommendation." } : { action: "eligible-for-review" }, inputClass: input.inputClass ?? "declared" });
  },
  "experiment-design": (input) => {
    const skill = "experiment-design";
    const invalid = requireObject(skill, input);
    if (invalid) return invalid;
    const required = ["decision", "estimand", "population", "randomizationUnit", "baseline", "mde", "power", "duration", "primaryMetric", "guardrailMetrics", "stoppingRule"];
    const missing = required.filter((key) => input[key] === undefined || input[key] === null || input[key] === "");
    if (missing.length) return abstain(skill, "INCOMPLETE_EXPERIMENT_CONTRACT", "Pre-registration fields are missing.", missing);
    if (input.resultsSeen) return abstain(skill, "POST_HOC_DESIGN", "A design created after results cannot be treated as pre-registered.", [], ["resultsSeen=true"]);
    return completed(skill, input, { plan: Object.fromEntries(required.map((key) => [key, input[key]])), multiplicityPlan: input.multiplicityPlan ?? "single-primary", dataQualityMetrics: input.dataQualityMetrics ?? ["sample-ratio-mismatch"], status: "pre-registered-draft" });
  },
  "pipeline-forecast-review": (input) => {
    const skill = "pipeline-forecast-review";
    const invalid = requireObject(skill, input);
    if (invalid) return invalid;
    if (!input.asOf || !Array.isArray(input.opportunities)) return abstain(skill, "INSUFFICIENT_INFORMATION", "An as-of date and opportunity history are required.", ["asOf", "opportunities"]);
    const unknown = input.opportunities.filter((item) => !Number.isFinite(item.amount) || !Number.isFinite(item.probability));
    if (unknown.length) return abstain(skill, "INSUFFICIENT_EVIDENCE", "Every forecast item needs amount and explicit probability.", unknown.map((item) => `opportunity:${item.id ?? "unknown"}`));
    const forecast = input.opportunities.reduce((sum, item) => sum + item.amount * item.probability, 0);
    return completed(skill, input, { asOf: input.asOf, forecast, currency: input.currency ?? "UNKNOWN", itemCount: input.opportunities.length, limitations: ["Association-based weighted pipeline; not causal lift."] });
  },
  "satya-commercial-review": (input) => {
    const skill = "satya-commercial-review";
    const invalid = requireObject(skill, input);
    if (invalid) return invalid;
    if (!input.artifact || !input.authority) return abstain(skill, "INSUFFICIENT_INFORMATION", "The exact artifact and review authority are required.", [!input.artifact && "artifact", !input.authority && "authority"].filter(Boolean));
    const gates = {
      intention: Boolean(input.purpose && input.affectedParties),
      evidence: Boolean(input.artifact.provenance),
      criticism: Boolean(input.knownRisks),
      authority: input.authority === "review" || input.authority === "publish",
      reversibility: input.reversible !== undefined,
      conservation: Boolean(input.retention),
    };
    const failed = Object.entries(gates).filter(([, passed]) => !passed).map(([name]) => name);
    return completed(skill, input, { exactArtifactHash: identifier(input.artifact), reviewerType: "ai", gates, decision: failed.length ? "revise" : "review-passed-not-publication-authority", failedGates: failed, limitations: ["AI review is not human approval, legal advice, or publication authority."] });
  },
};

export function executeSkill(name, input) {
  const handler = handlers[name];
  if (!handler) return abstain(name, "UNKNOWN_SKILL", `No deterministic handler exists for ${name}.`);
  try {
    return handler(input);
  } catch (error) {
    return abstain(name, "SKILL_FAILURE", "The skill failed closed.", [], [String(error?.message ?? error)]);
  }
}

export const skillNames = Object.freeze(Object.keys(handlers).sort());
