// SPDX-License-Identifier: Apache-2.0
import { hashCanonical, ValidationError } from "./contracts/index.js";
import { validateApproval, validateEffectRequest } from "./contracts/validators.js";

export const POLICY_DECISIONS = Object.freeze(["allow", "deny", "modify", "ask", "defer"]);
export const HIGH_IMPACT_EFFECTS = Object.freeze(["write", "egress", "financial", "administrative", "destructive"]);

export function approvalBinding(request) {
  validateEffectRequest(request);
  return {
    tenantId: request.tenantId,
    capability: request.capability,
    effect: request.effect,
    destination: request.destination,
    fields: [...request.fields].sort(),
    arguments: request.arguments,
    amount: request.amount,
    sourceTrust: request.sourceTrust,
    provenanceId: request.provenanceId
  };
}

export function approvalHash(request) { return hashCanonical(approvalBinding(request)); }

export function createApproval(request, input, { now = () => new Date().toISOString() } = {}) {
  const approval = {
    contractVersion: "1.0.0",
    id: input.id,
    tenantId: request.tenantId,
    operationHash: approvalHash(request),
    destination: request.destination,
    fields: [...request.fields].sort(),
    amount: request.amount,
    expiresAt: input.expiresAt,
    maxUses: input.maxUses ?? 1,
    uses: input.uses ?? 0,
    status: input.status ?? "active",
    createdAt: input.createdAt ?? now()
  };
  // createdAt is retained as audit metadata; validator intentionally validates the binding fields.
  const { createdAt: _createdAt, ...validated } = approval;
  validateApproval(validated);
  return Object.freeze(approval);
}

export function checkApproval(approval, request, { now = new Date() } = {}) {
  const { createdAt: _createdAt, ...validated } = approval;
  validateApproval(validated); validateEffectRequest(request);
  if (approval.status !== "active") return { valid: false, reason: "approval_inactive" };
  if (Date.parse(approval.expiresAt) <= now.getTime()) return { valid: false, reason: "approval_expired" };
  if (approval.uses >= approval.maxUses) return { valid: false, reason: "approval_exhausted" };
  if (approval.tenantId !== request.tenantId || approval.operationHash !== approvalHash(request)) return { valid: false, reason: "approval_binding_mismatch" };
  return { valid: true, reason: null };
}

export function consumeApproval(approval, request, options) {
  const checked = checkApproval(approval, request, options);
  if (!checked.valid) throw new ValidationError("APPROVAL_INVALID", "$/approval", `Approval is invalid: ${checked.reason}`);
  return Object.freeze({ ...approval, uses: approval.uses + 1, status: approval.uses + 1 >= approval.maxUses ? "consumed" : approval.status });
}

export class PolicyEngine {
  constructor({ rules = [], available = true } = {}) { this.rules = [...rules]; this.available = available; }

  evaluate(request, context = {}) {
    validateEffectRequest(request);
    const highImpact = HIGH_IMPACT_EFFECTS.includes(request.effect);
    if (!this.available) return { decision: highImpact ? "deny" : "defer", reason: "policy_unavailable" };
    if (!context.grants?.some((grant) => grant.tenantId === request.tenantId && grant.capability === request.capability)) return { decision: "deny", reason: "capability_not_granted" };
    if (context.goalTenantId !== request.tenantId) return { decision: "deny", reason: "tenant_mismatch" };
    if (request.sourceTrust === "trusted" && !context.trustedProvenanceIds?.includes(request.provenanceId)) return { decision: "deny", reason: "trusted_provenance_unverified" };
    const matched = this.rules.find((rule) => rule.matches(request, context));
    if (!matched) return { decision: highImpact ? "deny" : "defer", reason: highImpact ? "missing_high_impact_policy" : "no_matching_policy" };
    const outcome = matched.decide(request, context);
    if (!outcome || !POLICY_DECISIONS.includes(outcome.decision)) throw new ValidationError("POLICY_DECISION", "$/decision", "Policy rule returned an invalid decision");
    if (request.sourceTrust !== "trusted" && outcome.reason === "source_instruction") return { decision: "deny", reason: "untrusted_source_cannot_authorize" };
    return Object.freeze({ ruleId: matched.id, ...outcome });
  }
}
