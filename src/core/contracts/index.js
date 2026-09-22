// SPDX-License-Identifier: Apache-2.0
import { createHash } from "node:crypto";

const SUPPORTED_SCHEMA_KEYWORDS = new Set([
  "$id", "$schema", "$defs", "title", "description", "default", "examples",
  "type", "properties", "required", "additionalProperties", "items",
  "minItems", "maxItems", "uniqueItems", "minProperties", "maxProperties",
  "enum", "const", "minLength", "maxLength", "pattern", "format",
  "minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum", "multipleOf",
  "allOf", "anyOf", "oneOf", "not", "$ref"
]);

const FORMATS = {
  "date-time": (value) => typeof value === "string" && Number.isFinite(Date.parse(value)) && /[zZ]|[+-]\d\d:\d\d$/.test(value),
  date: (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`)),
  uri: (value) => {
    try { new URL(value); return true; } catch { return false; }
  },
  uuid: (value) => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
};

export class ValidationError extends Error {
  constructor(code, path, message, details = {}) {
    super(message);
    this.name = "ValidationError";
    this.code = code;
    this.path = path;
    this.details = details;
  }

  toJSON() {
    return { name: this.name, code: this.code, path: this.path, message: this.message, details: this.details };
  }
}

function fail(code, path, message, details) {
  throw new ValidationError(code, path, message, details);
}

function canonicalValue(value, seen, path) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail("CANONICAL_NUMBER", path, "Canonical JSON only supports finite numbers");
    return Object.is(value, -0) ? 0 : value;
  }
  if (typeof value !== "object") fail("CANONICAL_TYPE", path, `Unsupported canonical JSON value: ${typeof value}`);
  if (seen.has(value)) fail("CANONICAL_CYCLE", path, "Canonical JSON cannot contain cycles");
  seen.add(value);
  let result;
  if (Array.isArray(value)) {
    result = value.map((entry, index) => canonicalValue(entry, seen, `${path}/${index}`));
  } else {
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) fail("CANONICAL_OBJECT", path, "Only plain objects can be canonicalized");
    result = Object.create(null);
    for (const key of Object.keys(value).sort()) {
      if (value[key] === undefined) fail("CANONICAL_UNDEFINED", `${path}/${escapePointer(key)}`, "Undefined object members are not valid JSON");
      result[key] = canonicalValue(value[key], seen, `${path}/${escapePointer(key)}`);
    }
  }
  seen.delete(value);
  return result;
}

export function canonicalJson(value) {
  return JSON.stringify(canonicalValue(value, new Set(), "$"));
}

export function hashCanonical(value, algorithm = "sha256") {
  return `${algorithm}:${createHash(algorithm).update(canonicalJson(value)).digest("hex")}`;
}

export function assertContractVersion(actual, supported = ["1.0.0"], path = "$/contractVersion") {
  if (typeof actual !== "string") fail("CONTRACT_VERSION_REQUIRED", path, "Contract version must be a string");
  if (!supported.includes(actual)) fail("UNSUPPORTED_CONTRACT_VERSION", path, `Unsupported contract version ${actual}`, { actual, supported });
  return actual;
}

function escapePointer(value) {
  return String(value).replaceAll("~", "~0").replaceAll("/", "~1");
}

function valueType(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (Number.isInteger(value)) return "integer";
  return typeof value;
}

function typeMatches(value, expected) {
  if (Array.isArray(expected)) return expected.some((entry) => typeMatches(value, entry));
  if (expected === "object") return value !== null && typeof value === "object" && !Array.isArray(value);
  if (expected === "array") return Array.isArray(value);
  if (expected === "integer") return Number.isInteger(value);
  if (expected === "number") return typeof value === "number" && Number.isFinite(value);
  if (expected === "null") return value === null;
  return typeof value === expected;
}

function resolveRef(root, ref, path) {
  if (!ref.startsWith("#/")) fail("UNSUPPORTED_SCHEMA_REF", path, "Only local JSON Pointer references are supported", { ref });
  let current = root;
  for (const rawPart of ref.slice(2).split("/")) {
    const part = rawPart.replaceAll("~1", "/").replaceAll("~0", "~");
    if (!current || !Object.hasOwn(current, part)) fail("SCHEMA_REF_NOT_FOUND", path, `Schema reference not found: ${ref}`);
    current = current[part];
  }
  return current;
}

function assertSupportedSchema(schema, path = "$schema", seen = new Set()) {
  if (typeof schema === "boolean") return;
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) fail("INVALID_SCHEMA", path, "Schema must be an object or boolean");
  if (seen.has(schema)) return;
  seen.add(schema);
  for (const keyword of Object.keys(schema)) {
    if (!SUPPORTED_SCHEMA_KEYWORDS.has(keyword)) fail("UNSUPPORTED_SCHEMA_KEYWORD", `${path}/${escapePointer(keyword)}`, `Unsupported schema keyword: ${keyword}`);
  }
  for (const name of ["properties", "$defs"]) {
    if (schema[name]) for (const [key, child] of Object.entries(schema[name])) assertSupportedSchema(child, `${path}/${name}/${escapePointer(key)}`, seen);
  }
  if (schema.items && typeof schema.items === "object") assertSupportedSchema(schema.items, `${path}/items`, seen);
  if (schema.additionalProperties && typeof schema.additionalProperties === "object") assertSupportedSchema(schema.additionalProperties, `${path}/additionalProperties`, seen);
  for (const name of ["allOf", "anyOf", "oneOf"]) {
    if (schema[name]) schema[name].forEach((child, index) => assertSupportedSchema(child, `${path}/${name}/${index}`, seen));
  }
  if (schema.not) assertSupportedSchema(schema.not, `${path}/not`, seen);
}

function collectValidationErrors(schema, value, path, root, errors, state = { activeRefs: new Map(), depth: 0, budget: { work: 0 } }) {
  state.budget.work += 1;
  if (state.budget.work > 10_000) fail("SCHEMA_WORK_LIMIT", path, "Schema validation exceeded its work budget");
  if (state.depth > 256) fail("SCHEMA_DEPTH_LIMIT", path, "Schema validation exceeded its depth budget");
  if (schema === true) return;
  if (schema === false) { errors.push(new ValidationError("SCHEMA_FALSE", path, "Value is disallowed by schema")); return; }
  if (schema.$ref) {
    const target = resolveRef(root, schema.$ref, path);
    const paths = state.activeRefs.get(target) ?? new Set();
    if (paths.has(path)) fail("SCHEMA_REF_CYCLE", path, `Schema reference cycle detected: ${schema.$ref}`);
    paths.add(path); state.activeRefs.set(target, paths);
    try { return collectValidationErrors(target, value, path, root, errors, { ...state, depth: state.depth + 1 }); }
    finally { paths.delete(path); if (!paths.size) state.activeRefs.delete(target); }
  }
  if (schema.type && !typeMatches(value, schema.type)) {
    errors.push(new ValidationError("SCHEMA_TYPE", path, `Expected ${[].concat(schema.type).join(" or ")}, got ${valueType(value)}`, { expected: schema.type, actual: valueType(value) }));
    return;
  }
  if (schema.enum && !schema.enum.some((entry) => canonicalJson(entry) === canonicalJson(value))) errors.push(new ValidationError("SCHEMA_ENUM", path, "Value is not in enum"));
  if (Object.hasOwn(schema, "const") && canonicalJson(schema.const) !== canonicalJson(value)) errors.push(new ValidationError("SCHEMA_CONST", path, "Value does not match const"));

  if (typeof value === "string") {
    if (schema.minLength !== undefined && [...value].length < schema.minLength) errors.push(new ValidationError("SCHEMA_MIN_LENGTH", path, `String is shorter than ${schema.minLength}`));
    if (schema.maxLength !== undefined && [...value].length > schema.maxLength) errors.push(new ValidationError("SCHEMA_MAX_LENGTH", path, `String is longer than ${schema.maxLength}`));
    if (schema.pattern !== undefined) {
      let regex;
      try { regex = new RegExp(schema.pattern, "u"); } catch { fail("INVALID_SCHEMA_PATTERN", "$schema/pattern", "Schema pattern is not a valid regular expression"); }
      if (!regex.test(value)) errors.push(new ValidationError("SCHEMA_PATTERN", path, "String does not match pattern", { pattern: schema.pattern }));
    }
    if (schema.format && (!FORMATS[schema.format] || !FORMATS[schema.format](value))) errors.push(new ValidationError("SCHEMA_FORMAT", path, `String is not a valid ${schema.format}`));
  }
  if (typeof value === "number") {
    if (schema.minimum !== undefined && value < schema.minimum) errors.push(new ValidationError("SCHEMA_MINIMUM", path, `Number is less than ${schema.minimum}`));
    if (schema.maximum !== undefined && value > schema.maximum) errors.push(new ValidationError("SCHEMA_MAXIMUM", path, `Number is greater than ${schema.maximum}`));
    if (schema.exclusiveMinimum !== undefined && value <= schema.exclusiveMinimum) errors.push(new ValidationError("SCHEMA_EXCLUSIVE_MINIMUM", path, `Number must be greater than ${schema.exclusiveMinimum}`));
    if (schema.exclusiveMaximum !== undefined && value >= schema.exclusiveMaximum) errors.push(new ValidationError("SCHEMA_EXCLUSIVE_MAXIMUM", path, `Number must be less than ${schema.exclusiveMaximum}`));
    if (schema.multipleOf !== undefined && Math.abs(value / schema.multipleOf - Math.round(value / schema.multipleOf)) > Number.EPSILON * 10) errors.push(new ValidationError("SCHEMA_MULTIPLE_OF", path, `Number is not a multiple of ${schema.multipleOf}`));
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) errors.push(new ValidationError("SCHEMA_MIN_ITEMS", path, `Array has fewer than ${schema.minItems} items`));
    if (schema.maxItems !== undefined && value.length > schema.maxItems) errors.push(new ValidationError("SCHEMA_MAX_ITEMS", path, `Array has more than ${schema.maxItems} items`));
    if (schema.uniqueItems) {
      const entries = value.map(canonicalJson);
      if (new Set(entries).size !== entries.length) errors.push(new ValidationError("SCHEMA_UNIQUE_ITEMS", path, "Array items are not unique"));
    }
    if (schema.items) value.forEach((entry, index) => collectValidationErrors(schema.items, entry, `${path}/${index}`, root, errors, { ...state, depth: state.depth + 1 }));
  }
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    const keys = Object.keys(value);
    if (schema.minProperties !== undefined && keys.length < schema.minProperties) errors.push(new ValidationError("SCHEMA_MIN_PROPERTIES", path, `Object has fewer than ${schema.minProperties} properties`));
    if (schema.maxProperties !== undefined && keys.length > schema.maxProperties) errors.push(new ValidationError("SCHEMA_MAX_PROPERTIES", path, `Object has more than ${schema.maxProperties} properties`));
    for (const required of schema.required ?? []) if (!Object.hasOwn(value, required)) errors.push(new ValidationError("SCHEMA_REQUIRED", `${path}/${escapePointer(required)}`, `Required property is missing: ${required}`));
    for (const [key, entry] of Object.entries(value)) {
      if (schema.properties?.[key]) collectValidationErrors(schema.properties[key], entry, `${path}/${escapePointer(key)}`, root, errors, { ...state, depth: state.depth + 1 });
      else if (schema.additionalProperties === false) errors.push(new ValidationError("SCHEMA_ADDITIONAL_PROPERTY", `${path}/${escapePointer(key)}`, `Additional property is not allowed: ${key}`));
      else if (schema.additionalProperties && typeof schema.additionalProperties === "object") collectValidationErrors(schema.additionalProperties, entry, `${path}/${escapePointer(key)}`, root, errors, { ...state, depth: state.depth + 1 });
    }
  }
  for (const child of schema.allOf ?? []) collectValidationErrors(child, value, path, root, errors, { ...state, depth: state.depth + 1 });
  for (const name of ["anyOf", "oneOf"]) {
    if (!schema[name]) continue;
    const validCount = schema[name].filter((child) => {
      const branch = [];
      collectValidationErrors(child, value, path, root, branch, { ...state, depth: state.depth + 1 });
      return branch.length === 0;
    }).length;
    if ((name === "anyOf" && validCount === 0) || (name === "oneOf" && validCount !== 1)) errors.push(new ValidationError(`SCHEMA_${name.toUpperCase()}`, path, `${name} constraint failed`, { validCount }));
  }
  if (schema.not) {
    const branch = [];
    collectValidationErrors(schema.not, value, path, root, branch, { ...state, depth: state.depth + 1 });
    if (branch.length === 0) errors.push(new ValidationError("SCHEMA_NOT", path, "Value matches disallowed schema"));
  }
}

export function validateSchema(schema, value, { throwOnError = true } = {}) {
  assertSupportedSchema(schema);
  const errors = [];
  collectValidationErrors(schema, value, "$", schema, errors);
  if (throwOnError && errors.length) throw errors[0];
  return { valid: errors.length === 0, errors };
}

export function assertObject(value, path = "$") {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("TYPE_OBJECT", path, "Expected an object");
  return value;
}

export function assertFields(value, required, allowed = null, path = "$") {
  assertObject(value, path);
  for (const key of required) if (!Object.hasOwn(value, key)) fail("FIELD_REQUIRED", `${path}/${escapePointer(key)}`, `Required field is missing: ${key}`);
  if (allowed) for (const key of Object.keys(value)) if (!allowed.includes(key)) fail("FIELD_UNKNOWN", `${path}/${escapePointer(key)}`, `Unknown field: ${key}`);
  return value;
}

export const SUPPORTED_CONTRACT_VERSIONS = Object.freeze(["1.0.0"]);
