import { describe, expect, it } from "vitest";
import {
  classifyRemoteError,
  decideRemoteRetry,
  type RemoteFailure,
  type RemoteRetryBudget,
} from "../remoteExecutionPolicy.js";
import {
  factoryResultContextIssues,
  resolveRemoteStructuredResult,
  type RemoteOutputFileObservation,
} from "../remoteStructuredResult.js";

describe("remote Codex structured-result resolution", () => {
  it("accepts one schema-valid output file as the authoritative result", () => {
    const resolved = resolve({
      outputFile: { state: "READ", content: JSON.stringify(result()) },
      stdout: `${JSON.stringify(agentMessage(result()))}\n${JSON.stringify({ type: "turn.completed" })}\n`,
    });

    expect(resolved).toMatchObject({
      accepted: true,
      result: { schema: "factory-result/v1", status: "COMPLETED" },
      provenance: {
        source: "OUTPUT_FILE",
        outputFile: { state: "VALID" },
      },
    });
  });

  it("reconstructs only one complete, unambiguous terminal JSONL candidate", () => {
    const resolved = resolve({
      outputFile: { state: "ABSENT" },
      stdout: [
        JSON.stringify({ type: "thread.started", thread_id: "thread-1" }),
        JSON.stringify(agentMessage(result())),
        JSON.stringify({ type: "turn.completed", usage: { input_tokens: 12, output_tokens: 8 } }),
      ].join("\n"),
    });

    expect(resolved).toMatchObject({
      accepted: true,
      provenance: {
        source: "CODEX_JSONL_RECONSTRUCTION",
        outputFile: { state: "ABSENT" },
        jsonl: {
          terminalCompletedCount: 1,
          terminalFailureCount: 0,
          validCandidateCount: 1,
          malformedLineCount: 0,
        },
      },
    });
  });

  it.each([
    {
      name: "missing output and incomplete JSONL",
      outputFile: { state: "ABSENT" } as RemoteOutputFileObservation,
      stdout: JSON.stringify(agentMessage(result())),
      code: "JSONL_INCOMPLETE",
    },
    {
      name: "truncated output and no JSONL candidate",
      outputFile: { state: "READ", content: '{"status":"COMPLETED"' } as RemoteOutputFileObservation,
      stdout: JSON.stringify({ type: "turn.completed" }),
      code: "RESULT_FILE_TRUNCATED",
    },
    {
      name: "schema-invalid output and no JSONL candidate",
      outputFile: { state: "READ", content: JSON.stringify({ status: "COMPLETED" }) } as RemoteOutputFileObservation,
      stdout: JSON.stringify({ type: "turn.completed" }),
      code: "RESULT_SCHEMA_INVALID",
    },
    {
      name: "malformed JSONL line",
      outputFile: { state: "ABSENT" } as RemoteOutputFileObservation,
      stdout: `${JSON.stringify(agentMessage(result()))}\nnot-json\n${JSON.stringify({ type: "turn.completed" })}`,
      code: "JSONL_MALFORMED",
    },
    {
      name: "multiple valid JSONL candidates",
      outputFile: { state: "ABSENT" } as RemoteOutputFileObservation,
      stdout: `${JSON.stringify(agentMessage(result()))}\n${JSON.stringify(agentMessage({ ...result(), summary: "second" }))}\n${JSON.stringify({ type: "turn.completed" })}`,
      code: "JSONL_AMBIGUOUS",
    },
    {
      name: "terminal failure after a valid candidate",
      outputFile: { state: "ABSENT" } as RemoteOutputFileObservation,
      stdout: `${JSON.stringify(agentMessage(result()))}\n${JSON.stringify({ type: "turn.failed", error: { message: "provider failed" } })}`,
      code: "JSONL_TERMINAL_FAILURE",
    },
  ])("fails closed for $name", ({ outputFile, stdout, code }) => {
    const resolved = resolve({ outputFile, stdout });
    expect(resolved.accepted).toBe(false);
    expect(resolved.failure).toMatchObject({
      class: "NON_RETRYABLE_RESULT",
      code,
      retryable: false,
    });
  });

  it("does not equate exit zero with success", () => {
    const resolved = resolve({ outputFile: { state: "ABSENT" }, stdout: "", exitCode: 0 });
    expect(resolved).toMatchObject({
      accepted: false,
      failure: { class: "NON_RETRYABLE_RESULT", code: "RESULT_FILE_MISSING", retryable: false },
    });
  });

  it("preserves bounded redacted output diagnostics with exact validation issues", () => {
    const content = JSON.stringify({
      status: "COMPLETED",
      summary: "done",
      completedAcceptanceCriterionIds: [],
      incompleteAcceptanceCriterionIds: [],
      unknownAcceptanceCriterionIds: [],
      verificationCommands: [],
      knownRisks: [],
      nextAction: "review",
      unexpected: "sk-or-v1-secret-material",
    });
    const resolved = resolve({ outputFile: { state: "READ", content }, stdout: "" });

    expect(resolved.diagnostics.outputFile).toMatchObject({
      state: "SCHEMA_INVALID",
      byteLength: Buffer.byteLength(content),
      digest: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
      validationIssues: ["UNEXPECTED_FIELDS:unexpected", "SCHEMA_DISCRIMINATOR_INVALID"],
    });
    expect(resolved.diagnostics.outputFile.tail).toContain("[REDACTED_OPENROUTER_KEY]");
    expect(resolved.diagnostics.outputFile.tail).not.toContain("secret-material");
  });

  it("classifies timeout and cancellation without inventing a result", () => {
    expect(resolve({ outputFile: { state: "ABSENT" }, stdout: "", timedOut: true }).failure)
      .toMatchObject({ class: "RETRYABLE_EXECUTION", code: "EXECUTOR_TIMEOUT", retryable: true });
    expect(resolve({ outputFile: { state: "ABSENT" }, stdout: "", canceled: true }).failure)
      .toMatchObject({ class: "UNKNOWN", code: "ATTEMPT_CANCELED", retryable: false });
  });

  it("requires exact frozen acceptance-criterion accounting before COMPLETED is admissible", () => {
    expect(factoryResultContextIssues(result(), ["ac-1"])).toEqual([]);
    expect(factoryResultContextIssues({
      ...result(),
      completedAcceptanceCriterionIds: [],
      unknownAcceptanceCriterionIds: ["ac-1"],
    }, ["ac-1"])).toEqual(["COMPLETED_RESULT_HAS_UNRESOLVED_CRITERIA"]);
    expect(factoryResultContextIssues(result(), ["ac-1", "ac-2"]))
      .toEqual(["ACCEPTANCE_CRITERIA_ACCOUNTING_INVALID"]);
  });
});

describe("remote failure taxonomy and retry budget", () => {
  it("classifies transport and recognized provider/model transients explicitly", () => {
    expect(classifyRemoteError(new Error("Permission denied while reading result"), "RESULT_READ"))
      .toMatchObject({ class: "RETRYABLE_INFRA", code: "TRANSPORT_RESULT_READ", retryable: true });
    expect(classifyRemoteError(new Error("429 rate limit from model provider"), "EXECUTOR"))
      .toMatchObject({ class: "RETRYABLE_EXECUTION", code: "MODEL_RATE_LIMIT", retryable: true });
    expect(classifyRemoteError(new Error("unexpected executor panic"), "EXECUTOR"))
      .toMatchObject({ class: "UNKNOWN", code: "EXECUTOR_UNCLASSIFIED", retryable: false });
  });

  it("allows retry only for a typed retryable failure inside every frozen bound", () => {
    const budget: RemoteRetryBudget = {
      schema: "factory-remote-retry-policy/v1",
      maxAttempts: 3,
      maxTotalWallClockMs: 600_000,
      maxModelSpendUsd: 3,
      maxProviderResources: 1,
      retryableFailureClasses: ["RETRYABLE_INFRA", "RETRYABLE_EXECUTION"],
    };
    const failure: RemoteFailure = {
      class: "RETRYABLE_INFRA",
      code: "TRANSPORT_RESULT_READ",
      stage: "RESULT_READ",
      retryable: true,
      summary: "Transient result read failed.",
    };

    expect(decideRemoteRetry({
      failure,
      budget,
      attemptsUsed: 1,
      totalWallClockMs: 10_000,
      observedModelSpendUsd: 0.2,
      activeProviderResources: 0,
    })).toEqual({ allowed: true, reason: "WITHIN_FROZEN_BUDGET" });

    expect(decideRemoteRetry({
      failure,
      budget,
      attemptsUsed: 3,
      totalWallClockMs: 10_000,
      observedModelSpendUsd: 0.2,
      activeProviderResources: 0,
    })).toEqual({ allowed: false, reason: "MAX_ATTEMPTS_EXHAUSTED" });

    expect(decideRemoteRetry({
      failure: { ...failure, class: "UNKNOWN", retryable: false },
      budget,
      attemptsUsed: 1,
      totalWallClockMs: 10_000,
      observedModelSpendUsd: null,
      activeProviderResources: 0,
    })).toEqual({ allowed: false, reason: "FAILURE_CLASS_NOT_RETRYABLE" });
  });

  it.each([
    ["MAX_WALL_CLOCK_EXHAUSTED", { totalWallClockMs: 600_000 }],
    ["MAX_MODEL_SPEND_EXHAUSTED", { observedModelSpendUsd: 3 }],
    ["MAX_PROVIDER_RESOURCES_EXHAUSTED", { activeProviderResources: 1 }],
  ] as const)("enforces %s", (reason, override) => {
    const budget: RemoteRetryBudget = {
      schema: "factory-remote-retry-policy/v1",
      maxAttempts: 3,
      maxTotalWallClockMs: 600_000,
      maxModelSpendUsd: 3,
      maxProviderResources: 1,
      retryableFailureClasses: ["RETRYABLE_INFRA", "RETRYABLE_EXECUTION"],
    };
    const decision = decideRemoteRetry({
      failure: { class: "RETRYABLE_EXECUTION", code: "EXECUTOR_TIMEOUT", stage: "EXECUTOR", retryable: true, summary: "Timed out." },
      budget,
      attemptsUsed: 1,
      totalWallClockMs: 1,
      observedModelSpendUsd: 0,
      activeProviderResources: 0,
      ...override,
    });
    expect(decision).toEqual({ allowed: false, reason });
  });
});

function resolve(input: {
  outputFile: RemoteOutputFileObservation;
  stdout: string;
  stderr?: string;
  exitCode?: number | null;
  timedOut?: boolean;
  canceled?: boolean;
}) {
  return resolveRemoteStructuredResult({
    outputFile: input.outputFile,
    stdout: input.stdout,
    stderr: input.stderr ?? "",
    exitCode: input.exitCode ?? 0,
    timedOut: input.timedOut ?? false,
    canceled: input.canceled ?? false,
  });
}

function agentMessage(value: unknown) {
  return { type: "item.completed", item: { type: "agent_message", text: JSON.stringify(value) } };
}

function result() {
  return {
    schema: "factory-result/v1" as const,
    status: "COMPLETED" as const,
    summary: "Implemented the requested change.",
    completedAcceptanceCriterionIds: ["ac-1"],
    incompleteAcceptanceCriterionIds: [],
    unknownAcceptanceCriterionIds: [],
    verificationCommands: ["pnpm test"],
    knownRisks: [],
    nextAction: "Review the candidate.",
  };
}
