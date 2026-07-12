import { describe, expect, it } from "vitest";
import {
  UNKNOWN_COMMIT_SHA,
  dependenciesToRecord,
  diffInstallations,
  isValidManifestHash,
  toAvailablePackage,
  type ExistingInstallation,
  type InstallationEntry,
} from "../lib/contextManifests";

// ---------------------------------------------------------------------------
// dependenciesToRecord
// ---------------------------------------------------------------------------

describe("dependenciesToRecord", () => {
  it("maps an array of {slug, range} objects to a record", () => {
    expect(
      dependenciesToRecord([
        { slug: "scope/a", range: "^1.0.0" },
        { slug: "scope/b", range: "~2.1.0" },
      ])
    ).toEqual({ "scope/a": "^1.0.0", "scope/b": "~2.1.0" });
  });

  it("returns an empty record for undefined or empty input", () => {
    expect(dependenciesToRecord(undefined)).toEqual({});
    expect(dependenciesToRecord([])).toEqual({});
  });

  it("keeps the last entry for duplicate slugs", () => {
    expect(
      dependenciesToRecord([
        { slug: "scope/a", range: "^1.0.0" },
        { slug: "scope/a", range: "^2.0.0" },
      ])
    ).toEqual({ "scope/a": "^2.0.0" });
  });
});

// ---------------------------------------------------------------------------
// toAvailablePackage
// ---------------------------------------------------------------------------

const HASH = `sha256:${"a".repeat(64)}`;

describe("toAvailablePackage", () => {
  it("maps a full version row to the resolver's AvailablePackage shape", () => {
    const available = toAvailablePackage("scope/pkg", {
      version: "1.2.3",
      contentHash: HASH,
      sourceCommitSha: "abc123",
      dependencies: [{ slug: "scope/dep", range: ">=1.0.0" }],
    });
    expect(available).toEqual({
      slug: "scope/pkg",
      version: "1.2.3",
      contentHash: HASH,
      sourceCommitSha: "abc123",
      dependencies: { "scope/dep": ">=1.0.0" },
    });
  });

  it("returns null when the row has no contentHash", () => {
    expect(toAvailablePackage("scope/pkg", { version: "1.0.0" })).toBeNull();
    expect(
      toAvailablePackage("scope/pkg", { version: "1.0.0", contentHash: "" })
    ).toBeNull();
  });

  it("substitutes the unknown-commit placeholder for missing provenance", () => {
    const missing = toAvailablePackage("scope/pkg", {
      version: "1.0.0",
      contentHash: HASH,
    });
    expect(missing?.sourceCommitSha).toBe(UNKNOWN_COMMIT_SHA);

    const empty = toAvailablePackage("scope/pkg", {
      version: "1.0.0",
      contentHash: HASH,
      sourceCommitSha: "",
    });
    expect(empty?.sourceCommitSha).toBe(UNKNOWN_COMMIT_SHA);
  });

  it("defaults dependencies to an empty record", () => {
    const available = toAvailablePackage("scope/pkg", {
      version: "1.0.0",
      contentHash: HASH,
      sourceCommitSha: "abc",
    });
    expect(available?.dependencies).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// isValidManifestHash
// ---------------------------------------------------------------------------

describe("isValidManifestHash", () => {
  it("accepts sha256: followed by 64 lowercase hex chars", () => {
    expect(isValidManifestHash(HASH)).toBe(true);
    expect(isValidManifestHash(`sha256:${"0123456789abcdef".repeat(4)}`)).toBe(
      true
    );
  });

  it("rejects malformed hashes", () => {
    expect(isValidManifestHash("")).toBe(false);
    expect(isValidManifestHash("a".repeat(64))).toBe(false); // no prefix
    expect(isValidManifestHash(`sha256:${"a".repeat(63)}`)).toBe(false); // short
    expect(isValidManifestHash(`sha256:${"a".repeat(65)}`)).toBe(false); // long
    expect(isValidManifestHash(`sha256:${"A".repeat(64)}`)).toBe(false); // uppercase
    expect(isValidManifestHash(`sha256:${"g".repeat(64)}`)).toBe(false); // non-hex
    expect(isValidManifestHash(`md5:${"a".repeat(64)}`)).toBe(false); // wrong algo
    expect(isValidManifestHash(` sha256:${"a".repeat(64)}`)).toBe(false); // padding
  });
});

// ---------------------------------------------------------------------------
// diffInstallations
// ---------------------------------------------------------------------------

function entry(
  packageSlug: string,
  version = "1.0.0",
  overrides: Partial<InstallationEntry> = {}
): InstallationEntry {
  return {
    packageSlug,
    version,
    contentHash: HASH,
    state: "INSTALLED",
    ...overrides,
  };
}

function row(
  id: string,
  packageSlug: string,
  version = "1.0.0",
  overrides: Partial<ExistingInstallation> = {}
): ExistingInstallation {
  return {
    _id: id,
    packageSlug,
    version,
    contentHash: HASH,
    state: "INSTALLED",
    ...overrides,
  };
}

describe("diffInstallations", () => {
  it("creates all entries when nothing exists", () => {
    const diff = diffInstallations([], [entry("scope/b"), entry("scope/a")]);
    expect(diff.creates.map((e) => e.packageSlug)).toEqual([
      "scope/a",
      "scope/b",
    ]);
    expect(diff.updates).toEqual([]);
    expect(diff.deletes).toEqual([]);
    expect(diff.unchanged).toEqual([]);
  });

  it("deletes all rows when the desired set is empty", () => {
    const diff = diffInstallations(
      [row("id1", "scope/a"), row("id2", "scope/b")],
      []
    );
    expect(diff.creates).toEqual([]);
    expect(diff.updates).toEqual([]);
    expect(diff.deletes).toEqual(["id1", "id2"]);
    expect(diff.unchanged).toEqual([]);
  });

  it("reports identical rows as unchanged with no writes", () => {
    const diff = diffInstallations([row("id1", "scope/a")], [entry("scope/a")]);
    expect(diff.creates).toEqual([]);
    expect(diff.updates).toEqual([]);
    expect(diff.deletes).toEqual([]);
    expect(diff.unchanged).toEqual(["id1"]);
  });

  it("updates when the version changes", () => {
    const diff = diffInstallations(
      [row("id1", "scope/a", "1.0.0")],
      [entry("scope/a", "1.1.0")]
    );
    expect(diff.updates).toEqual([{ id: "id1", entry: entry("scope/a", "1.1.0") }]);
    expect(diff.creates).toEqual([]);
    expect(diff.deletes).toEqual([]);
  });

  it("updates when the contentHash changes", () => {
    const otherHash = `sha256:${"b".repeat(64)}`;
    const diff = diffInstallations(
      [row("id1", "scope/a")],
      [entry("scope/a", "1.0.0", { contentHash: otherHash })]
    );
    expect(diff.updates).toHaveLength(1);
    expect(diff.updates[0].entry.contentHash).toBe(otherHash);
    expect(diff.unchanged).toEqual([]);
  });

  it("updates when only the state changes", () => {
    const diff = diffInstallations(
      [row("id1", "scope/a")],
      [entry("scope/a", "1.0.0", { state: "STALE" })]
    );
    expect(diff.updates).toHaveLength(1);
    expect(diff.updates[0].entry.state).toBe("STALE");
  });

  it("handles mixed create/update/delete/unchanged in one pass", () => {
    const existing = [
      row("keep", "scope/keep"),
      row("bump", "scope/bump", "1.0.0"),
      row("gone", "scope/gone"),
    ];
    const desired = [
      entry("scope/keep"),
      entry("scope/bump", "2.0.0"),
      entry("scope/new"),
    ];
    const diff = diffInstallations(existing, desired);
    expect(diff.creates.map((e) => e.packageSlug)).toEqual(["scope/new"]);
    expect(diff.updates.map((u) => u.id)).toEqual(["bump"]);
    expect(diff.deletes).toEqual(["gone"]);
    expect(diff.unchanged).toEqual(["keep"]);
  });

  it("keeps the last desired entry for duplicate slugs", () => {
    const diff = diffInstallations(
      [],
      [entry("scope/a", "1.0.0"), entry("scope/a", "2.0.0")]
    );
    expect(diff.creates).toHaveLength(1);
    expect(diff.creates[0].version).toBe("2.0.0");
  });

  it("deletes duplicate existing rows for the same slug, keeping the first", () => {
    const diff = diffInstallations(
      [row("first", "scope/a"), row("second", "scope/a")],
      [entry("scope/a")]
    );
    expect(diff.deletes).toEqual(["second"]);
    expect(diff.unchanged).toEqual(["first"]);
    expect(diff.creates).toEqual([]);
    expect(diff.updates).toEqual([]);
  });

  it("sorts creates, updates, and deletes by packageSlug deterministically", () => {
    const existing = [
      row("z", "scope/z", "1.0.0"),
      row("y", "scope/y"),
      row("x", "scope/x", "1.0.0"),
    ];
    const desired = [
      entry("scope/z", "2.0.0"),
      entry("scope/x", "3.0.0"),
      entry("scope/b"),
      entry("scope/a"),
    ];
    const diff = diffInstallations(existing, desired);
    expect(diff.creates.map((e) => e.packageSlug)).toEqual([
      "scope/a",
      "scope/b",
    ]);
    expect(diff.updates.map((u) => u.entry.packageSlug)).toEqual([
      "scope/x",
      "scope/z",
    ]);
    expect(diff.deletes).toEqual(["y"]);
  });

  it("returns empty diff for empty inputs", () => {
    const diff = diffInstallations([], []);
    expect(diff).toEqual({
      creates: [],
      updates: [],
      deletes: [],
      unchanged: [],
    });
  });
});
