// SPDX-License-Identifier: Apache-2.0
import { ValidationError } from "./contracts/index.js";

export class PlanningAbstention extends Error {
  constructor(code, message, details = {}) { super(message); this.name = "PlanningAbstention"; this.code = code; this.details = details; }
}

function dependencies(skill) { return skill.dependsOn ?? skill.dependencies ?? []; }

function detectCycle(skillsById, selectedIds) {
  const temporary = new Set();
  const permanent = new Set();
  const visit = (id, trail) => {
    if (temporary.has(id)) return [...trail, id];
    if (permanent.has(id)) return null;
    temporary.add(id);
    for (const dependency of dependencies(skillsById.get(id) ?? {})) {
      if (!selectedIds.has(dependency)) continue;
      const cycle = visit(dependency, [...trail, id]);
      if (cycle) return cycle;
    }
    temporary.delete(id); permanent.add(id); return null;
  };
  for (const id of selectedIds) { const cycle = visit(id, []); if (cycle) return cycle; }
  return null;
}

function unmetPreconditions(skill, state) {
  return (skill.preconditions ?? []).filter((condition) => {
    if (typeof condition === "string") return !state.capabilities?.includes(condition) && !Object.hasOwn(state, condition);
    if (condition && typeof condition === "object") return condition.path && state[condition.path] !== condition.equals;
    return true;
  });
}

function skillCost(skill) {
  if (typeof skill.cost === "number") return skill.cost;
  if (!skill.cost || typeof skill.cost !== "object") return 0;
  for (const key of ["units", "estimatedUnits", "monetary"]) if (Number.isFinite(skill.cost[key])) return skill.cost[key];
  return 0;
}

export function planGoal({ goal, skills, state = {}, limits = {} }) {
  const maxSteps = limits.maxSteps ?? 20;
  const maxDepth = limits.maxDepth ?? 8;
  const maxCost = limits.maxCost ?? Infinity;
  const maxParallel = limits.maxParallel ?? 4;
  for (const [name, value] of Object.entries({ maxSteps, maxDepth, maxParallel })) {
    if (!Number.isSafeInteger(value) || value < 1 || value > 10_000) throw new PlanningAbstention("PLAN_LIMIT_INVALID", `${name} must be a positive safe integer no greater than 10000`, { name, value });
  }
  if (typeof maxCost !== "number" || Number.isNaN(maxCost) || maxCost < 0) throw new PlanningAbstention("PLAN_LIMIT_INVALID", "maxCost must be a non-negative number", { name: "maxCost", value: maxCost });
  if (!goal?.capabilities?.length) throw new PlanningAbstention("GOAL_UNSPECIFIED", "Goal declares no required capabilities");
  const byId = new Map(skills.map((skill) => [skill.id, skill]));
  const selected = new Set();
  const missing = [];
  for (const capability of goal.capabilities) {
    const candidate = skills.find((skill) => skill.capabilities?.includes(capability) || skill.id === capability);
    if (!candidate) missing.push(capability); else selected.add(candidate.id);
  }
  if (missing.length) throw new PlanningAbstention("CAPABILITY_UNAVAILABLE", "Required capabilities are unavailable", { missing });

  const addDependencies = (id, depth = 0) => {
    if (depth > maxDepth) throw new PlanningAbstention("PLAN_DEPTH_EXCEEDED", "Plan dependency depth exceeds its bound", { maxDepth });
    const skill = byId.get(id);
    for (const dependency of dependencies(skill)) {
      if (!byId.has(dependency)) throw new PlanningAbstention("DEPENDENCY_UNAVAILABLE", "A required dependency is unavailable", { skillId: id, dependency });
      if (!selected.has(dependency)) { selected.add(dependency); addDependencies(dependency, depth + 1); }
    }
  };
  for (const id of [...selected]) addDependencies(id);
  const cycle = detectCycle(byId, selected);
  if (cycle) throw new PlanningAbstention("DEPENDENCY_CYCLE", "Skill dependency cycle detected", { cycle });
  if (selected.size > maxSteps) throw new PlanningAbstention("PLAN_STEPS_EXCEEDED", "Plan exceeds its step bound", { selected: selected.size, maxSteps });
  const totalCost = [...selected].reduce((sum, id) => sum + skillCost(byId.get(id)), 0);
  if (totalCost > maxCost) throw new PlanningAbstention("PLAN_UNAFFORDABLE", "Plan exceeds its cost bound", { totalCost, maxCost });
  const ineligible = [...selected].map((id) => ({ id, unmet: unmetPreconditions(byId.get(id), state) })).filter((entry) => entry.unmet.length);
  if (ineligible.length) throw new PlanningAbstention("EVIDENCE_INSUFFICIENT", "No safe eligible plan can advance the goal", { ineligible });

  const remaining = new Set(selected);
  const completed = new Set();
  const groups = [];
  while (remaining.size) {
    const ready = [...remaining].filter((id) => dependencies(byId.get(id)).every((dependency) => completed.has(dependency)));
    if (!ready.length) throw new PlanningAbstention("NO_ELIGIBLE_STEP", "No eligible step can advance the goal");
    for (let offset = 0; offset < ready.length; offset += maxParallel) {
      const group = ready.slice(offset, offset + maxParallel);
      groups.push(group.map((id) => ({ id, skill: byId.get(id) })));
      group.forEach((id) => { remaining.delete(id); completed.add(id); });
    }
  }
  return Object.freeze({ goalId: goal.id, groups, stepCount: selected.size, totalCost, stopConditions: { ...limits } });
}

export function validatePlan(plan) {
  if (!plan || !Array.isArray(plan.groups)) throw new ValidationError("PLAN_INVALID", "$/groups", "Plan groups are required");
  const ids = plan.groups.flat().map((step) => step.id);
  if (new Set(ids).size !== ids.length) throw new ValidationError("PLAN_DUPLICATE_STEP", "$/groups", "Plan contains duplicate steps");
  return plan;
}
