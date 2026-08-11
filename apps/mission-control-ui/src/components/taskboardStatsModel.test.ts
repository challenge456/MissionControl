import { describe, expect, it } from "vitest";
import { buildTaskboardStats } from "./taskboardStatsModel";

describe("taskboard KPI semantics", () => {
  it("keeps canonical status counts separate from the presentation-active grouping", () => {
    const now = new Date(2026, 7, 12, 12, 0, 0);
    const thisWeek = new Date(2026, 7, 11, 12, 0, 0).getTime();
    const lastWeek = new Date(2026, 7, 9, 12, 0, 0).getTime();
    const stats = buildTaskboardStats([
      { status: "INBOX", _creationTime: thisWeek },
      { status: "READY", _creationTime: thisWeek },
      { status: "ASSIGNED", _creationTime: thisWeek },
      { status: "IN_PROGRESS", _creationTime: thisWeek },
      { status: "REVIEW", _creationTime: lastWeek },
      { status: "NEEDS_APPROVAL", _creationTime: lastWeek },
      { status: "BLOCKED", _creationTime: lastWeek },
      { status: "FAILED", _creationTime: lastWeek },
      { status: "DONE", _creationTime: lastWeek },
      { status: "CANCELED", _creationTime: lastWeek },
    ], now);

    expect(stats.canonicalCounts).toEqual({
      INBOX: 1,
      READY: 1,
      ASSIGNED: 1,
      IN_PROGRESS: 1,
      REVIEW: 1,
      NEEDS_APPROVAL: 1,
      BLOCKED: 1,
      FAILED: 1,
      DONE: 1,
      CANCELED: 1,
    });
    expect(stats.presentationActiveCount).toBe(5);
    expect(stats.thisWeek).toBe(4);
    expect(stats.total).toBe(10);
    expect(stats.completionPct).toBe(10);
  });

  it("reports unknown canonical values instead of silently folding them into a grouping", () => {
    const stats = buildTaskboardStats([{ status: "SOMETHING_NEW" }]);
    expect(stats.unknownStatusCount).toBe(1);
    expect(stats.presentationActiveCount).toBe(0);
  });
});
