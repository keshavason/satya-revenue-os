// SPDX-License-Identifier: Apache-2.0
import { randomUUID } from "node:crypto";
import { validatePlan } from "../core/planner.js";

export class LocalRunner {
  constructor({ ledger, registry, policyContext = {}, clock = () => new Date().toISOString(), runId = randomUUID }) {
    this.ledger = ledger; this.registry = registry; this.policyContext = policyContext; this.clock = clock; this.createRunId = runId;
  }

  async run(plan, input = {}, { runId = this.createRunId() } = {}) {
    validatePlan(plan);
    const emit = (type, payload) => this.ledger.append({ runId, type, occurredAt: this.clock(), payload });
    await emit("plan.created", { goalId: plan.goalId, groups: plan.groups.map((group) => group.map((step) => step.id)), totalCost: plan.totalCost });
    const artifacts = new Map(Object.entries(input));
    try {
      for (const group of plan.groups) {
        const results = await Promise.all(group.map(async (step) => {
          await emit("step.started", { stepId: step.id });
          const loaded = typeof this.registry.load === "function" ? await this.registry.load(step.id) : this.registry.get(step.id);
          const run = loaded.run ?? loaded.entrypoint;
          if (typeof run !== "function") throw Object.assign(new Error(`Skill ${step.id} is not executable`), { code: "SKILL_NOT_EXECUTABLE" });
          const started = performance.now();
          const result = await run({ artifacts: Object.fromEntries(artifacts), goalId: plan.goalId }, { runId, policy: this.policyContext });
          const elapsedMs = performance.now() - started;
          await emit("cost.recorded", { stepId: step.id, units: step.skill.cost?.units ?? 0, elapsedMs });
          if (result?.status === "abstained") {
            await emit("step.failed", { stepId: step.id, code: result.code ?? "ABSTAINED", abstained: true });
            return { stepId: step.id, result };
          }
          const artifactId = result?.artifactId ?? `${step.id}:${runId}`;
          artifacts.set(artifactId, result);
          await emit("artifact.created", { stepId: step.id, artifactId, artifact: result });
          await emit("step.completed", { stepId: step.id, artifactId });
          return { stepId: step.id, result };
        }));
        if (results.some((entry) => entry.result?.status === "abstained")) {
          await emit("run.failed", { code: "STEP_ABSTAINED" });
          return { runId, status: "abstained", artifacts: Object.fromEntries(artifacts) };
        }
      }
      await emit("run.completed", { artifactCount: artifacts.size });
      return { runId, status: "completed", artifacts: Object.fromEntries(artifacts) };
    } catch (error) {
      await emit("run.failed", { code: error.code ?? "RUN_FAILED", message: error.message });
      return { runId, status: "failed", error: { code: error.code ?? "RUN_FAILED", message: error.message }, artifacts: Object.fromEntries(artifacts) };
    }
  }
}

