import { describe, expect, it } from "vitest";
import { implementationAttemptKey, isAllowedImplementationCommand, validateImplementationClaim } from "../implementationPolicy";

function validClaim() {
  return {
    workOrder: {
      _id: "wo-1",
      projectId: "project-1",
      state: "ACTIVE",
      approvalStatus: "APPROVED",
      isMutating: true,
      repository: "owner/repo",
      branchStrategy: "isolated-worktree",
      currentRevisionNumber: 2,
      metadata: { implementationPolicy: { allowedCommands: ["pnpm test"], maxCostUsd: 2, maxAttempts: 2, timeoutMinutes: 20, stopCondition: "targeted tests pass" } },
    },
    run: { projectId: "project-1", workOrderId: "wo-1", workOrderRevisionNumber: 2, worktree: "/tmp/repo-worktree" },
    task: { projectId: "project-1", workOrderId: "wo-1" },
    expectedRepository: "owner/repo",
    worktreePath: "/tmp/repo-worktree",
    attemptNumber: 1,
  };
}

describe("implementation worker policy", () => {
  it("accepts one fully governed isolated claim", () => {
    expect(validateImplementationClaim(validClaim())).toEqual([]);
  });

  it.each([
    ["unapproved", (claim: any) => { claim.workOrder.approvalStatus = "PENDING"; }],
    ["stale", (claim: any) => { claim.run.workOrderRevisionNumber = 1; }],
    ["cross-workspace", (claim: any) => { claim.task.projectId = "other"; }],
    ["wrong-repository", (claim: any) => { claim.expectedRepository = "other/repo"; }],
    ["attempt-limit", (claim: any) => { claim.attemptNumber = 3; }],
  ])("denies %s work", (_label, mutate) => {
    const claim = validClaim();
    mutate(claim);
    expect(validateImplementationClaim(claim).length).toBeGreaterThan(0);
  });

  it("allows only explicit non-destructive commands", () => {
    expect(isAllowedImplementationCommand("pnpm test -- --run", ["pnpm test"])).toBe(true);
    expect(isAllowedImplementationCommand("pnpm test && rm -rf .", ["pnpm test"])).toBe(false);
    expect(isAllowedImplementationCommand("git reset --hard", ["git"])).toBe(false);
    expect(isAllowedImplementationCommand("npm publish", ["pnpm test"])).toBe(false);
  });

  it("uses a stable immutable Attempt key", () => {
    expect(implementationAttemptKey("run-1", "task-1", 2)).toBe("implementation:run-1:task-1:attempt:2");
  });
});
