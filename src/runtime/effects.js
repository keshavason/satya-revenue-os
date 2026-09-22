// SPDX-License-Identifier: Apache-2.0
import { canonicalJson, hashCanonical, ValidationError } from "../core/contracts/index.js";
import { validateEffectReceipt, validateEffectRequest } from "../core/contracts/validators.js";
import { checkApproval } from "../core/policy.js";

const NEXT_STATES = Object.freeze({
  "not-started": ["dispatched"], dispatched: ["succeeded", "failed", "indeterminate"],
  succeeded: [], failed: ["dispatched", "compensated"], indeterminate: ["succeeded", "failed", "compensated"], compensated: []
});

function immutableJson(value) {
  const clone = JSON.parse(canonicalJson(value));
  const freeze = (entry) => {
    if (!entry || typeof entry !== "object" || Object.isFrozen(entry)) return entry;
    for (const child of Object.values(entry)) freeze(child);
    return Object.freeze(entry);
  };
  return freeze(clone);
}

export class ReceiptStore {
  #receipts = new Map();
  get(tenantId, operationId) { return this.#receipts.get(tenantId)?.get(operationId) ?? null; }
  set(receipt) {
    validateEffectReceipt(receipt);
    const frozen = immutableJson(receipt);
    const tenantReceipts = this.#receipts.get(receipt.tenantId) ?? new Map();
    tenantReceipts.set(receipt.operationId, frozen);
    this.#receipts.set(receipt.tenantId, tenantReceipts);
    return frozen;
  }
  transition(tenantId, operationId, state, patch = {}) {
    const current = this.get(tenantId, operationId);
    if (!current) throw new ValidationError("RECEIPT_NOT_FOUND", "$/operationId", "Effect receipt not found");
    if (!NEXT_STATES[current.state].includes(state)) throw new ValidationError("EFFECT_TRANSITION", "$/state", `Illegal effect transition ${current.state} -> ${state}`);
    return this.set({ ...current, ...patch, state, updatedAt: patch.updatedAt ?? new Date().toISOString() });
  }
}

export class DryRunConnector {
  constructor({ simulateFailure = null } = {}) { this.id = "dry-run"; this.capabilities = Object.freeze(["dry-run"]); this.simulateFailure = simulateFailure; Object.freeze(this); }
  async dispatch(request) {
    if (this.simulateFailure) { const error = new Error("simulated dry-run failure"); error.code = this.simulateFailure; throw error; }
    return { simulated: true, requestHash: hashCanonical(request), connector: this.id };
  }
}
Object.freeze(DryRunConnector.prototype);

export class EffectGateway {
  #approvalUses = new Map();
  constructor({ policy, receipts = new ReceiptStore(), connector = new DryRunConnector(), now = () => new Date().toISOString() }) {
    if (connector?.constructor !== DryRunConnector || connector.dispatch !== DryRunConnector.prototype.dispatch || !Object.isFrozen(connector)) throw new ValidationError("LIVE_CONNECTOR_FORBIDDEN", "$/connector", "RC1 permits only the sealed dry-run connector");
    this.policy = policy; this.receipts = receipts; this.connector = connector; this.now = now;
  }

  async dispatch(request, context = {}) {
    validateEffectRequest(request);
    const requestHash = hashCanonical(request);
    const existing = this.receipts.get(request.tenantId, request.operationId);
    if (existing && existing.requestHash !== requestHash) throw new ValidationError("OPERATION_ID_REUSED", "$/operationId", "Operation id cannot be reused for a different request");
    const decision = this.policy.evaluate(request, context);
    if (decision.decision !== "allow") return { blocked: true, decision };
    if (existing?.state === "succeeded") return { receipt: existing, decision, duplicate: true };
    if (existing?.state === "indeterminate") return { receipt: existing, decision, duplicate: true, requiresReconciliation: true };
    if (decision.requiresApproval || request.approvalId) {
      const approval = context.approvals?.find((candidate) => candidate.id === request.approvalId);
      const approvalKey = approval ? hashCanonical({ tenantId: approval.tenantId, id: approval.id, operationHash: approval.operationHash }) : null;
      const priorUses = approval ? (this.#approvalUses.get(approvalKey) ?? approval.uses) : 0;
      const effectiveApproval = approval ? { ...approval, uses: priorUses, status: priorUses >= approval.maxUses ? "consumed" : approval.status } : null;
      const checked = effectiveApproval ? checkApproval(effectiveApproval, request, { now: new Date(this.now()) }) : { valid: false, reason: "approval_missing" };
      if (!checked.valid) return { blocked: true, decision: { decision: "ask", reason: checked.reason } };
      this.#approvalUses.set(approvalKey, priorUses + 1);
    }
    const at = this.now();
    let receipt = existing ?? this.receipts.set({ contractVersion: "1.0.0", operationId: request.operationId, tenantId: request.tenantId, state: "not-started", attempt: 0, requestedAt: at, updatedAt: at, requestHash, dryRun: true });
    receipt = this.receipts.transition(request.tenantId, request.operationId, "dispatched", { attempt: receipt.attempt + 1, updatedAt: this.now() });
    try {
      const result = await this.connector.dispatch(request);
      receipt = this.receipts.transition(request.tenantId, request.operationId, "succeeded", { result, updatedAt: this.now() });
      return { receipt, decision, duplicate: false };
    } catch (error) {
      const state = error.indeterminate ? "indeterminate" : "failed";
      receipt = this.receipts.transition(request.tenantId, request.operationId, state, { failure: { code: error.code ?? "DISPATCH_FAILED", message: error.message }, updatedAt: this.now() });
      return { receipt, decision, duplicate: false };
    }
  }

  compensate(tenantId, operationId, compensation) { return this.receipts.transition(tenantId, operationId, "compensated", { compensation, updatedAt: this.now() }); }
}
