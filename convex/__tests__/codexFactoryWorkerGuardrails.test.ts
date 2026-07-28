import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "scripts/codex-factory-worker.ts"), "utf8");

describe("Codex factory worker guardrails", () => {
  it("uses a bounded configurable execution timeout", () => {
    expect(source).toContain("FACTORY_TASK_TIMEOUT_MS");
    expect(source).toContain("timeout: TASK_TIMEOUT_MS");
  });

  it("aborts the active execution during shutdown", () => {
    expect(source).toContain("activeExecutionController?.abort()");
    expect(source).toContain("Codex execution canceled by operator.");
  });

  it("stops the worker after a failed task by default", () => {
    expect(source).toContain('FACTORY_STOP_ON_FAILURE !== "0"');
    expect(source).toContain("Stopping after failed task.");
  });

  it("records a bounded diagnostic instead of the full command and prompt", () => {
    expect(source).toContain("Review worker diagnostics and retry as a new run.");
    expect(source).toContain("Codex execution timed out after");
  });
});
