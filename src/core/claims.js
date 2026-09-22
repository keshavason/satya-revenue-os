// SPDX-License-Identifier: Apache-2.0
import { randomUUID } from "node:crypto";
import { validateClaim } from "./contracts/validators.js";
import { ValidationError } from "./contracts/index.js";

export function createClaim(input, { now = () => new Date().toISOString(), id = randomUUID } = {}) {
  const claim = {
    contractVersion: "1.0.0",
    id: input.id ?? id(),
    text: input.text,
    class: input.class,
    evidenceState: input.evidenceState ?? "unknown",
    sources: [...(input.sources ?? [])],
    confidence: input.confidence ?? 0,
    createdAt: input.createdAt ?? now(),
    validity: input.validity ?? { from: null, to: null },
    contradictions: [...(input.contradictions ?? [])],
    derivedFrom: [...(input.derivedFrom ?? [])]
  };
  return Object.freeze(validateClaim(claim));
}

export function deriveClaim(sources, input, options) {
  if (!Array.isArray(sources) || !sources.length) throw new ValidationError("DERIVATION_SOURCE_REQUIRED", "$/sources", "A derived claim needs at least one source claim");
  sources.forEach(validateClaim);
  const requestedClass = input.class ?? "inference";
  if (["observed_fact", "external_datum"].includes(requestedClass) && sources.some((source) => source.class !== requestedClass)) {
    throw new ValidationError("CLAIM_CLASS_PROMOTION", "$/class", "Derivation cannot promote repeated claims to observed or external data");
  }
  const directSources = new Set(input.sources ?? []);
  for (const source of sources) for (const ref of source.sources) directSources.add(ref);
  return createClaim({
    ...input,
    class: requestedClass,
    sources: [...directSources],
    derivedFrom: [...new Set([...sources.map((source) => source.id), ...(input.derivedFrom ?? [])])]
  }, options);
}

export function contradictClaims(left, right) {
  validateClaim(left); validateClaim(right);
  if (left.id === right.id) throw new ValidationError("SELF_CONTRADICTION", "$/id", "A claim cannot contradict itself");
  return [
    Object.freeze({ ...left, contradictions: [...new Set([...left.contradictions, right.id])] }),
    Object.freeze({ ...right, contradictions: [...new Set([...right.contradictions, left.id])] })
  ];
}

export function claimValidity(claim, at = new Date()) {
  validateClaim(claim);
  const instant = at instanceof Date ? at.getTime() : Date.parse(at);
  const from = claim.validity.from === null ? -Infinity : Date.parse(claim.validity.from);
  const to = claim.validity.to === null ? Infinity : Date.parse(claim.validity.to);
  return { valid: instant >= from && instant <= to, from: claim.validity.from, to: claim.validity.to };
}

