import { describe, expect, it } from "vitest";
import type { Manifest } from "../manifest.js";
import type { Lock } from "../lock.js";
import type { AvailablePackage } from "../resolver.js";
import { checkOutdated, diffLock, resolve } from "../resolver.js";

const HASH_A = `sha256:${"a".repeat(64)}`;
const HASH_B = `sha256:${"b".repeat(64)}`;

function pkg(
  slug: string,
  version: string,
  dependencies: Record<string, string> = {},
  contentHash: string = HASH_A,
): AvailablePackage {
  return { slug, version, contentHash, sourceCommitSha: `sha-${slug}-${version}`, dependencies };
}

function manifest(contextPackages: Record<string, string>): Manifest {
  return { schemaVersion: "1.0", repository: "owner/repo", contextPackages };
}

describe("resolve — happy path", () => {
  it("picks the highest version satisfying the range", () => {
    const result = resolve(manifest({ "sf/pr-delivery": "^1.3.0" }), [
      pkg("sf/pr-delivery", "1.3.0"),
      pkg("sf/pr-delivery", "1.4.2"),
      pkg("sf/pr-delivery", "2.0.0"),
    ]);
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.resolved["sf/pr-delivery"].version).toBe("1.4.2");
    expect(result.resolved["sf/pr-delivery"].contentHash).toBe(HASH_A);
    expect(result.resolved["sf/pr-delivery"].sourceCommitSha).toBe("sha-sf/pr-delivery-1.4.2");
  });

  it("resolves transitive dependencies breadth-first", () => {
    const result = resolve(manifest({ "sf/a": "^1.0.0" }), [
      pkg("sf/a", "1.0.0", { "sf/b": "~2.1.0" }),
      pkg("sf/b", "2.1.5", { "sf/c": ">=3.0.0" }),
      pkg("sf/b", "2.2.0"),
      pkg("sf/c", "3.4.0"),
    ]);
    expect(result.ok).toBe(true);
    expect(Object.keys(result.resolved)).toEqual(["sf/a", "sf/b", "sf/c"]);
    expect(result.resolved["sf/b"].version).toBe("2.1.5");
    expect(result.resolved["sf/c"].version).toBe("3.4.0");
  });

  it("returns sorted, deterministic resolved keys", () => {
    const available = [pkg("z/z", "1.0.0"), pkg("a/a", "1.0.0"), pkg("m/m", "1.0.0")];
    const result = resolve(manifest({ "z/z": "1.0.0", "a/a": "1.0.0", "m/m": "1.0.0" }), available);
    expect(Object.keys(result.resolved)).toEqual(["a/a", "m/m", "z/z"]);
    const again = resolve(manifest({ "m/m": "1.0.0", "a/a": "1.0.0", "z/z": "1.0.0" }), [...available].reverse());
    expect(again).toEqual(result);
  });

  it("unifies a shared dependency to one version satisfying both requesters", () => {
    const result = resolve(manifest({ "sf/a": "1.0.0", "sf/b": "1.0.0" }), [
      pkg("sf/a", "1.0.0", { "sf/shared": "^1.2.0" }),
      pkg("sf/b", "1.0.0", { "sf/shared": "~1.4.0" }),
      pkg("sf/shared", "1.4.9"),
      pkg("sf/shared", "1.5.0"),
    ]);
    expect(result.ok).toBe(true);
    expect(result.resolved["sf/shared"].version).toBe("1.4.9");
  });
});

describe("resolve — missing packages", () => {
  it("reports a package absent from the registry", () => {
    const result = resolve(manifest({ "sf/ghost": "^1.0.0" }), []);
    expect(result.ok).toBe(false);
    expect(result.issues).toEqual([{ kind: "missing", slug: "sf/ghost", requestedBy: "manifest" }]);
    expect(result.resolved).toEqual({});
  });

  it("reports the transitive requester of a missing package", () => {
    const result = resolve(manifest({ "sf/a": "1.0.0" }), [pkg("sf/a", "1.0.0", { "sf/ghost": "^2.0.0" })]);
    expect(result.ok).toBe(false);
    expect(result.issues).toEqual([{ kind: "missing", slug: "sf/ghost", requestedBy: "sf/a" }]);
    expect(result.resolved["sf/a"]).toBeDefined();
  });
});

describe("resolve — conflicts", () => {
  it("reports an empty intersection between two requesters", () => {
    const result = resolve(manifest({ "sf/a": "1.0.0", "sf/b": "1.0.0" }), [
      pkg("sf/a", "1.0.0", { "sf/shared": "^1.0.0" }),
      pkg("sf/b", "1.0.0", { "sf/shared": "^2.0.0" }),
      pkg("sf/shared", "1.9.0"),
      pkg("sf/shared", "2.3.0"),
    ]);
    expect(result.ok).toBe(false);
    expect(result.issues).toHaveLength(1);
    const issue = result.issues[0];
    expect(issue.kind).toBe("conflict");
    if (issue.kind === "conflict") {
      expect(issue.slug).toBe("sf/shared");
      expect(issue.requirements).toContainEqual({ requestedBy: "sf/a", range: "^1.0.0" });
      expect(issue.requirements).toContainEqual({ requestedBy: "sf/b", range: "^2.0.0" });
    }
    expect(result.resolved["sf/shared"]).toBeUndefined();
  });

  it("reports a conflict when no available version satisfies a single range", () => {
    const result = resolve(manifest({ "sf/a": "^3.0.0" }), [pkg("sf/a", "1.0.0"), pkg("sf/a", "2.0.0")]);
    expect(result.ok).toBe(false);
    expect(result.issues[0]).toEqual({
      kind: "conflict",
      slug: "sf/a",
      requirements: [{ requestedBy: "manifest", range: "^3.0.0" }],
    });
  });

  it("downgrades a previously picked version when a later requirement narrows the range", () => {
    const result = resolve(manifest({ "sf/shared": ">=1.0.0", "sf/z": "1.0.0" }), [
      pkg("sf/shared", "1.2.0"),
      pkg("sf/shared", "2.0.0"),
      pkg("sf/z", "1.0.0", { "sf/shared": "^1.0.0" }),
    ]);
    expect(result.ok).toBe(true);
    expect(result.resolved["sf/shared"].version).toBe("1.2.0");
  });
});

describe("resolve — circular dependencies", () => {
  it("terminates on a direct cycle and reports it", () => {
    const result = resolve(manifest({ "sf/a": "1.0.0" }), [
      pkg("sf/a", "1.0.0", { "sf/b": "1.0.0" }),
      pkg("sf/b", "1.0.0", { "sf/a": "1.0.0" }),
    ]);
    expect(result.ok).toBe(false);
    expect(result.resolved["sf/a"]).toBeDefined();
    expect(result.resolved["sf/b"]).toBeDefined();
    const circular = result.issues.filter((i) => i.kind === "circular");
    expect(circular).toEqual([{ kind: "circular", cycle: ["sf/a", "sf/b"] }]);
  });

  it("reports a self-dependency as a cycle", () => {
    const result = resolve(manifest({ "sf/a": "1.0.0" }), [pkg("sf/a", "1.0.0", { "sf/a": "1.0.0" })]);
    expect(result.issues).toEqual([{ kind: "circular", cycle: ["sf/a"] }]);
  });

  it("terminates on a three-package cycle", () => {
    const result = resolve(manifest({ "sf/a": "1.0.0" }), [
      pkg("sf/a", "1.0.0", { "sf/b": "1.0.0" }),
      pkg("sf/b", "1.0.0", { "sf/c": "1.0.0" }),
      pkg("sf/c", "1.0.0", { "sf/a": "1.0.0" }),
    ]);
    const circular = result.issues.filter((i) => i.kind === "circular");
    expect(circular).toHaveLength(1);
    expect(circular[0].kind === "circular" && circular[0].cycle).toEqual(["sf/a", "sf/b", "sf/c"]);
  });
});

function lockOf(entries: Record<string, { version: string; contentHash?: string; sourceCommitSha?: string }>): Lock {
  const resolved: Record<string, { version: string; contentHash: string; sourceCommitSha: string }> = {};
  for (const [slug, entry] of Object.entries(entries)) {
    resolved[slug] = {
      version: entry.version,
      contentHash: entry.contentHash ?? HASH_A,
      sourceCommitSha: entry.sourceCommitSha ?? "sha-old",
    };
  }
  return { schemaVersion: "1.0", resolved };
}

describe("diffLock", () => {
  it("reports added, removed, and changed entries, sorted", () => {
    const oldLock = lockOf({
      "sf/stays": { version: "1.0.0" },
      "sf/bumped": { version: "1.0.0" },
      "sf/gone": { version: "3.0.0" },
      "sf/rehash": { version: "2.0.0", contentHash: HASH_A },
    });
    const newLock = lockOf({
      "sf/stays": { version: "1.0.0" },
      "sf/bumped": { version: "1.1.0" },
      "sf/new": { version: "0.1.0" },
      "sf/rehash": { version: "2.0.0", contentHash: HASH_B },
    });
    const diff = diffLock(oldLock, newLock);
    expect(diff.added).toEqual(["sf/new"]);
    expect(diff.removed).toEqual(["sf/gone"]);
    expect(diff.changed.map((c) => c.slug)).toEqual(["sf/bumped", "sf/rehash"]);
    expect(diff.changed[0].from.version).toBe("1.0.0");
    expect(diff.changed[0].to.version).toBe("1.1.0");
    expect(diff.changed[1].from.contentHash).toBe(HASH_A);
    expect(diff.changed[1].to.contentHash).toBe(HASH_B);
  });

  it("returns empty diff for identical locks", () => {
    const lock = lockOf({ "sf/a": { version: "1.0.0" } });
    expect(diffLock(lock, lock)).toEqual({ added: [], removed: [], changed: [] });
  });
});

describe("checkOutdated", () => {
  const available = [
    pkg("sf/a", "1.3.2"),
    pkg("sf/a", "1.4.0"),
    pkg("sf/a", "2.0.0"),
    pkg("sf/b", "0.9.0"),
  ];

  it("reports packages with a newer version in the registry", () => {
    const outdated = checkOutdated(lockOf({ "sf/a": { version: "1.3.2" }, "sf/b": { version: "0.9.0" } }), available);
    expect(outdated).toEqual([{ slug: "sf/a", current: "1.3.2", latest: "2.0.0" }]);
  });

  it("includes latestSatisfying when a manifest range is provided", () => {
    const outdated = checkOutdated(
      lockOf({ "sf/a": { version: "1.3.2" } }),
      available,
      manifest({ "sf/a": "^1.3.0" }),
    );
    expect(outdated).toEqual([
      { slug: "sf/a", current: "1.3.2", latest: "2.0.0", latestSatisfying: "1.4.0" },
    ]);
  });

  it("omits latestSatisfying when the locked version is already the best in range", () => {
    const outdated = checkOutdated(
      lockOf({ "sf/a": { version: "1.4.0" } }),
      available,
      manifest({ "sf/a": "^1.3.0" }),
    );
    expect(outdated).toEqual([{ slug: "sf/a", current: "1.4.0", latest: "2.0.0" }]);
  });

  it("skips packages missing from the registry snapshot", () => {
    expect(checkOutdated(lockOf({ "sf/ghost": { version: "1.0.0" } }), available)).toEqual([]);
  });

  it("returns an empty list when everything is current", () => {
    expect(checkOutdated(lockOf({ "sf/a": { version: "2.0.0" } }), available)).toEqual([]);
  });
});
