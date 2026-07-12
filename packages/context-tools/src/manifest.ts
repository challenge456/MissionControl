/**
 * Context manifest format.
 *
 * {
 *   "schemaVersion": "1.0",
 *   "repository": "owner/repo",
 *   "contextPackages": { "software-factory/pr-delivery": "^1.3.0" }
 * }
 */

import { isValidRange } from "./semver.js";

export class ManifestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ManifestError";
  }
}

export interface Manifest {
  readonly schemaVersion: "1.0";
  readonly repository: string;
  readonly contextPackages: Record<string, string>;
}

const MANIFEST_KEYS = ["schemaVersion", "repository", "contextPackages"] as const;

const SLUG_SEGMENT_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Slug format: "scope/name", both segments lowercase kebab-case. */
export function isValidPackageSlug(slug: string): boolean {
  if (typeof slug !== "string") return false;
  const parts = slug.split("/");
  if (parts.length !== 2) return false;
  return SLUG_SEGMENT_RE.test(parts[0]) && SLUG_SEGMENT_RE.test(parts[1]);
}

function asRecord(value: unknown, path: string, errorCtor: new (m: string) => Error): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new errorCtor(`"${path}" must be an object`);
  }
  return value as Record<string, unknown>;
}

function validateContextPackages(value: unknown): Record<string, string> {
  const record = asRecord(value, "contextPackages", ManifestError);
  const result: Record<string, string> = {};
  for (const [slug, range] of Object.entries(record)) {
    if (!isValidPackageSlug(slug)) {
      throw new ManifestError(
        `"contextPackages.${slug}": invalid package slug — expected "scope/name" in lowercase kebab-case`,
      );
    }
    if (typeof range !== "string") {
      throw new ManifestError(`"contextPackages.${slug}" must be a version range string`);
    }
    if (!isValidRange(range)) {
      throw new ManifestError(
        `"contextPackages.${slug}": invalid version range "${range}" — supported forms: ` +
          `"1.2.3", "^1.2.3", "~1.2.3", ">=1.2.3"`,
      );
    }
    result[slug] = range;
  }
  return result;
}

export function parseManifest(json: string): Manifest {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch (err) {
    throw new ManifestError(`manifest is not valid JSON: ${err instanceof Error ? err.message : String(err)}`);
  }
  const obj = asRecord(raw, "(root)", ManifestError);

  for (const key of Object.keys(obj)) {
    if (!(MANIFEST_KEYS as readonly string[]).includes(key)) {
      throw new ManifestError(`unknown top-level key "${key}" — allowed keys: ${MANIFEST_KEYS.join(", ")}`);
    }
  }
  if (obj.schemaVersion !== "1.0") {
    throw new ManifestError(`"schemaVersion" must be "1.0", got ${JSON.stringify(obj.schemaVersion)}`);
  }
  if (typeof obj.repository !== "string" || obj.repository.length === 0) {
    throw new ManifestError(`"repository" must be a non-empty string`);
  }
  if (!("contextPackages" in obj)) {
    throw new ManifestError(`missing required key "contextPackages"`);
  }

  return {
    schemaVersion: "1.0",
    repository: obj.repository,
    contextPackages: validateContextPackages(obj.contextPackages),
  };
}

/** Stable key order (schemaVersion, repository, then sorted contextPackages), 2-space indent. */
export function serializeManifest(m: Manifest): string {
  const contextPackages: Record<string, string> = {};
  for (const slug of Object.keys(m.contextPackages).sort()) {
    contextPackages[slug] = m.contextPackages[slug];
  }
  const ordered = {
    schemaVersion: m.schemaVersion,
    repository: m.repository,
    contextPackages,
  };
  return JSON.stringify(ordered, null, 2) + "\n";
}
