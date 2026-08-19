import { createHash } from "node:crypto";
import { classifyRemoteError, remoteFailure, type RemoteFailure } from "./remoteExecutionPolicy.js";
import { redactSandboxTail } from "./sandboxProvider.js";

export const MAX_REMOTE_EXECUTOR_OUTPUT_BYTES = 1024 * 1024;
export const MAX_REMOTE_JSONL_LINES = 10_000;

export interface FactoryResultV1 {
  schema: "factory-result/v1";
  status: "COMPLETED" | "BLOCKED" | "FAILED";
  summary: string;
  completedAcceptanceCriterionIds: string[];
  incompleteAcceptanceCriterionIds: string[];
  unknownAcceptanceCriterionIds: string[];
  verificationCommands: string[];
  knownRisks: string[];
  nextAction: string;
}

export type RemoteOutputFileObservation =
  | { state: "NOT_REQUESTED" }
  | { state: "ABSENT" }
  | { state: "READ"; content: string }
  | { state: "READ_ERROR"; error: string };

export type RemoteOutputFileState =
  | "NOT_REQUESTED"
  | "ABSENT"
  | "EMPTY"
  | "TRUNCATED"
  | "INVALID_JSON"
  | "SCHEMA_INVALID"
  | "TOO_LARGE"
  | "READ_ERROR"
  | "VALID";

export interface RemoteResultProvenance {
  source: "OUTPUT_FILE" | "EXECUTOR_STDOUT" | "CODEX_JSONL_RECONSTRUCTION" | "NONE";
  outputFile: {
    state: RemoteOutputFileState;
    byteLength: number | null;
  };
  jsonl: {
    byteLength: number;
    lineCount: number;
    malformedLineCount: number;
    terminalCompletedCount: number;
    terminalFailureCount: number;
    validCandidateCount: number;
  };
}

export interface RemoteStructuredResultResolution {
  accepted: boolean;
  result: FactoryResultV1;
  provenance: RemoteResultProvenance;
  diagnostics: {
    outputFile: {
      state: RemoteOutputFileState;
      byteLength: number | null;
      digest: string | null;
      tail: string;
      validationIssues: string[];
    };
  };
  failure?: RemoteFailure;
}

export function resolveRemoteStructuredResult(input: {
  outputFile: RemoteOutputFileObservation;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
  canceled: boolean;
}): RemoteStructuredResultResolution {
  const file = inspectOutputFile(input.outputFile);
  const jsonl = inspectJsonl(input.stdout);
  const baseProvenance: RemoteResultProvenance = {
    source: "NONE",
    outputFile: { state: file.state, byteLength: file.byteLength },
    jsonl: jsonl.provenance,
  };
  const diagnostics = { outputFile: file.diagnostics };

  if (input.timedOut) {
    return failed(baseProvenance, diagnostics, remoteFailure(
      "RETRYABLE_EXECUTION",
      "EXECUTOR_TIMEOUT",
      "EXECUTOR",
      "Remote executor exceeded the frozen Attempt timeout.",
    ));
  }
  if (input.canceled) {
    return failed(baseProvenance, diagnostics, remoteFailure(
      "UNKNOWN",
      "ATTEMPT_CANCELED",
      "EXECUTOR",
      "Remote Attempt was canceled; automatic retry is not authorized.",
    ));
  }

  let result: FactoryResultV1 | undefined;
  let source: RemoteResultProvenance["source"] = "NONE";
  if (file.result) {
    result = file.result;
    source = "OUTPUT_FILE";
  } else if (input.outputFile.state === "NOT_REQUESTED") {
    result = parseFactoryResult(input.stdout);
    if (result) source = "EXECUTOR_STDOUT";
  }
  if (!result && jsonl.result) {
    result = jsonl.result;
    source = "CODEX_JSONL_RECONSTRUCTION";
  }
  const provenance = { ...baseProvenance, source };

  if (input.exitCode !== 0) {
    const detail = boundedDiagnostic(input.stderr || `Remote executor exited ${String(input.exitCode)}.`);
    return failed(provenance, diagnostics, classifyRemoteError(new Error(detail), "EXECUTOR"), result);
  }

  if (!result) {
    const failure = reconstructionFailure(file, jsonl);
    return failed(provenance, diagnostics, failure);
  }
  if (result.status !== "COMPLETED") {
    return failed(provenance, diagnostics, remoteFailure(
      "NON_RETRYABLE_RESULT",
      "DETERMINISTIC_GATE_FAILURE",
      "RESULT_VALIDATION",
      `Executor returned ${result.status}: ${result.nextAction}`,
    ), result);
  }
  return { accepted: true, result, provenance, diagnostics };
}

export function parseFactoryResult(value: string): FactoryResultV1 | undefined {
  if (Buffer.byteLength(value, "utf8") > MAX_REMOTE_EXECUTOR_OUTPUT_BYTES) return undefined;
  let candidate: unknown;
  try {
    candidate = JSON.parse(value.trim());
  } catch {
    return undefined;
  }
  return validateFactoryResultObject(candidate);
}

export function validateFactoryResultObject(candidate: unknown): FactoryResultV1 | undefined {
  if (factoryResultValidationIssues(candidate).length > 0) return undefined;
  const value = candidate as Record<string, unknown>;
  const arrayFields = [
    "completedAcceptanceCriterionIds",
    "incompleteAcceptanceCriterionIds",
    "unknownAcceptanceCriterionIds",
    "verificationCommands",
    "knownRisks",
  ] as const;
  return {
    schema: "factory-result/v1",
    status: value.status as FactoryResultV1["status"],
    summary: value.summary as string,
    completedAcceptanceCriterionIds: [...value.completedAcceptanceCriterionIds as string[]],
    incompleteAcceptanceCriterionIds: [...value.incompleteAcceptanceCriterionIds as string[]],
    unknownAcceptanceCriterionIds: [...value.unknownAcceptanceCriterionIds as string[]],
    verificationCommands: [...value.verificationCommands as string[]],
    knownRisks: [...value.knownRisks as string[]],
    nextAction: value.nextAction as string,
  };
}

export function factoryResultValidationIssues(candidate: unknown): string[] {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return ["RESULT_NOT_OBJECT"];
  const value = candidate as Record<string, unknown>;
  const arrayFields = [
    "completedAcceptanceCriterionIds",
    "incompleteAcceptanceCriterionIds",
    "unknownAcceptanceCriterionIds",
    "verificationCommands",
    "knownRisks",
  ] as const;
  const allowedKeys = new Set(["schema", "status", "summary", ...arrayFields, "nextAction"]);
  const issues: string[] = [];
  const unexpected = Object.keys(value).filter((key) => !allowedKeys.has(key)).sort();
  if (unexpected.length > 0) issues.push(`UNEXPECTED_FIELDS:${unexpected.join(",")}`);
  if (value.schema !== "factory-result/v1") issues.push("SCHEMA_DISCRIMINATOR_INVALID");
  if (!["COMPLETED", "BLOCKED", "FAILED"].includes(String(value.status))) issues.push("STATUS_INVALID");
  if (!boundedNonEmptyString(value.summary, 4_000)) issues.push("SUMMARY_INVALID");
  if (!boundedString(value.nextAction, 4_000)) issues.push("NEXT_ACTION_INVALID");
  for (const field of arrayFields) if (!boundedStringArray(value[field])) issues.push(`${field.toUpperCase()}_INVALID`);
  if (arrayFields.slice(0, 3).every((field) => Array.isArray(value[field]))) {
    const criteria = [
      ...(value.completedAcceptanceCriterionIds as string[]),
      ...(value.incompleteAcceptanceCriterionIds as string[]),
      ...(value.unknownAcceptanceCriterionIds as string[]),
    ];
    if (new Set(criteria).size !== criteria.length) issues.push("ACCEPTANCE_CRITERION_DUPLICATED");
  }
  return issues;
}

export function factoryResultContextIssues(result: FactoryResultV1, expectedCriterionIds: string[]): string[] {
  if (!Array.isArray(expectedCriterionIds)
    || expectedCriterionIds.some((id) => typeof id !== "string" || !id)
    || new Set(expectedCriterionIds).size !== expectedCriterionIds.length) {
    return ["EXPECTED_ACCEPTANCE_CRITERIA_INVALID"];
  }
  const expected = [...expectedCriterionIds].sort();
  const reported = [
    ...result.completedAcceptanceCriterionIds,
    ...result.incompleteAcceptanceCriterionIds,
    ...result.unknownAcceptanceCriterionIds,
  ].sort();
  const issues: string[] = [];
  if (JSON.stringify(reported) !== JSON.stringify(expected)) issues.push("ACCEPTANCE_CRITERIA_ACCOUNTING_INVALID");
  if (result.status === "COMPLETED"
    && (result.incompleteAcceptanceCriterionIds.length > 0 || result.unknownAcceptanceCriterionIds.length > 0)) {
    issues.push("COMPLETED_RESULT_HAS_UNRESOLVED_CRITERIA");
  }
  return issues;
}

function inspectOutputFile(observation: RemoteOutputFileObservation) {
  if (observation.state === "NOT_REQUESTED" || observation.state === "ABSENT") {
    return { state: observation.state, byteLength: null, result: undefined, diagnostics: emptyOutputDiagnostics(observation.state) } as const;
  }
  if (observation.state === "READ_ERROR") {
    return { state: "READ_ERROR" as const, byteLength: null, result: undefined, diagnostics: emptyOutputDiagnostics("READ_ERROR") };
  }
  const byteLength = Buffer.byteLength(observation.content, "utf8");
  const baseDiagnostics = {
    byteLength,
    digest: `sha256:${createHash("sha256").update(observation.content).digest("hex")}`,
    tail: redactSandboxTail(observation.content),
  };
  if (byteLength > MAX_REMOTE_EXECUTOR_OUTPUT_BYTES) {
    return { state: "TOO_LARGE" as const, byteLength, result: undefined, diagnostics: { state: "TOO_LARGE" as const, ...baseDiagnostics, validationIssues: ["RESULT_TOO_LARGE"] } };
  }
  const trimmed = observation.content.trim();
  if (!trimmed) return { state: "EMPTY" as const, byteLength, result: undefined, diagnostics: { state: "EMPTY" as const, ...baseDiagnostics, validationIssues: ["RESULT_EMPTY"] } };
  let candidate: unknown;
  try {
    candidate = JSON.parse(trimmed);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const truncated = /unexpected end|unterminated/i.test(message) || !/[}\]]$/.test(trimmed);
    const state = truncated ? "TRUNCATED" as const : "INVALID_JSON" as const;
    return { state, byteLength, result: undefined, diagnostics: { state, ...baseDiagnostics, validationIssues: [state === "TRUNCATED" ? "JSON_TRUNCATED" : "JSON_INVALID"] } };
  }
  const validationIssues = factoryResultValidationIssues(candidate);
  const result = validateFactoryResultObject(candidate);
  return result
    ? { state: "VALID" as const, byteLength, result, diagnostics: { state: "VALID" as const, ...baseDiagnostics, validationIssues: [] } }
    : { state: "SCHEMA_INVALID" as const, byteLength, result: undefined, diagnostics: { state: "SCHEMA_INVALID" as const, ...baseDiagnostics, validationIssues } };
}

function emptyOutputDiagnostics(state: "NOT_REQUESTED" | "ABSENT" | "READ_ERROR") {
  return { state, byteLength: null, digest: null, tail: "", validationIssues: [] as string[] };
}

function inspectJsonl(stdout: string) {
  const byteLength = Buffer.byteLength(stdout, "utf8");
  const lines = stdout.split("\n").filter((line) => line.trim().length > 0);
  let malformedLineCount = 0;
  let terminalCompletedCount = 0;
  let terminalFailureCount = 0;
  const candidates: Array<{ result: FactoryResultV1; index: number }> = [];
  let completedIndex = -1;
  if (byteLength <= MAX_REMOTE_EXECUTOR_OUTPUT_BYTES && lines.length <= MAX_REMOTE_JSONL_LINES) {
    lines.forEach((line, index) => {
      let event: any;
      try {
        event = JSON.parse(line);
      } catch {
        malformedLineCount += 1;
        return;
      }
      if (event?.type === "turn.completed") {
        terminalCompletedCount += 1;
        completedIndex = index;
      }
      if (["turn.failed", "turn.canceled", "error"].includes(event?.type)) terminalFailureCount += 1;
      if (event?.type === "item.completed"
        && event.item?.type === "agent_message"
        && typeof event.item.text === "string") {
        const result = parseFactoryResult(event.item.text);
        if (result) candidates.push({ result, index });
      }
    });
  }
  const result = byteLength <= MAX_REMOTE_EXECUTOR_OUTPUT_BYTES
    && lines.length <= MAX_REMOTE_JSONL_LINES
    && malformedLineCount === 0
    && terminalCompletedCount === 1
    && terminalFailureCount === 0
    && candidates.length === 1
    && candidates[0].index < completedIndex
      ? candidates[0].result
      : undefined;
  return {
    result,
    tooLarge: byteLength > MAX_REMOTE_EXECUTOR_OUTPUT_BYTES || lines.length > MAX_REMOTE_JSONL_LINES,
    provenance: {
      byteLength,
      lineCount: Math.min(lines.length, MAX_REMOTE_JSONL_LINES + 1),
      malformedLineCount,
      terminalCompletedCount,
      terminalFailureCount,
      validCandidateCount: candidates.length,
    },
  };
}

function reconstructionFailure(
  file: ReturnType<typeof inspectOutputFile>,
  jsonl: ReturnType<typeof inspectJsonl>,
) {
  if (jsonl.tooLarge) {
    return remoteFailure("NON_RETRYABLE_RESULT", "JSONL_TOO_LARGE", "RESULT_RECONSTRUCTION", "Codex JSONL exceeded the frozen reconstruction bound.");
  }
  if (jsonl.provenance.malformedLineCount > 0) {
    return remoteFailure("NON_RETRYABLE_RESULT", "JSONL_MALFORMED", "RESULT_RECONSTRUCTION", "Codex JSONL contained malformed non-empty lines.");
  }
  if (jsonl.provenance.validCandidateCount > 1) {
    return remoteFailure("NON_RETRYABLE_RESULT", "JSONL_AMBIGUOUS", "RESULT_RECONSTRUCTION", "Codex JSONL contained multiple schema-valid result candidates.");
  }
  if (jsonl.provenance.terminalFailureCount > 0) {
    return remoteFailure("NON_RETRYABLE_RESULT", "JSONL_TERMINAL_FAILURE", "RESULT_RECONSTRUCTION", "Codex JSONL ended in a terminal failure state.");
  }
  if (jsonl.provenance.validCandidateCount === 1 && jsonl.provenance.terminalCompletedCount !== 1) {
    return remoteFailure("NON_RETRYABLE_RESULT", "JSONL_INCOMPLETE", "RESULT_RECONSTRUCTION", "Codex JSONL had a result candidate without exactly one terminal completion event.");
  }
  const codeByState: Record<RemoteOutputFileState, string> = {
    NOT_REQUESTED: "RESULT_MISSING",
    ABSENT: "RESULT_FILE_MISSING",
    EMPTY: "RESULT_FILE_EMPTY",
    TRUNCATED: "RESULT_FILE_TRUNCATED",
    INVALID_JSON: "RESULT_INVALID_JSON",
    SCHEMA_INVALID: "RESULT_SCHEMA_INVALID",
    TOO_LARGE: "RESULT_FILE_TOO_LARGE",
    READ_ERROR: "RESULT_FILE_READ_ERROR",
    VALID: "RESULT_UNACCEPTED",
  };
  return remoteFailure(
    "NON_RETRYABLE_RESULT",
    codeByState[file.state],
    "RESULT_RECONSTRUCTION",
    `No accepted factory-result/v1 was available; output-file state was ${file.state}.`,
  );
}

function failed(
  provenance: RemoteResultProvenance,
  diagnostics: RemoteStructuredResultResolution["diagnostics"],
  failure: RemoteFailure,
  result: FactoryResultV1 = failedFactoryResult(failure),
): RemoteStructuredResultResolution {
  return { accepted: false, result, provenance, diagnostics, failure };
}

function failedFactoryResult(failure: RemoteFailure): FactoryResultV1 {
  return {
    schema: "factory-result/v1",
    status: "FAILED",
    summary: failure.summary || "Remote executor did not return an accepted result.",
    completedAcceptanceCriterionIds: [],
    incompleteAcceptanceCriterionIds: [],
    unknownAcceptanceCriterionIds: [],
    verificationCommands: [],
    knownRisks: [`${failure.class}:${failure.code}`],
    nextAction: "Inspect the bounded remote execution evidence before deciding whether to retry.",
  };
}

function boundedString(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.length <= maxLength;
}

function boundedNonEmptyString(value: unknown, maxLength: number): value is string {
  return boundedString(value, maxLength) && value.trim().length > 0;
}

function boundedStringArray(value: unknown): value is string[] {
  return Array.isArray(value)
    && value.length <= 200
    && value.every((item) => typeof item === "string" && item.length <= 2_000);
}

function boundedDiagnostic(value: string) {
  return value.replace(/\bsk-or-v1-[A-Za-z0-9_-]+/g, "[REDACTED_OPENROUTER_KEY]")
    .replace(/\bgh[pousr]_[A-Za-z0-9_]+/g, "[REDACTED_PROVIDER_TOKEN]")
    .replace(/(authorization|cookie|token|secret|password|api[-_]?key)\s*[:=]\s*([^\s,;]+)/gi, "$1=[REDACTED]")
    .slice(-1_000);
}
