export const RESEARCH_RUN_LEASE_MS = 60_000;
export const RESEARCH_RUN_MAX_ATTEMPTS = 3;
export const RESEARCH_MANUAL_PROJECT_CONCURRENCY = 3;
export const RESEARCH_RUN_VERIFIER = "research-ingestion-verifier-v1";

type EligibleSource = {
  state?: string;
  kind?: string;
  validationStatus?: string;
  policyReviewState?: string;
  canonicalUrl?: string;
  maxItemsPerRun?: number;
  retentionDays?: number;
  adapter?: { name?: string; authenticationMode?: string };
};

export function manualRunEligibilityIssues(source: EligibleSource): string[] {
  const issues: string[] = [];
  if (source.state !== "ACTIVE") issues.push("Source authority must be active.");
  if (source.kind !== "RSS_ATOM") issues.push("Manual collection currently supports RSS or Atom sources only.");
  if (source.validationStatus !== "PASSED") issues.push("Source validation must pass before collection.");
  if (source.policyReviewState !== "APPROVED") issues.push("Source policy approval is required before collection.");
  if (!source.canonicalUrl?.startsWith("https://")) issues.push("An exact canonical HTTPS source URL is required.");
  if (!Number.isInteger(source.maxItemsPerRun) || (source.maxItemsPerRun ?? 0) < 1 || (source.maxItemsPerRun ?? 0) > 100) {
    issues.push("Source item cap must be between 1 and 100.");
  }
  if (!Number.isInteger(source.retentionDays) || (source.retentionDays ?? 0) < 1 || (source.retentionDays ?? 0) > 3_650) {
    issues.push("Source retention must be between 1 and 3,650 days.");
  }
  if (source.adapter?.name !== "web-rss" || source.adapter.authenticationMode !== "NONE") {
    issues.push("Source must use the approved credential-free Web/RSS adapter policy.");
  }
  return issues;
}

export function retryDelayMs(attemptCount: number, providerRetryAfterMs?: number): number {
  const boundedAttempt = Math.min(Math.max(Math.trunc(attemptCount), 1), RESEARCH_RUN_MAX_ATTEMPTS);
  const exponential = 30_000 * (2 ** (boundedAttempt - 1));
  const providerDelay = Number.isFinite(providerRetryAfterMs)
    ? Math.max(providerRetryAfterMs ?? 0, 0)
    : 0;
  return Math.min(Math.max(exponential, providerDelay), 24 * 60 * 60 * 1_000);
}

export function manualRunStartDecision(
  existing: {
    status: string;
    retryable?: boolean;
    attemptCount: number;
    nextRetryAt?: number;
    lease?: { expiresAt: number };
  } | null,
  now: number,
): "START" | "REPLAY" | "IN_PROGRESS" | "BACKOFF" | "RETRY" | "EXHAUSTED" {
  if (!existing) return "START";
  if (existing.status === "VERIFIED" || existing.status === "AWAITING_VERIFICATION") return "REPLAY";
  if (existing.status === "RUNNING" && (existing.lease?.expiresAt ?? 0) > now) return "IN_PROGRESS";
  if (existing.attemptCount >= RESEARCH_RUN_MAX_ATTEMPTS) return "EXHAUSTED";
  if (existing.status === "FAILED" && (existing.nextRetryAt ?? 0) > now) return "BACKOFF";
  if (existing.status === "RUNNING" || (existing.status === "FAILED" && existing.retryable)) return "RETRY";
  return "EXHAUSTED";
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, nested]) => nested !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, stableValue(nested)]),
    );
  }
  return value;
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(stableValue(value));
}

export function evidenceVerificationIssues(input: {
  artifactHash?: string;
  recomputedHash: string;
  artifactWorkflowRunId?: string;
  workflowRunId: string;
  artifactProjectId?: string;
  projectId: string;
  observations: Array<{
    runArtifactId: string;
    workflowRunId: string;
    sourceId: string;
    providerItemId: string;
    contentHash: string;
    excerptHash: string;
  }>;
  evidenceObservations?: Array<{
    providerItemId?: string;
    contentHash?: string;
    excerptHash?: string;
  }>;
  runArtifactId: string;
  sourceId: string;
  expectedObservationCount: number;
  sourceVersion: number;
  evidenceSourceId?: string;
  evidenceSourceVersion?: number;
  evidenceWorkflowRunId?: string;
  evidenceCursorAfter?: unknown;
  sourceRunCursorAfter?: unknown;
  sourceCursorState?: unknown;
  sourceCursorWorkflowRunId?: string;
}): string[] {
  const issues: string[] = [];
  if (!input.artifactHash || input.artifactHash !== input.recomputedHash) issues.push("Artifact evidence digest does not match persisted content.");
  if (input.artifactWorkflowRunId !== input.workflowRunId) issues.push("Artifact workflow lineage does not match the source run.");
  if (input.artifactProjectId !== input.projectId) issues.push("Artifact workspace lineage does not match the source run.");
  if (input.observations.length !== input.expectedObservationCount) issues.push("Persisted observation count does not match the committed run.");
  if (input.observations.some((observation) => observation.runArtifactId !== input.runArtifactId
    || observation.workflowRunId !== input.workflowRunId
    || observation.sourceId !== input.sourceId)) {
    issues.push("One or more observations have broken artifact, workflow, or source lineage.");
  }
  const evidenceObservationKeys = new Set((input.evidenceObservations ?? []).map((observation) => stableStringify(observation)));
  if (input.observations.some((observation) => !evidenceObservationKeys.has(stableStringify({
    providerItemId: observation.providerItemId,
    contentHash: observation.contentHash,
    excerptHash: observation.excerptHash,
  })))) {
    issues.push("One or more persisted observations do not match the hashed artifact manifest.");
  }
  if (input.evidenceSourceId !== input.sourceId || input.evidenceSourceVersion !== input.sourceVersion) {
    issues.push("Artifact source identity or version does not match the frozen source run.");
  }
  if (input.evidenceWorkflowRunId !== input.workflowRunId) {
    issues.push("Artifact evidence workflow lineage does not match the source run.");
  }
  if (stableStringify(input.evidenceCursorAfter) !== stableStringify(input.sourceRunCursorAfter)
    || stableStringify(input.sourceCursorState) !== stableStringify(input.sourceRunCursorAfter)
    || input.sourceCursorWorkflowRunId !== input.workflowRunId) {
    issues.push("Persisted source cursor checkpoint does not match the artifact and source run.");
  }
  return issues;
}
