/**
 * Context lock file format.
 *
 * {
 *   "schemaVersion": "1.0",
 *   "resolved": {
 *     "software-factory/pr-delivery": {
 *       "version": "1.3.2",
 *       "contentHash": "sha256:<64 hex chars>",
 *       "sourceCommitSha": "abc123..."
 *     }
 *   }
 * }
 */

import { isValidPackageSlug } from "./manifest.js";
import { parseVersion, SemverError } from "./semver.js";

export class LockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LockError";
  }
}

export interface LockedPackage {
  readonly version: string;
  readonly contentHash: string;
  readonly sourceCommitSha: string;
}

export interface Lock {
  readonly schemaVersion: "1.0";
  readonly resolved: Record<string, LockedPackage>;
}

const LOCK_KEYS = ["schemaVersion", "resolved"] as const;
const ENTRY_KEYS = ["version", "contentHash", "sourceCommitSha"] as const;

export const CONTENT_HASH_RE = /^sha256:[0-9a-f]{64}$/;

function validateEntry(slug: string, value: unknown): LockedPackage {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new LockError(`"resolved.${slug}" must be an object`);
  }
  const entry = value as Record<string, unknown>;
  for (const key of Object.keys(entry)) {
    if (!(ENTRY_KEYS as readonly string[]).includes(key)) {
      throw new LockError(`"resolved.${slug}": unknown key "${key}" — allowed keys: ${ENTRY_KEYS.join(", ")}`);
    }
  }
  if (typeof entry.version !== "string") {
    throw new LockError(`"resolved.${slug}.version" must be a string`);
  }
  try {
    parseVersion(entry.version);
  } catch (err) {
    if (err instanceof SemverError) {
      throw new LockError(`"resolved.${slug}.version": ${err.message}`);
    }
    throw err;
  }
  if (typeof entry.contentHash !== "string" || !CONTENT_HASH_RE.test(entry.contentHash)) {
    throw new LockError(
      `"resolved.${slug}.contentHash" must match "sha256:" followed by 64 lowercase hex characters`,
    );
  }
  if (typeof entry.sourceCommitSha !== "string" || entry.sourceCommitSha.length === 0) {
    throw new LockError(`"resolved.${slug}.sourceCommitSha" must be a non-empty string`);
  }
  return {
    version: entry.version,
    contentHash: entry.contentHash,
    sourceCommitSha: entry.sourceCommitSha,
  };
}

export function parseLock(json: string): Lock {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch (err) {
    throw new LockError(`lock file is not valid JSON: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new LockError(`"(root)" must be an object`);
  }
  const obj = raw as Record<string, unknown>;

  for (const key of Object.keys(obj)) {
    if (!(LOCK_KEYS as readonly string[]).includes(key)) {
      throw new LockError(`unknown top-level key "${key}" — allowed keys: ${LOCK_KEYS.join(", ")}`);
    }
  }
  if (obj.schemaVersion !== "1.0") {
    throw new LockError(`"schemaVersion" must be "1.0", got ${JSON.stringify(obj.schemaVersion)}`);
  }
  if (typeof obj.resolved !== "object" || obj.resolved === null || Array.isArray(obj.resolved)) {
    throw new LockError(`"resolved" must be an object`);
  }

  const resolved: Record<string, LockedPackage> = {};
  for (const [slug, entry] of Object.entries(obj.resolved as Record<string, unknown>)) {
    if (!isValidPackageSlug(slug)) {
      throw new LockError(
        `"resolved.${slug}": invalid package slug — expected "scope/name" in lowercase kebab-case`,
      );
    }
    resolved[slug] = validateEntry(slug, entry);
  }
  return { schemaVersion: "1.0", resolved };
}

/** Stable key order (schemaVersion, then sorted resolved slugs), 2-space indent. */
export function serializeLock(lock: Lock): string {
  const resolved: Record<string, LockedPackage> = {};
  for (const slug of Object.keys(lock.resolved).sort()) {
    const entry = lock.resolved[slug];
    resolved[slug] = {
      version: entry.version,
      contentHash: entry.contentHash,
      sourceCommitSha: entry.sourceCommitSha,
    };
  }
  return JSON.stringify({ schemaVersion: lock.schemaVersion, resolved }, null, 2) + "\n";
}
