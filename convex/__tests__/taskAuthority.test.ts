import { describe, expect, it } from "vitest";
import {
  buildWorkOrderTaskAuthority,
  workOrderTaskAuthorityIssue,
} from "../lib/taskAuthority";

const workOrder = {
  _id: "work-order-1",
  currentRevisionNumber: 3,
  desiredOutcome: "Research immutable Task Attempts and reasoned retry.",
};

describe("Work Order Task authority", () => {
  it("builds a revision-bound objective reference", () => {
    expect(buildWorkOrderTaskAuthority(workOrder)).toEqual({
      kind: "WORK_ORDER_DESIRED_OUTCOME",
      workOrderId: "work-order-1",
      workOrderRevisionNumber: 3,
      authorityRef: "work-order:work-order-1:revision:3:desired-outcome",
      objective: workOrder.desiredOutcome,
    });
  });

  it("fails closed for missing or mismatched provenance", () => {
    expect(workOrderTaskAuthorityIssue({ scope: undefined, workOrder }))
      .toBe("task-authority-missing");
    expect(workOrderTaskAuthorityIssue({
      scope: {
        ...buildWorkOrderTaskAuthority(workOrder),
        workOrderRevisionNumber: 2,
      },
      workOrder,
    })).toBe("task-authority-mismatch");
  });

  it("accepts exact current Work Order provenance", () => {
    expect(workOrderTaskAuthorityIssue({
      scope: buildWorkOrderTaskAuthority(workOrder),
      workOrder,
    })).toBeNull();
  });
});
