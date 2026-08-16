import { canonicalDigest } from "@mission-control/shared";
import { SANDBOX_RESULT_SCHEMA } from "./sandboxProvider.js";

export const MAX_SANDBOX_RESULT_BYTES = 10 * 1024 * 1024;
export const MAX_SANDBOX_PATCH_BYTES = 8 * 1024 * 1024;

export interface SandboxResultBundle {
  schema: typeof SANDBOX_RESULT_SCHEMA;
  attemptId: string;
  workOrderId: string;
  workOrderRevisionNumber: number;
  workflowRunId: string;
  manifestDigest: string;
  profileDigest: string;
  sourceSha: string;
  candidateSha?: string;
  supervisorVersion: string;
  environment: {
    provider: "EXE_DEV" | "FAKE";
    image: string;
  };
  startedAt: number;
  finishedAt: number;
  status: "COMPLETED" | "FAILED" | "CANCELED" | "TIMED_OUT";
  structuredResult: {
    schema: "factory-result/v1";
    status: "COMPLETED" | "BLOCKED" | "FAILED";
    summary: string;
    completedAcceptanceCriterionIds: string[];
    incompleteAcceptanceCriterionIds: string[];
    unknownAcceptanceCriterionIds: string[];
    verificationCommands: string[];
    knownRisks: string[];
    nextAction: string;
  };
  changedFiles: string[];
  diff: {
    filesChanged: number;
    linesAdded?: number;
    linesDeleted?: number;
  };
  commandResults: Array<{
    commandClass: "EXECUTOR" | "TEST" | "BUILD" | "LINT" | "OTHER";
    exitCode: number | null;
    durationMs: number;
    timedOut: boolean;
  }>;
  verificationInputs: { reportedCommands: string[] };
  artifacts: Array<{ name: string; digest: string; mediaType?: string }>;
  events: Array<{ type: string; occurredAt: number }>;
  patch: {
    format: "GIT_BINARY_DIFF";
    encoding: "BASE64";
    byteLength: number;
    digest: string;
    content: string;
  };
  executor: {
    exitCode: number | null;
    stdoutDigest: string;
    stderrDigest: string;
    stdoutTail: string;
    stderrTail: string;
  };
  usage: {
    providerCostUsd?: number;
    inferenceCostUsd?: number;
    inputTokens?: number;
    outputTokens?: number;
    providerRuntimeMs: number;
    observedAt: number;
    enforcement: "PROVIDER_REPORTED" | "OBSERVATION_ONLY";
  };
  digest: string;
}

type BundleWithoutDigest = Omit<SandboxResultBundle, "digest">;

export function createSandboxResultBundle(input: BundleWithoutDigest): SandboxResultBundle {
  const normalized = normalizeBundle(input);
  return { ...normalized, digest: sandboxResultDigest(normalized) };
}

export function sandboxResultDigest(input: BundleWithoutDigest) {
  return canonicalDigest("factory-sandbox-result/v1", input);
}

export function encodeSandboxResultBundle(bundle: SandboxResultBundle) {
  return Buffer.from(JSON.stringify(bundle), "utf8");
}

export function parseAndValidateSandboxResultBundle(
  payload: Buffer,
  expected: {
    attemptId: string;
    workOrderId: string;
    workOrderRevisionNumber: number;
    workflowRunId: string;
    manifestDigest: string;
    profileDigest: string;
    sourceSha: string;
    supervisorVersion: string;
    environment: SandboxResultBundle["environment"];
    maxRuntimeMs: number;
  },
): SandboxResultBundle {
  if (payload.byteLength > MAX_SANDBOX_RESULT_BYTES) throw new Error("Sandbox result bundle exceeds the 10 MB control-plane limit.");
  let candidate: unknown;
  try {
    candidate = JSON.parse(payload.toString("utf8"));
  } catch {
    throw new Error("Sandbox result bundle is not valid JSON.");
  }
  const bundle = assertBundleShape(candidate);
  if (bundle.attemptId !== expected.attemptId || bundle.workflowRunId !== expected.workflowRunId) throw new Error("Sandbox result Attempt identity does not match the lease owner.");
  if (bundle.workOrderId !== expected.workOrderId || bundle.workOrderRevisionNumber !== expected.workOrderRevisionNumber) throw new Error("Sandbox result WorkOrder revision does not match the frozen Attempt.");
  if (bundle.manifestDigest !== expected.manifestDigest || bundle.profileDigest !== expected.profileDigest) throw new Error("Sandbox result is not bound to the frozen manifest and profile.");
  if (bundle.sourceSha !== expected.sourceSha) throw new Error("Sandbox result source SHA does not match the frozen source revision.");
  if (bundle.supervisorVersion !== expected.supervisorVersion
    || bundle.environment.provider !== expected.environment.provider
    || bundle.environment.image !== expected.environment.image) {
    throw new Error("Sandbox result environment does not match the frozen supervisor and profile.");
  }
  if (bundle.finishedAt - bundle.startedAt > expected.maxRuntimeMs || bundle.usage.providerRuntimeMs > expected.maxRuntimeMs) {
    throw new Error("Sandbox result exceeds the frozen runtime boundary.");
  }
  const { digest, ...withoutDigest } = bundle;
  if (digest !== sandboxResultDigest(withoutDigest)) throw new Error("Sandbox result bundle digest is invalid.");
  const patch = Buffer.from(bundle.patch.content, "base64");
  if (patch.byteLength !== bundle.patch.byteLength || patch.byteLength > MAX_SANDBOX_PATCH_BYTES) throw new Error("Sandbox result patch length is invalid.");
  if (canonicalDigest("factory-sandbox-patch/v1", patch.toString("base64")) !== bundle.patch.digest) throw new Error("Sandbox result patch digest is invalid.");
  return bundle;
}

export function createPatchDescriptor(patch: Buffer): SandboxResultBundle["patch"] {
  if (patch.byteLength > MAX_SANDBOX_PATCH_BYTES) throw new Error("Sandbox patch exceeds the 8 MB limit.");
  const content = patch.toString("base64");
  return {
    format: "GIT_BINARY_DIFF",
    encoding: "BASE64",
    byteLength: patch.byteLength,
    digest: canonicalDigest("factory-sandbox-patch/v1", content),
    content,
  };
}

function normalizeBundle(input: BundleWithoutDigest): BundleWithoutDigest {
  return {
    ...input,
    executor: {
      ...input.executor,
      stdoutTail: input.executor.stdoutTail.slice(-16_000),
      stderrTail: input.executor.stderrTail.slice(-16_000),
    },
  };
}

function assertBundleShape(candidate: any): SandboxResultBundle {
  const structured = candidate?.structuredResult;
  const stringArrays = [
    "completedAcceptanceCriterionIds", "incompleteAcceptanceCriterionIds", "unknownAcceptanceCriterionIds",
    "verificationCommands", "knownRisks",
  ];
  if (!candidate || typeof candidate !== "object"
    || candidate.schema !== SANDBOX_RESULT_SCHEMA
    || typeof candidate.digest !== "string" || !candidate.digest.startsWith("sha256:")
    || ["attemptId", "workOrderId", "workflowRunId", "manifestDigest", "profileDigest", "sourceSha", "supervisorVersion"].some((field) => typeof candidate[field] !== "string" || !candidate[field])
    || !Number.isSafeInteger(candidate.workOrderRevisionNumber) || candidate.workOrderRevisionNumber < 1
    || (candidate.candidateSha !== undefined && (typeof candidate.candidateSha !== "string" || !/^[a-f0-9]{40,64}$/i.test(candidate.candidateSha)))
    || !["EXE_DEV", "FAKE"].includes(candidate.environment?.provider) || typeof candidate.environment?.image !== "string" || !candidate.environment.image
    || !Number.isFinite(candidate.startedAt) || !Number.isFinite(candidate.finishedAt) || candidate.finishedAt < candidate.startedAt
    || !["COMPLETED", "FAILED", "CANCELED", "TIMED_OUT"].includes(candidate.status)
    || structured?.schema !== "factory-result/v1"
    || !["COMPLETED", "BLOCKED", "FAILED"].includes(structured?.status)
    || typeof structured?.summary !== "string" || !structured.summary.trim()
    || typeof structured?.nextAction !== "string"
    || stringArrays.some((field) => !Array.isArray(structured?.[field]) || structured[field].some((item: unknown) => typeof item !== "string"))
    || !Array.isArray(candidate.changedFiles) || candidate.changedFiles.some((item: unknown) => typeof item !== "string" || !item)
    || !Number.isSafeInteger(candidate.diff?.filesChanged) || candidate.diff.filesChanged !== candidate.changedFiles.length
    || [candidate.diff?.linesAdded, candidate.diff?.linesDeleted].some((value) => value !== undefined && (!Number.isSafeInteger(value) || value < 0))
    || !Array.isArray(candidate.commandResults) || candidate.commandResults.some((result: any) => !["EXECUTOR", "TEST", "BUILD", "LINT", "OTHER"].includes(result?.commandClass) || !Number.isFinite(result?.durationMs) || typeof result?.timedOut !== "boolean")
    || !Array.isArray(candidate.verificationInputs?.reportedCommands) || candidate.verificationInputs.reportedCommands.some((item: unknown) => typeof item !== "string")
    || !Array.isArray(candidate.artifacts) || candidate.artifacts.some((artifact: any) => typeof artifact?.name !== "string" || typeof artifact?.digest !== "string")
    || !Array.isArray(candidate.events) || candidate.events.some((event: any) => typeof event?.type !== "string" || !Number.isFinite(event?.occurredAt))
    || candidate.patch?.format !== "GIT_BINARY_DIFF" || candidate.patch?.encoding !== "BASE64"
    || typeof candidate.patch?.content !== "string" || typeof candidate.patch?.digest !== "string" || !Number.isSafeInteger(candidate.patch?.byteLength)
    || typeof candidate.executor?.stdoutDigest !== "string" || typeof candidate.executor?.stderrDigest !== "string"
    || typeof candidate.executor?.stdoutTail !== "string" || typeof candidate.executor?.stderrTail !== "string"
    || !Number.isFinite(candidate.usage?.observedAt) || !Number.isFinite(candidate.usage?.providerRuntimeMs) || candidate.usage.providerRuntimeMs < 0
    || [candidate.usage?.providerCostUsd, candidate.usage?.inferenceCostUsd].some((value) => value !== undefined && (!Number.isFinite(value) || value < 0))
    || [candidate.usage?.inputTokens, candidate.usage?.outputTokens].some((value) => value !== undefined && (!Number.isSafeInteger(value) || value < 0))
    || !["PROVIDER_REPORTED", "OBSERVATION_ONLY"].includes(candidate.usage?.enforcement)) {
    throw new Error("Sandbox result bundle failed schema validation.");
  }
  return candidate as SandboxResultBundle;
}
