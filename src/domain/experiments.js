// SPDX-License-Identifier: Apache-2.0

const REQUIRED = [
  "id", "hypothesis", "estimand", "population", "randomizationUnit", "allocation", "baseline", "mde", "power",
  "primaryMetric", "guardrailMetrics", "dataQualityMetrics", "multiplicityPlan",
  "confounders", "srmPlan", "businessImpactRule", "decisionRule", "variants"
];

export function validateExperimentPlan(plan) {
  const errors = [];
  const warnings = [];
  if (!plan || typeof plan !== "object" || Array.isArray(plan)) {
    return Object.freeze({ valid: false, errors: [Object.freeze({ path: "plan", code: "TYPE", message: "must be an object" })], warnings, decision: "do-not-run" });
  }
  for (const field of REQUIRED) {
    if (plan[field] == null || plan[field] === "" || (Array.isArray(plan[field]) && plan[field].length === 0)) {
      errors.push(Object.freeze({ path: `plan.${field}`, code: "REQUIRED", message: "is required before results are accepted" }));
    }
  }
  if (plan.duration == null && plan.stoppingRule == null) {
    errors.push(Object.freeze({ path: "plan.duration", code: "STOPPING_REQUIRED", message: "duration or stoppingRule is required" }));
  }
  if (Number.isFinite(plan.power) && (plan.power <= 0 || plan.power >= 1)) {
    errors.push(Object.freeze({ path: "plan.power", code: "RATE", message: "must be between 0 and 1" }));
  }
  if (Number.isFinite(plan.mde) && plan.mde <= 0) {
    errors.push(Object.freeze({ path: "plan.mde", code: "RANGE", message: "must be greater than zero" }));
  }
  if (Array.isArray(plan.variants) && plan.variants.length < 2) {
    errors.push(Object.freeze({ path: "plan.variants", code: "VARIANTS", message: "requires control and at least one treatment" }));
  }
  if (plan.expectedSample != null && plan.requiredMinSample != null && plan.expectedSample < plan.requiredMinSample) {
    const message = "available sample is below the declared decision-relevant minimum";
    if (plan.materialGuardrailRisk === true) errors.push(Object.freeze({ path: "plan.expectedSample", code: "UNDERPOWERED_HARM_RISK", message }));
    else warnings.push(Object.freeze({ path: "plan.expectedSample", code: "UNDERPOWERED", message }));
  }
  return Object.freeze({
    valid: errors.length === 0,
    errors: Object.freeze(errors),
    warnings: Object.freeze(warnings),
    decision: errors.length ? "do-not-run" : "eligible-for-review"
  });
}

export function evaluateExperimentResult(plan, result) {
  const validation = validateExperimentPlan(plan);
  const limitations = [];
  if (!validation.valid) {
    return Object.freeze({ status: "observational", claimClass: "association", accepted: false, decision: "insufficient-information", validation, limitations: Object.freeze(["The experiment was not validly pre-registered."]) });
  }
  if (!result || typeof result !== "object") {
    return Object.freeze({ status: "rejected", claimClass: "association", accepted: false, decision: "insufficient-information", validation, limitations: Object.freeze(["Result is missing."]) });
  }
  if (result.primaryMetric !== plan.primaryMetric) {
    limitations.push("Reported success metric was not the registered primary metric.");
  }
  if (result.peeked === true && plan.stoppingRule?.allowsSequentialMonitoring !== true) {
    limitations.push("Unregistered peeking invalidates the controlled success decision.");
  }
  if (result.srmDetected === true) limitations.push("Sample-ratio mismatch was detected.");
  if (result.guardrailBreached === true) limitations.push("A registered guardrail was breached.");
  if (result.multiplicityHandled !== true && (plan.metricsTested ?? 1) > 1) limitations.push("Multiplicity was not handled as registered.");
  const accepted = limitations.length === 0 && result.decisionRulePassed === true;
  return Object.freeze({
    status: accepted ? "controlled-result" : "downgraded",
    claimClass: accepted ? "incremental-lift" : "association",
    accepted,
    decision: accepted ? (result.businessImpactRulePassed === true ? "adopt" : "no-action") : "insufficient-information",
    validation,
    limitations: Object.freeze(limitations)
  });
}
