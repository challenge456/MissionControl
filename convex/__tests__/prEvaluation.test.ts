import { describe, expect, it } from "vitest";
import { ciBlockedHead, ciBlockCanRecover, correctionRequired, mergeAuthoritySatisfied, prEvaluationKey } from "../lib/prEvaluation";

describe("PR outer-loop evaluation", () => {
  it("identifies one evaluation per normalized PR head", () => {
    expect(prEvaluationKey("HTTPS://github.com/Owner/Repo/pull/1/", "ABC"))
      .toBe("https://github.com/owner/repo/pull/1@abc");
  });

  it("requests correction only for a failed new head", () => {
    expect(correctionRequired({ ciStatus: "FAIL", priorHeadSha: "a", headSha: "b" })).toBe(true);
    expect(correctionRequired({ ciStatus: "FAIL", priorHeadSha: "b", headSha: "b" })).toBe(false);
    expect(correctionRequired({ ciStatus: "PASS", priorHeadSha: "a", headSha: "b" })).toBe(false);
  });

  it("never treats passing CI as approval", () => {
    expect(mergeAuthoritySatisfied({ ciStatus: "PASS", gatesPass: true, approvalStatus: "PENDING", humanConfirmed: true })).toBe(false);
    expect(mergeAuthoritySatisfied({ ciStatus: "PASS", gatesPass: true, approvalStatus: "APPROVED", humanConfirmed: false })).toBe(false);
    expect(mergeAuthoritySatisfied({ ciStatus: "PASS", gatesPass: true, approvalStatus: "APPROVED", humanConfirmed: true })).toBe(true);
  });

  it("clears only the exact prior-head CI block after a newer head passes", () => {
    expect(ciBlockCanRecover({
      ciStatus: "PASS",
      blockingIssue: "Required CI failed for old-head",
      priorHeadSha: "old-head",
      headSha: "new-head",
    })).toBe(true);
    expect(ciBlockCanRecover({
      ciStatus: "PASS",
      blockingIssue: "Operator blocked this WorkOrder",
      priorHeadSha: "old-head",
      headSha: "new-head",
    })).toBe(false);
    expect(ciBlockCanRecover({
      ciStatus: "PASS",
      blockingIssue: "Required CI failed for old-head",
      priorHeadSha: "old-head",
      headSha: "old-head",
    })).toBe(false);
    expect(ciBlockedHead("Required CI failed for old-head")).toBe("old-head");
    expect(ciBlockedHead("Operator blocked this WorkOrder")).toBeUndefined();
  });
});
