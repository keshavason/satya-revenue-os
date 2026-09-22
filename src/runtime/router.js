// SPDX-License-Identifier: Apache-2.0
import { ValidationError } from "../core/contracts/index.js";

export class RoutingBlocked extends Error {
  constructor(code, message, details = {}) { super(message); this.name = "RoutingBlocked"; this.code = code; this.details = details; }
}

function eligible(route, task, budget) {
  if (route.maxRisk < task.risk) return false;
  if (route.maxContext < task.contextSize) return false;
  if (route.reasoning < task.reasoning) return false;
  if (route.cost > budget) return false;
  if (task.requiresTools && !route.toolControls) return false;
  return true;
}

export function routeModel(task, routes, { budget = Infinity, policyAllowed = true, evidenceSufficient = true } = {}) {
  if (!policyAllowed) throw new RoutingBlocked("POLICY_BLOCKED", "Model routing cannot bypass policy");
  if (!evidenceSufficient) throw new RoutingBlocked("EVIDENCE_INSUFFICIENT", "Model routing cannot bypass evidence requirements");
  const candidates = routes.filter((route) => eligible(route, task, budget)).sort((left, right) => left.cost - right.cost || left.latency - right.latency);
  if (!candidates.length) throw new RoutingBlocked("NO_ELIGIBLE_ROUTE", "No model route satisfies risk, reasoning, context, tools, and budget", { budget });
  return Object.freeze(candidates[0]);
}

export class DeterministicProvider {
  constructor(handlers = {}) { this.id = "offline-deterministic"; this.handlers = handlers; }
  async execute(request) {
    if (!request?.task) throw new ValidationError("PROVIDER_REQUEST", "$/task", "Provider request needs a task");
    const handler = this.handlers[request.task];
    if (!handler) return { status: "abstained", code: "UNSUPPORTED_TASK", provider: this.id };
    return { status: "completed", provider: this.id, output: await handler(structuredClone(request.input), request.context ?? {}) };
  }
}

export class ProviderChain {
  constructor(providers) { this.providers = [...providers]; }
  async execute(request, context) {
    if (!context?.policyAllowed || !context?.evidenceSufficient) throw new RoutingBlocked("FALLBACK_GUARD", "Fallback requires the same policy and evidence gates");
    const failures = [];
    for (const provider of this.providers) {
      try {
        const result = await provider.execute(request);
        if (result.status !== "unavailable") return result;
        failures.push({ provider: provider.id, code: result.code });
      } catch (error) { failures.push({ provider: provider.id, code: error.code ?? "PROVIDER_ERROR" }); }
    }
    return { status: "blocked", code: "PROVIDERS_EXHAUSTED", failures };
  }
}

