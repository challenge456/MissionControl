export { ManifestError, isValidPackageSlug, parseManifest, serializeManifest } from "./manifest.js";
export type { Manifest } from "./manifest.js";

export { LockError, CONTENT_HASH_RE, parseLock, serializeLock } from "./lock.js";
export type { Lock, LockedPackage } from "./lock.js";

export { SemverError, parseVersion, compareVersions, parseRange, isValidRange, satisfies } from "./semver.js";
export type { Version, Range, RangeKind } from "./semver.js";

export { resolve, diffLock, checkOutdated } from "./resolver.js";
export type {
  AvailablePackage,
  ResolvedPackage,
  Requirement,
  MissingIssue,
  ConflictIssue,
  CircularIssue,
  ResolutionIssue,
  ResolutionResult,
  LockDiff,
  LockDiffChange,
  OutdatedPackage,
} from "./resolver.js";
