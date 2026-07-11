/**
 * Context package validation and lifecycle rules.
 *
 * Pure functions only — no Convex imports — so slug/semver/hash validation
 * and status-transition rules are unit testable and reusable from queries,
 * mutations, and the CLI.
 *
 * CONTENT HASHING DECISION: the Convex query/mutation runtime has no
 * node:crypto, so `contentHash` values (format `sha256:<64 hex chars>`) are
 * computed by the caller (CLI/client tooling, PR 5) and only VALIDATED here.
 * Mutations reject malformed hashes but never compute them.
 */

export type ContextPackageStatus = "DRAFT" | "ACTIVE" | "DEPRECATED";
export type ContextVersionStatus = "DRAFT" | "PUBLISHED" | "DEPRECATED";

/**
 * Package slug: exactly one "/" separating a scope and a name. Each side is
 * one or more lowercase alphanumeric segments joined by single "-" or ".".
 * Examples: "anthropic/skill-creator", "mission-control/arm.policy".
 */
const SLUG_PATTERN =
  /^[a-z0-9]+(?:[-.][a-z0-9]+)*\/[a-z0-9]+(?:[-.][a-z0-9]+)*$/;

/** Strict numeric semver "x.y.z" — no leading zeros, no prerelease/build. */
const SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

/** Content hash: "sha256:" followed by 64 lowercase hex chars. */
const CONTENT_HASH_PATTERN = /^sha256:[0-9a-f]{64}$/;

export function isValidPackageSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

export function isValidSemver(version: string): boolean {
  return SEMVER_PATTERN.test(version);
}

/**
 * Compare two valid semver strings numerically.
 * Returns -1 if a < b, 0 if equal, 1 if a > b.
 * Throws on malformed input — validate with isValidSemver first.
 */
export function compareSemver(a: string, b: string): -1 | 0 | 1 {
  if (!isValidSemver(a) || !isValidSemver(b)) {
    throw new Error(`compareSemver requires valid semver, got "${a}", "${b}"`);
  }
  const partsA = a.split(".").map(Number);
  const partsB = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if (partsA[i] < partsB[i]) return -1;
    if (partsA[i] > partsB[i]) return 1;
  }
  return 0;
}

/** Next patch release of a valid semver string, e.g. "1.2.3" -> "1.2.4". */
export function nextPatchVersion(version: string): string {
  if (!isValidSemver(version)) {
    throw new Error(`nextPatchVersion requires valid semver, got "${version}"`);
  }
  const [major, minor, patch] = version.split(".").map(Number);
  return `${major}.${minor}.${patch + 1}`;
}

export function isValidContentHash(hash: string): boolean {
  return CONTENT_HASH_PATTERN.test(hash);
}

/**
 * Package lifecycle: DRAFT <-> ACTIVE -> DEPRECATED.
 * A draft can be activated and an active package can be pulled back to
 * draft; only ACTIVE packages can be deprecated (deprecation implies prior
 * availability). DEPRECATED is terminal.
 */
const PACKAGE_TRANSITIONS: Record<
  ContextPackageStatus,
  readonly ContextPackageStatus[]
> = {
  DRAFT: ["ACTIVE"],
  ACTIVE: ["DRAFT", "DEPRECATED"],
  DEPRECATED: [],
};

/**
 * Version lifecycle: DRAFT -> PUBLISHED -> DEPRECATED, plus
 * DRAFT -> DEPRECATED to abandon a never-published draft. Published rows are
 * immutable except this single deprecation transition. DEPRECATED is
 * terminal; nothing ever returns to DRAFT or re-publishes.
 */
const VERSION_TRANSITIONS: Record<
  ContextVersionStatus,
  readonly ContextVersionStatus[]
> = {
  DRAFT: ["PUBLISHED", "DEPRECATED"],
  PUBLISHED: ["DEPRECATED"],
  DEPRECATED: [],
};

export function canTransitionPackageStatus(
  from: ContextPackageStatus,
  to: ContextPackageStatus
): boolean {
  return PACKAGE_TRANSITIONS[from]?.includes(to) ?? false;
}

export function canTransitionVersionStatus(
  from: ContextVersionStatus,
  to: ContextVersionStatus
): boolean {
  return VERSION_TRANSITIONS[from]?.includes(to) ?? false;
}
