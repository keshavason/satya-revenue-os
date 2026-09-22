// SPDX-License-Identifier: Apache-2.0
import { appendFile, mkdir, readFile } from "node:fs/promises";
import { dirname } from "node:path";
import { canonicalJson, hashCanonical, ValidationError } from "./contracts/index.js";
import { validateRunEvent } from "./contracts/validators.js";

function eventBody(event) {
  const { eventHash: _ignored, ...body } = event;
  return body;
}

export class AppendOnlyLedger {
  #path;
  #tail = Promise.resolve();
  #last = null;

  constructor(path) { this.#path = path; }

  async initialize() {
    await mkdir(dirname(this.#path), { recursive: true });
    try {
      const verified = await verifyLedger(this.#path);
      this.#last = verified.events.at(-1) ?? null;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    return this;
  }

  append(input) {
    const work = async () => {
      const event = {
        contractVersion: "1.0.0",
        runId: input.runId,
        sequence: this.#last ? this.#last.sequence + 1 : 0,
        type: input.type,
        occurredAt: input.occurredAt ?? new Date().toISOString(),
        payload: input.payload ?? {},
        previousHash: this.#last?.eventHash ?? null
      };
      validateRunEvent(event);
      const full = Object.freeze({ ...event, eventHash: hashCanonical(event) });
      await appendFile(this.#path, `${canonicalJson(full)}\n`, { encoding: "utf8", flag: "a" });
      this.#last = full;
      return full;
    };
    const result = this.#tail.then(work);
    this.#tail = result.catch(() => {});
    return result;
  }
}

export async function verifyLedger(path) {
  const text = await readFile(path, "utf8");
  if (text && !text.endsWith("\n")) throw new ValidationError("LEDGER_PARTIAL_RECORD", "$ledger", "Ledger ends with a partial record");
  const events = [];
  for (const [index, line] of text.split("\n").slice(0, -1).entries()) {
    let event;
    try { event = JSON.parse(line); } catch { throw new ValidationError("LEDGER_INVALID_JSON", `$ledger/${index}`, "Ledger record is not valid JSON"); }
    validateRunEvent(eventBody(event));
    if (event.sequence !== index) throw new ValidationError("LEDGER_SEQUENCE", `$ledger/${index}/sequence`, "Ledger sequence is not contiguous");
    const expectedPrevious = events.at(-1)?.eventHash ?? null;
    if (event.previousHash !== expectedPrevious) throw new ValidationError("LEDGER_CHAIN", `$ledger/${index}/previousHash`, "Ledger hash chain is broken");
    const expectedHash = hashCanonical(eventBody(event));
    if (event.eventHash !== expectedHash) throw new ValidationError("LEDGER_TAMPERED", `$ledger/${index}/eventHash`, "Ledger event hash does not match content");
    events.push(Object.freeze(event));
  }
  return { valid: true, events, headHash: events.at(-1)?.eventHash ?? null };
}

export function projectRun(events) {
  const runIds = new Set(events.map((event) => event.runId));
  if (runIds.size > 1) throw new ValidationError("LEDGER_MIXED_RUNS", "$ledger", "A run projection cannot combine multiple run ids");
  const projection = { runId: events[0]?.runId ?? null, status: "created", plan: null, steps: Object.create(null), artifacts: [], costs: [], policies: [], approvals: [], receipts: [], failures: [] };
  for (const event of events) {
    switch (event.type) {
      case "plan.created": projection.plan = event.payload; projection.status = "planned"; break;
      case "step.started": projection.steps[event.payload.stepId] = { status: "running", ...event.payload }; projection.status = "running"; break;
      case "step.completed": projection.steps[event.payload.stepId] = { ...projection.steps[event.payload.stepId], ...event.payload, status: "completed" }; break;
      case "artifact.created": projection.artifacts.push(event.payload); break;
      case "cost.recorded": projection.costs.push(event.payload); break;
      case "policy.decided": projection.policies.push(event.payload); break;
      case "approval.recorded": projection.approvals.push(event.payload); break;
      case "effect.receipt": projection.receipts.push(event.payload); break;
      case "step.failed": projection.steps[event.payload.stepId] = { ...projection.steps[event.payload.stepId], status: "failed", ...event.payload }; projection.failures.push(event.payload); projection.status = "failed"; break;
      case "run.completed": projection.status = "completed"; break;
      case "run.failed": projection.status = "failed"; projection.failures.push(event.payload); break;
    }
  }
  return projection;
}
