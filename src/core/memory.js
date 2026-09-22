// SPDX-License-Identifier: Apache-2.0
import { randomUUID } from "node:crypto";
import { canonicalJson, ValidationError } from "./contracts/index.js";
import { validateMemoryRecord } from "./contracts/validators.js";

const TRANSITIONS = Object.freeze({
  candidate: ["active", "invalidated", "expired"],
  active: ["superseded", "invalidated", "expired"],
  superseded: [], invalidated: [], expired: []
});

function immutable(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) immutable(child);
  return Object.freeze(value);
}

function snapshot(value) { return immutable(JSON.parse(canonicalJson(value))); }

export function createMemoryRecord(input, { now = () => new Date().toISOString(), id = randomUUID } = {}) {
  const record = {
    contractVersion: "1.0.0",
    id: input.id ?? id(),
    type: input.type,
    tenantId: input.tenantId,
    purpose: [...(input.purpose ?? [])],
    source: input.source,
    actor: input.actor,
    sensitivity: input.sensitivity ?? "internal",
    confidence: input.confidence ?? 0,
    validFrom: input.validFrom ?? now(),
    validTo: input.validTo ?? null,
    reviewAt: input.reviewAt ?? null,
    contradictions: [...(input.contradictions ?? [])],
    status: input.status ?? "candidate",
    content: structuredClone(input.content)
  };
  validateMemoryRecord(record);
  if (record.status !== "candidate") throw new ValidationError("MEMORY_INITIAL_STATUS", "$/status", "New memory records must start as candidates");
  return snapshot(record);
}

export function transitionMemory(record, nextStatus, { validation = null, supersededBy = null } = {}) {
  validateMemoryRecord(record);
  if (!TRANSITIONS[record.status].includes(nextStatus)) throw new ValidationError("MEMORY_TRANSITION", "$/status", `Illegal memory transition ${record.status} -> ${nextStatus}`);
  if (nextStatus === "active" && record.type === "material_fact" && (!validation || validation.independent !== true || !validation.evidenceId)) {
    throw new ValidationError("MEMORY_VALIDATION_REQUIRED", "$/validation", "Material facts require independent validation before promotion");
  }
  if (nextStatus === "superseded" && !supersededBy) throw new ValidationError("MEMORY_SUPERSEDED_BY", "$/supersededBy", "Superseded memory must identify its replacement");
  return snapshot({ ...record, status: nextStatus, ...(supersededBy ? { supersededBy } : {}), ...(validation ? { validation } : {}) });
}

function relevance(record, query, now) {
  let score = 0;
  const text = JSON.stringify(record.content).toLowerCase();
  if (query.goal && text.includes(query.goal.toLowerCase())) score += 8;
  for (const capability of query.capabilities ?? []) if (record.purpose.includes(capability) || text.includes(capability.toLowerCase())) score += 6;
  for (const dependency of query.dependencies ?? []) if (text.includes(dependency.toLowerCase())) score += 4;
  if (["risk", "failure", "blocker", "decision", "constraint"].includes(record.type)) score += 5;
  if (record.content?.status && query.status?.includes(record.content.status)) score += 2;
  const ageDays = Math.max(0, (now - Date.parse(record.validFrom)) / 86_400_000);
  score += Math.max(0, 3 - ageDays / 30);
  return score;
}

export class MemoryStore {
  #records = new Map();
  add(record) { validateMemoryRecord(record); if (record.type === "material_fact" && record.status === "active" && (!record.validation?.independent || !record.validation?.evidenceId)) throw new ValidationError("MEMORY_VALIDATION_REQUIRED", "$/validation", "Active material facts require retained independent validation"); if (this.#records.has(record.id)) throw new ValidationError("MEMORY_DUPLICATE", "$/id", "Memory id already exists"); const stored = snapshot(record); this.#records.set(record.id, stored); return stored; }
  transition(id, nextStatus, options = {}) { const record = this.#records.get(id); if (!record) throw new ValidationError("MEMORY_NOT_FOUND", "$/id", "Memory record not found"); if (!options.tenantId || options.tenantId !== record.tenantId) throw new ValidationError("MEMORY_TENANT_SCOPE", "$/tenantId", "Tenant scope is required for memory transitions"); const updated = transitionMemory(record, nextStatus, options); this.#records.set(id, updated); return updated; }

  retrieve(query, { now = new Date() } = {}) {
    if (!query?.tenantId || !query?.purpose) throw new ValidationError("MEMORY_QUERY_SCOPE", "$query", "Tenant and purpose are required");
    const purpose = new Set([].concat(query.purpose));
    return [...this.#records.values()]
      .filter((record) => record.tenantId === query.tenantId)
      .filter((record) => record.status === "active")
      .filter((record) => record.purpose.some((item) => purpose.has(item)))
      .filter((record) => !query.maxSensitivity || sensitivityRank(record.sensitivity) <= sensitivityRank(query.maxSensitivity))
      .filter((record) => record.validTo === null || Date.parse(record.validTo) > now.getTime())
      .map((record) => ({ record, stale: record.reviewAt !== null && Date.parse(record.reviewAt) <= now.getTime(), score: relevance(record, query, now.getTime()), sourceId: record.source, freshness: { validFrom: record.validFrom, reviewAt: record.reviewAt } }))
      .sort((left, right) => right.score - left.score || left.record.id.localeCompare(right.record.id))
      .slice(0, query.limit ?? 10);
  }

  continuityPreflight(query, options) {
    const budget = query.limit ?? 8;
    const results = this.retrieve({ ...query, limit: Math.max(budget * 3, budget) }, options);
    const priorityTypes = ["decision", "blocker", "failure", "constraint", "risk"];
    const selected = [];
    for (const type of priorityTypes) {
      const candidate = results.find((entry) => entry.record.type === type && !selected.includes(entry));
      if (candidate && selected.length < budget) selected.push(candidate);
    }
    for (const entry of results) if (!selected.includes(entry) && selected.length < budget) selected.push(entry);
    return { records: selected, omitted: Math.max(0, results.length - selected.length), bounded: true };
  }

  propagateDeletion(sourceId, { tenantId } = {}) {
    if (!tenantId) throw new ValidationError("MEMORY_TENANT_SCOPE", "$/tenantId", "Tenant scope is required for deletion propagation");
    let count = 0;
    for (const [id, record] of this.#records) {
      if (record.tenantId === tenantId && record.source === sourceId && ["candidate", "active"].includes(record.status)) { this.#records.set(id, snapshot({ ...record, status: "invalidated", content: { deleted: true } })); count++; }
    }
    return { invalidated: count };
  }
}

function sensitivityRank(value) { return ({ public: 0, internal: 1, confidential: 2, restricted: 3 })[value] ?? 99; }
