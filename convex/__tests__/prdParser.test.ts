import { describe, expect, it } from "vitest";
import {
  derivePrdTitle,
  fingerprintPrdContent,
  parsePrdHeuristically,
} from "../lib/prdParser";

describe("PRD fallback parser", () => {
  it("extracts functional requirements from the supplied plain-text format", () => {
    const content = `Product Requirements Document

1. Product Name

Software Factory Research Lab

8. Functional Requirements

FR-1: Workspace creation

Create the workspace through the UI.

FR-2: Repository creation or connection

Connect the research repository and show its default branch.

FR-3: PRD import

Preview tasks and prevent duplicate imports.`;

    const tasks = parsePrdHeuristically(content, 25);

    expect(tasks).toHaveLength(3);
    expect(tasks.map((task) => task.title)).toEqual([
      "FR-1: Workspace creation",
      "FR-2: Repository creation or connection",
      "FR-3: PRD import",
    ]);
    expect(tasks[0]).toMatchObject({
      type: "ENGINEERING",
      priority: 2,
    });
    expect(tasks[1].type).toBe("ENGINEERING");
    expect(tasks[2].description).toContain("prevent duplicate imports");
  });

  it("continues to parse markdown section headings", () => {
    const tasks = parsePrdHeuristically(`## Import PRD

Accept markdown input.

## Verify evidence

Retain citations and timestamps.`);

    expect(tasks).toHaveLength(2);
    expect(tasks[0].title).toBe("Import PRD");
    expect(tasks[1].type).toBe("CUSTOMER_RESEARCH");
  });

  it("falls back to numbered plain-text sections without treating sentences as headings", () => {
    const tasks = parsePrdHeuristically(`1. Product Summary

This is the summary.

1. Produce reliable research.
2. Serve as a browser fixture.

2. Goals

Ship the workflow.`);

    expect(tasks.map((task) => task.title)).toEqual([
      "1. Product Summary",
      "2. Goals",
    ]);
  });

  it("returns no tasks for content without actionable sections", () => {
    expect(parsePrdHeuristically("A single unstructured paragraph.")).toEqual([]);
  });

  it("derives a stable title and fingerprint from normalized content", () => {
    const windowsContent = "1. Product Name\r\n\r\nSoftware Factory Research Lab\r\n";
    const unixContent = "1. Product Name\n\nSoftware Factory Research Lab";

    expect(derivePrdTitle(windowsContent)).toBe("Software Factory Research Lab");
    expect(fingerprintPrdContent(windowsContent)).toBe(fingerprintPrdContent(unixContent));
  });
});
