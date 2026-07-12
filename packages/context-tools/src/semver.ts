/**
 * Minimal semver implementation for context-package version ranges.
 *
 * Supported range syntax (only these four forms):
 *   - exact:  "1.2.3"
 *   - caret:  "^1.2.3"  (compatible within leftmost non-zero component)
 *   - tilde:  "~1.2.3"  (patch-level changes only)
 *   - gte:    ">=1.2.3" (any version at or above)
 *
 * Anything else (wildcards, hyphen ranges, unions, prerelease tags,
 * build metadata, <, <=, >, =) raises a SemverError.
 */

export class SemverError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SemverError";
  }
}

export interface Version {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
}

export type RangeKind = "exact" | "caret" | "tilde" | "gte";

export interface Range {
  readonly kind: RangeKind;
  readonly base: Version;
}

const VERSION_RE = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export function parseVersion(input: string): Version {
  if (typeof input !== "string") {
    throw new SemverError(`version must be a string, got ${typeof input}`);
  }
  const match = VERSION_RE.exec(input);
  if (match === null) {
    throw new SemverError(
      `invalid version "${input}": expected "major.minor.patch" with numeric components ` +
        `(prerelease tags and build metadata are not supported)`,
    );
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function compareParsed(a: Version, b: Version): -1 | 0 | 1 {
  if (a.major !== b.major) return a.major < b.major ? -1 : 1;
  if (a.minor !== b.minor) return a.minor < b.minor ? -1 : 1;
  if (a.patch !== b.patch) return a.patch < b.patch ? -1 : 1;
  return 0;
}

export function compareVersions(a: string, b: string): -1 | 0 | 1 {
  return compareParsed(parseVersion(a), parseVersion(b));
}

export function parseRange(range: string): Range {
  if (typeof range !== "string" || range.length === 0) {
    throw new SemverError("range must be a non-empty string");
  }
  if (range.startsWith("^")) {
    return { kind: "caret", base: parseVersion(range.slice(1)) };
  }
  if (range.startsWith("~")) {
    return { kind: "tilde", base: parseVersion(range.slice(1)) };
  }
  if (range.startsWith(">=")) {
    return { kind: "gte", base: parseVersion(range.slice(2)) };
  }
  if (/^[<>=]/.test(range) || /[\s|*xX-]/.test(range)) {
    throw new SemverError(
      `unsupported range syntax "${range}": only exact ("1.2.3"), caret ("^1.2.3"), ` +
        `tilde ("~1.2.3"), and ">=1.2.3" ranges are supported`,
    );
  }
  return { kind: "exact", base: parseVersion(range) };
}

export function isValidRange(range: string): boolean {
  try {
    parseRange(range);
    return true;
  } catch {
    return false;
  }
}

/** Exclusive upper bound for caret ranges, per npm semantics. */
function caretUpperBound(base: Version): Version {
  if (base.major > 0) {
    return { major: base.major + 1, minor: 0, patch: 0 };
  }
  if (base.minor > 0) {
    return { major: 0, minor: base.minor + 1, patch: 0 };
  }
  return { major: 0, minor: 0, patch: base.patch + 1 };
}

export function satisfies(version: string, range: string): boolean {
  const v = parseVersion(version);
  const r = parseRange(range);
  const cmp = compareParsed(v, r.base);
  switch (r.kind) {
    case "exact":
      return cmp === 0;
    case "gte":
      return cmp >= 0;
    case "caret":
      return cmp >= 0 && compareParsed(v, caretUpperBound(r.base)) < 0;
    case "tilde": {
      const upper: Version = {
        major: r.base.major,
        minor: r.base.minor + 1,
        patch: 0,
      };
      return cmp >= 0 && compareParsed(v, upper) < 0;
    }
  }
}
