/**
 * Dependency resolution over a registry snapshot.
 *
 * Semantics:
 * - Each requirement picks the highest available version satisfying ALL
 *   ranges requested for that slug (breadth-first over transitive deps).
 * - "missing": the slug does not exist in the registry snapshot at all.
 * - "conflict": the slug exists, but no available version satisfies every
 *   requester's range (empty intersection over the snapshot).
 * - "circular": the resolved dependency graph contains a cycle. Resolution
 *   still terminates and the cycle members stay resolved; the cycle is
 *   reported as an issue.
 * - Output is deterministic: resolved keys and issues are sorted.
 */

import type { Manifest } from "./manifest.js";
import type { Lock, LockedPackage } from "./lock.js";
import { compareVersions, satisfies } from "./semver.js";

export interface AvailablePackage {
  readonly slug: string;
  readonly version: string;
  readonly contentHash: string;
  readonly sourceCommitSha: string;
  readonly dependencies: Record<string, string>;
}

export interface ResolvedPackage {
  readonly version: string;
  readonly contentHash: string;
  readonly sourceCommitSha: string;
}

export interface Requirement {
  readonly requestedBy: string;
  readonly range: string;
}

export interface MissingIssue {
  readonly kind: "missing";
  readonly slug: string;
  readonly requestedBy: string;
}

export interface ConflictIssue {
  readonly kind: "conflict";
  readonly slug: string;
  readonly requirements: Requirement[];
}

export interface CircularIssue {
  readonly kind: "circular";
  readonly cycle: string[];
}

export type ResolutionIssue = MissingIssue | ConflictIssue | CircularIssue;

export interface ResolutionResult {
  readonly ok: boolean;
  readonly resolved: Record<string, ResolvedPackage>;
  readonly issues: ResolutionIssue[];
}

const MANIFEST_REQUESTER = "manifest";
const MAX_ITERATIONS = 100_000;

function indexAvailable(available: AvailablePackage[]): Map<string, AvailablePackage[]> {
  const index = new Map<string, AvailablePackage[]>();
  for (const pkg of available) {
    const list = index.get(pkg.slug);
    if (list === undefined) {
      index.set(pkg.slug, [pkg]);
    } else {
      list.push(pkg);
    }
  }
  for (const list of index.values()) {
    list.sort((a, b) => compareVersions(b.version, a.version));
  }
  return index;
}

/** Highest version satisfying every requirement, or undefined. */
function pickVersion(
  candidates: AvailablePackage[],
  requirements: Requirement[],
): AvailablePackage | undefined {
  return candidates.find((pkg) => requirements.every((req) => satisfies(pkg.version, req.range)));
}

interface ResolutionState {
  readonly index: Map<string, AvailablePackage[]>;
  readonly requirements: Map<string, Requirement[]>;
  readonly resolved: Map<string, AvailablePackage>;
  readonly missing: Map<string, MissingIssue>;
  readonly conflicts: Map<string, ConflictIssue>;
  readonly queue: string[];
}

function addRequirement(state: ResolutionState, slug: string, req: Requirement): void {
  const existing = state.requirements.get(slug);
  if (existing === undefined) {
    state.requirements.set(slug, [req]);
    state.queue.push(slug);
    return;
  }
  const duplicate = existing.some((r) => r.requestedBy === req.requestedBy && r.range === req.range);
  if (duplicate) return;
  existing.push(req);
  const current = state.resolved.get(slug);
  if (current === undefined || !satisfies(current.version, req.range)) {
    state.queue.push(slug);
  }
}

function resolveSlug(state: ResolutionState, slug: string): void {
  const requirements = state.requirements.get(slug) ?? [];
  const candidates = state.index.get(slug);
  if (candidates === undefined) {
    if (!state.missing.has(slug)) {
      state.missing.set(slug, { kind: "missing", slug, requestedBy: requirements[0]?.requestedBy ?? MANIFEST_REQUESTER });
    }
    return;
  }
  const picked = pickVersion(candidates, requirements);
  if (picked === undefined) {
    state.conflicts.set(slug, { kind: "conflict", slug, requirements: [...requirements] });
    state.resolved.delete(slug);
    return;
  }
  state.conflicts.delete(slug);
  const previous = state.resolved.get(slug);
  if (previous !== undefined && previous.version === picked.version) return;
  state.resolved.set(slug, picked);
  for (const depSlug of Object.keys(picked.dependencies).sort()) {
    addRequirement(state, depSlug, { requestedBy: slug, range: picked.dependencies[depSlug] });
  }
}

/** All elementary cycles reachable in the resolved graph, deduplicated. */
function detectCycles(resolved: Map<string, AvailablePackage>): CircularIssue[] {
  const cycles = new Map<string, CircularIssue>();
  const visited = new Set<string>();

  const visit = (slug: string, path: string[]): void => {
    const onPathAt = path.indexOf(slug);
    if (onPathAt !== -1) {
      const cycle = path.slice(onPathAt);
      const rotation = cycle.indexOf([...cycle].sort()[0]);
      const canonical = [...cycle.slice(rotation), ...cycle.slice(0, rotation)];
      cycles.set(canonical.join("->"), { kind: "circular", cycle: canonical });
      return;
    }
    if (visited.has(slug)) return;
    const pkg = resolved.get(slug);
    if (pkg === undefined) return;
    for (const dep of Object.keys(pkg.dependencies).sort()) {
      visit(dep, [...path, slug]);
    }
    visited.add(slug);
  };

  for (const slug of [...resolved.keys()].sort()) {
    visit(slug, []);
  }
  return [...cycles.values()].sort((a, b) => a.cycle.join() < b.cycle.join() ? -1 : 1);
}

function issueSortKey(issue: ResolutionIssue): string {
  const slug = issue.kind === "circular" ? issue.cycle.join("->") : issue.slug;
  return `${issue.kind}:${slug}`;
}

export function resolve(manifest: Manifest, available: AvailablePackage[]): ResolutionResult {
  const state: ResolutionState = {
    index: indexAvailable(available),
    requirements: new Map(),
    resolved: new Map(),
    missing: new Map(),
    conflicts: new Map(),
    queue: [],
  };

  for (const slug of Object.keys(manifest.contextPackages).sort()) {
    addRequirement(state, slug, {
      requestedBy: MANIFEST_REQUESTER,
      range: manifest.contextPackages[slug],
    });
  }

  let iterations = 0;
  while (state.queue.length > 0) {
    if (++iterations > MAX_ITERATIONS) {
      throw new Error(`resolution did not converge after ${MAX_ITERATIONS} iterations`);
    }
    const slug = state.queue.shift() as string;
    resolveSlug(state, slug);
  }

  const resolved: Record<string, ResolvedPackage> = {};
  for (const slug of [...state.resolved.keys()].sort()) {
    const pkg = state.resolved.get(slug) as AvailablePackage;
    resolved[slug] = {
      version: pkg.version,
      contentHash: pkg.contentHash,
      sourceCommitSha: pkg.sourceCommitSha,
    };
  }

  const issues: ResolutionIssue[] = [
    ...state.missing.values(),
    ...state.conflicts.values(),
    ...detectCycles(state.resolved),
  ].sort((a, b) => (issueSortKey(a) < issueSortKey(b) ? -1 : 1));

  return { ok: issues.length === 0, resolved, issues };
}

export interface LockDiffChange {
  readonly slug: string;
  readonly from: LockedPackage;
  readonly to: LockedPackage;
}

export interface LockDiff {
  readonly added: string[];
  readonly removed: string[];
  readonly changed: LockDiffChange[];
}

export function diffLock(oldLock: Lock, newLock: Lock): LockDiff {
  const oldSlugs = Object.keys(oldLock.resolved);
  const newSlugs = Object.keys(newLock.resolved);
  const added = newSlugs.filter((slug) => !(slug in oldLock.resolved)).sort();
  const removed = oldSlugs.filter((slug) => !(slug in newLock.resolved)).sort();
  const changed: LockDiffChange[] = [];
  for (const slug of oldSlugs.filter((s) => s in newLock.resolved).sort()) {
    const from = oldLock.resolved[slug];
    const to = newLock.resolved[slug];
    const isChanged =
      from.version !== to.version ||
      from.contentHash !== to.contentHash ||
      from.sourceCommitSha !== to.sourceCommitSha;
    if (isChanged) changed.push({ slug, from, to });
  }
  return { added, removed, changed };
}

export interface OutdatedPackage {
  readonly slug: string;
  readonly current: string;
  /** Highest version in the registry snapshot (may cross major versions). */
  readonly latest: string;
  /** Highest version satisfying the manifest range, when a manifest is provided and the slug appears in it. */
  readonly latestSatisfying?: string;
}

export function checkOutdated(
  lock: Lock,
  available: AvailablePackage[],
  manifest?: Manifest,
): OutdatedPackage[] {
  const index = indexAvailable(available);
  const outdated: OutdatedPackage[] = [];
  for (const slug of Object.keys(lock.resolved).sort()) {
    const candidates = index.get(slug);
    if (candidates === undefined || candidates.length === 0) continue;
    const current = lock.resolved[slug].version;
    const latest = candidates[0].version;
    if (compareVersions(latest, current) <= 0) continue;
    const range = manifest?.contextPackages[slug];
    const satisfying =
      range === undefined ? undefined : candidates.find((pkg) => satisfies(pkg.version, range));
    const entry: OutdatedPackage = {
      slug,
      current,
      latest,
      ...(satisfying !== undefined && compareVersions(satisfying.version, current) > 0
        ? { latestSatisfying: satisfying.version }
        : {}),
    };
    outdated.push(entry);
  }
  return outdated;
}
