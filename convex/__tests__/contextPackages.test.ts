import { describe, expect, it } from "vitest";
import {
  canTransitionPackageStatus,
  canTransitionVersionStatus,
  compareSemver,
  findVersionByContentHash,
  isValidContentHash,
  isValidPackageSlug,
  isValidSemver,
  nextPatchVersion,
  type ContextPackageStatus,
  type ContextVersionStatus,
} from "../lib/contextPackages";

describe("isValidPackageSlug", () => {
  it("accepts scope/name with lowercase alphanumeric segments", () => {
    expect(isValidPackageSlug("anthropic/skill-creator")).toBe(true);
    expect(isValidPackageSlug("mission-control/arm.policy")).toBe(true);
    expect(isValidPackageSlug("a/b")).toBe(true);
    expect(isValidPackageSlug("scope1/name2")).toBe(true);
    expect(isValidPackageSlug("my.scope/my-name.v2")).toBe(true);
  });

  it("rejects missing or extra slashes", () => {
    expect(isValidPackageSlug("no-slash")).toBe(false);
    expect(isValidPackageSlug("too/many/slashes")).toBe(false);
    expect(isValidPackageSlug("/leading")).toBe(false);
    expect(isValidPackageSlug("trailing/")).toBe(false);
    expect(isValidPackageSlug("/")).toBe(false);
  });

  it("rejects bad characters and casing", () => {
    expect(isValidPackageSlug("")).toBe(false);
    expect(isValidPackageSlug("Scope/name")).toBe(false);
    expect(isValidPackageSlug("scope/Name")).toBe(false);
    expect(isValidPackageSlug("sco pe/name")).toBe(false);
    expect(isValidPackageSlug("scope/na_me")).toBe(false);
    expect(isValidPackageSlug("scope/-leading-dash")).toBe(false);
    expect(isValidPackageSlug("scope/trailing-dash-")).toBe(false);
    expect(isValidPackageSlug("scope/double--dash")).toBe(false);
    expect(isValidPackageSlug("scope/double..dot")).toBe(false);
  });
});

describe("isValidSemver", () => {
  it("accepts strict numeric x.y.z", () => {
    expect(isValidSemver("0.0.0")).toBe(true);
    expect(isValidSemver("0.1.0")).toBe(true);
    expect(isValidSemver("1.2.3")).toBe(true);
    expect(isValidSemver("10.20.30")).toBe(true);
  });

  it("rejects wrong shapes", () => {
    expect(isValidSemver("")).toBe(false);
    expect(isValidSemver("1")).toBe(false);
    expect(isValidSemver("1.2")).toBe(false);
    expect(isValidSemver("1.2.3.4")).toBe(false);
    expect(isValidSemver("v1.2.3")).toBe(false);
    expect(isValidSemver("1.2.3-beta")).toBe(false);
    expect(isValidSemver("1.2.3+build")).toBe(false);
    expect(isValidSemver("1.a.3")).toBe(false);
  });

  it("rejects leading zeros", () => {
    expect(isValidSemver("01.2.3")).toBe(false);
    expect(isValidSemver("1.02.3")).toBe(false);
    expect(isValidSemver("1.2.03")).toBe(false);
  });
});

describe("compareSemver", () => {
  it("orders by major, minor, patch", () => {
    expect(compareSemver("1.0.0", "2.0.0")).toBe(-1);
    expect(compareSemver("2.0.0", "1.9.9")).toBe(1);
    expect(compareSemver("1.1.0", "1.2.0")).toBe(-1);
    expect(compareSemver("1.2.1", "1.2.0")).toBe(1);
    expect(compareSemver("1.2.3", "1.2.3")).toBe(0);
  });

  it("compares numerically, not lexically", () => {
    expect(compareSemver("0.10.0", "0.9.0")).toBe(1);
    expect(compareSemver("0.1.10", "0.1.2")).toBe(1);
    expect(compareSemver("10.0.0", "9.0.0")).toBe(1);
  });

  it("throws on malformed input", () => {
    expect(() => compareSemver("1.2", "1.2.3")).toThrow();
    expect(() => compareSemver("1.2.3", "nope")).toThrow();
  });
});

describe("nextPatchVersion", () => {
  it("increments the patch component", () => {
    expect(nextPatchVersion("0.1.0")).toBe("0.1.1");
    expect(nextPatchVersion("1.2.9")).toBe("1.2.10");
  });

  it("throws on malformed input", () => {
    expect(() => nextPatchVersion("1.2")).toThrow();
  });
});

describe("isValidContentHash", () => {
  const HEX64 = "a".repeat(64);

  it("accepts sha256: plus 64 lowercase hex chars", () => {
    expect(isValidContentHash(`sha256:${HEX64}`)).toBe(true);
    expect(isValidContentHash(`sha256:${"0123456789abcdef".repeat(4)}`)).toBe(
      true
    );
  });

  it("rejects wrong prefix, length, or characters", () => {
    expect(isValidContentHash("")).toBe(false);
    expect(isValidContentHash(HEX64)).toBe(false);
    expect(isValidContentHash(`sha1:${HEX64}`)).toBe(false);
    expect(isValidContentHash(`sha256:${"a".repeat(63)}`)).toBe(false);
    expect(isValidContentHash(`sha256:${"a".repeat(65)}`)).toBe(false);
    expect(isValidContentHash(`sha256:${"A".repeat(64)}`)).toBe(false);
    expect(isValidContentHash(`sha256:${"g".repeat(64)}`)).toBe(false);
  });
});

describe("findVersionByContentHash", () => {
  const HASH_A = `sha256:${"a".repeat(64)}`;
  const HASH_B = `sha256:${"b".repeat(64)}`;

  it("reuses the matching version instead of creating a synthetic patch", () => {
    const versions = [
      { version: "0.1.0", contentHash: HASH_A },
      { version: "0.1.1", contentHash: HASH_B },
    ];

    expect(findVersionByContentHash(versions, HASH_A)).toEqual(versions[0]);
  });

  it("does not match when content is new or hashing is unavailable", () => {
    const versions = [{ version: "0.1.0", contentHash: HASH_A }];

    expect(findVersionByContentHash(versions, HASH_B)).toBeUndefined();
    expect(findVersionByContentHash(versions, undefined)).toBeUndefined();
  });
});

describe("canTransitionPackageStatus", () => {
  const STATUSES: ContextPackageStatus[] = ["DRAFT", "ACTIVE", "DEPRECATED"];
  const LEGAL: Array<[ContextPackageStatus, ContextPackageStatus]> = [
    ["DRAFT", "ACTIVE"],
    ["ACTIVE", "DRAFT"],
    ["ACTIVE", "DEPRECATED"],
  ];

  it("allows exactly DRAFT<->ACTIVE and ACTIVE->DEPRECATED", () => {
    for (const from of STATUSES) {
      for (const to of STATUSES) {
        const legal = LEGAL.some(([f, t]) => f === from && t === to);
        expect(canTransitionPackageStatus(from, to), `${from} -> ${to}`).toBe(
          legal
        );
      }
    }
  });

  it("treats DEPRECATED as terminal", () => {
    expect(canTransitionPackageStatus("DEPRECATED", "DRAFT")).toBe(false);
    expect(canTransitionPackageStatus("DEPRECATED", "ACTIVE")).toBe(false);
  });

  it("rejects self-transitions", () => {
    expect(canTransitionPackageStatus("DRAFT", "DRAFT")).toBe(false);
    expect(canTransitionPackageStatus("ACTIVE", "ACTIVE")).toBe(false);
    expect(canTransitionPackageStatus("DEPRECATED", "DEPRECATED")).toBe(false);
  });
});

describe("canTransitionVersionStatus", () => {
  const STATUSES: ContextVersionStatus[] = ["DRAFT", "PUBLISHED", "DEPRECATED"];
  const LEGAL: Array<[ContextVersionStatus, ContextVersionStatus]> = [
    ["DRAFT", "PUBLISHED"],
    ["DRAFT", "DEPRECATED"],
    ["PUBLISHED", "DEPRECATED"],
  ];

  it("allows exactly DRAFT->PUBLISHED, DRAFT->DEPRECATED, PUBLISHED->DEPRECATED", () => {
    for (const from of STATUSES) {
      for (const to of STATUSES) {
        const legal = LEGAL.some(([f, t]) => f === from && t === to);
        expect(canTransitionVersionStatus(from, to), `${from} -> ${to}`).toBe(
          legal
        );
      }
    }
  });

  it("never re-publishes: PUBLISHED -> PUBLISHED is illegal", () => {
    expect(canTransitionVersionStatus("PUBLISHED", "PUBLISHED")).toBe(false);
  });

  it("never returns to DRAFT", () => {
    expect(canTransitionVersionStatus("PUBLISHED", "DRAFT")).toBe(false);
    expect(canTransitionVersionStatus("DEPRECATED", "DRAFT")).toBe(false);
  });

  it("treats DEPRECATED as terminal", () => {
    expect(canTransitionVersionStatus("DEPRECATED", "PUBLISHED")).toBe(false);
    expect(canTransitionVersionStatus("DEPRECATED", "DEPRECATED")).toBe(false);
  });
});
