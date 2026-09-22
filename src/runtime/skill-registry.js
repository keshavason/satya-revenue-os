// SPDX-License-Identifier: Apache-2.0
import { readFile, readdir, realpath, stat } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { ValidationError } from "../core/contracts/index.js";
import { validateSkillManifest } from "../core/contracts/validators.js";

function skillFrontmatter(markdown) {
  if (!markdown.startsWith("---\n") && !markdown.startsWith("---\r\n")) throw new ValidationError("SKILL_FRONTMATTER", "$/SKILL.md", "SKILL.md must begin with YAML frontmatter");
  const end = markdown.indexOf("\n---", 4);
  if (end < 0) throw new ValidationError("SKILL_FRONTMATTER", "$/SKILL.md", "SKILL.md frontmatter is not closed");
  const values = {};
  for (const line of markdown.slice(markdown.indexOf("\n") + 1, end).split(/\r?\n/u)) {
    const match = /^([A-Za-z][\w-]*):\s*(.+)$/u.exec(line);
    if (match) values[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, "");
  }
  if (!values.name || !values.description) throw new ValidationError("SKILL_DISCOVERY_FIELDS", "$/SKILL.md", "SKILL.md frontmatter requires name and description");
  return values;
}

async function containedFile(root, base, reference, errorPath) {
  if (isAbsolute(reference)) throw new ValidationError("SKILL_REFERENCE_ESCAPE", errorPath, "Skill references must be relative");
  try {
    const canonical = await realpath(resolve(base, reference));
    const fromRoot = relative(root, canonical);
    if (fromRoot === ".." || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot)) throw new ValidationError("SKILL_REFERENCE_ESCAPE", errorPath, "Skill reference escapes the configured root");
    if (!(await stat(canonical)).isFile()) throw new Error();
    return canonical;
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new ValidationError("SKILL_REFERENCE_NOT_FOUND", errorPath, `Referenced file does not exist: ${reference}`);
  }
}

export class SkillRegistry {
  #skills = new Map();
  #root = null;

  register(manifest, metadata = {}) {
    validateSkillManifest(manifest);
    const key = `${manifest.id}@${manifest.version}`;
    if (this.#skills.has(key) || [...this.#skills.values()].some((skill) => skill.manifest.id === manifest.id)) throw new ValidationError("SKILL_DUPLICATE", "$/id", `Duplicate skill id: ${manifest.id}`);
    const permissionSet = new Set(manifest.permissions);
    if (permissionSet.has("none") && permissionSet.size > 1) throw new ValidationError("PERMISSIONS_AMBIGUOUS", "$/permissions", "Permission 'none' cannot be combined with other permissions");
    const effectSet = new Set(manifest.effects);
    if (effectSet.has("none") && effectSet.size > 1) throw new ValidationError("EFFECTS_AMBIGUOUS", "$/effects", "Effect 'none' cannot be combined with effectful operations");
    const registered = Object.freeze({ manifest: Object.freeze(structuredClone(manifest)), ...metadata });
    this.#skills.set(key, registered);
    return registered;
  }

  get(id) { return [...this.#skills.values()].find((entry) => entry.manifest.id === id) ?? null; }
  list() { return [...this.#skills.values()].sort((a, b) => a.manifest.id.localeCompare(b.manifest.id)); }

  async discover(root) {
    this.#root = await realpath(root);
    const directories = (await readdir(this.#root, { withFileTypes: true })).filter((entry) => entry.isDirectory()).sort((a, b) => a.name.localeCompare(b.name));
    for (const directory of directories) {
      const base = join(this.#root, directory.name);
      const [manifestText, markdown] = await Promise.all([readFile(join(base, "skill.json"), "utf8"), readFile(join(base, "SKILL.md"), "utf8")]);
      let manifest;
      try { manifest = JSON.parse(manifestText); } catch { throw new ValidationError("SKILL_MANIFEST_JSON", `$/skills/${directory.name}/skill.json`, "Skill manifest is not valid JSON"); }
      const discovery = skillFrontmatter(markdown);
      if (discovery.name !== manifest.id) throw new ValidationError("SKILL_NAME_MISMATCH", `$/skills/${directory.name}/SKILL.md`, "SKILL.md name must equal manifest id");
      const [inputSchemaPath, outputSchemaPath, entrypointPath] = await Promise.all([
        containedFile(this.#root, base, manifest.inputSchema, "$/inputSchema"),
        containedFile(this.#root, base, manifest.outputSchema, "$/outputSchema"),
        containedFile(this.#root, base, manifest.entrypoint, "$/entrypoint")
      ]);
      this.register(manifest, { directory: base, discovery, inputSchemaPath, outputSchemaPath, entrypointPath });
    }
    return this;
  }

  async load(id) {
    const entry = this.get(id);
    if (!entry) throw new ValidationError("SKILL_NOT_FOUND", "$/skillId", `Skill not found: ${id}`);
    throw new ValidationError("SKILL_CODE_LOADING_DISABLED", "$/skillId", "RC1 validates discovered skill packages but never imports their code in-process");
  }
}

export const __dirname = dirname(fileURLToPath(import.meta.url));
