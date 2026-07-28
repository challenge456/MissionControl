export type RunEventStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "PAUSED" | "CANCELED" | string;

export interface RunEventLike {
  _id?: string;
  eventType: string;
  workflowStep?: string;
  sequenceNumber: number;
  status?: RunEventStatus;
  commandSummary?: string;
  toolName?: string;
  retryNumber?: number;
  startedAt?: number;
  endedAt?: number;
  durationMs?: number;
  errorCategory?: string;
  errorSummary?: string;
  verificationReceiptId?: string;
  evidenceArtifactIds?: string[];
  metadata?: any;
}

export interface RunArtifactLike {
  _id?: string;
  artifactType: string;
  name: string;
  producer?: string;
  verificationReceiptId?: string;
  acceptanceCriterionId?: string;
  producingEventId?: string;
  repositoryPath?: string;
  externalLocation?: string;
  createdAt: number;
}

export type ContinuousLineageStatus = "COMPLETE" | "MISSING" | "NOT_REQUIRED" | "PENDING";

export interface ContinuousLineageStage {
  id: "evidence" | "claims" | "recommendation" | "approval" | "implementation" | "verification" | "measurement";
  label: string;
  status: ContinuousLineageStatus;
  count: number;
  summary: string;
  details: string[];
  target: "timeline" | "files" | "artifacts" | "receipts";
}

export function orderRunEvents<T extends RunEventLike>(events: T[]) {
  return [...events].sort((a, b) => {
    if (a.sequenceNumber !== b.sequenceNumber) return a.sequenceNumber - b.sequenceNumber;
    return (a.startedAt ?? 0) - (b.startedAt ?? 0);
  });
}

export function summarizeRunEvents(events: RunEventLike[]) {
  const ordered = orderRunEvents(events);
  const latest = ordered[ordered.length - 1];
  return {
    currentStep: [...ordered].reverse().find((event) => event.workflowStep)?.workflowStep ?? null,
    humanInterventionRequired: ordered.some((event) => event.eventType === "HUMAN_INTERVENTION_REQUESTED"),
    retryCount: ordered.filter((event) => event.eventType === "RETRY_STARTED").length,
    failure: latest?.eventType === "RUN_FAILED" ? latest.errorSummary ?? latest.commandSummary ?? null : null,
  };
}

export function buildFileChanges(events: RunEventLike[]) {
  return orderRunEvents(events)
    .filter((event) => event.eventType === "FILE_CHANGED")
    .map((event) => ({
      sequenceNumber: event.sequenceNumber,
      workflowStep: event.workflowStep,
      repositoryPath: event.metadata?.repositoryPath ?? event.metadata?.path ?? null,
      changeType: event.metadata?.changeType ?? "modified",
      diffLocation: event.metadata?.diffLocation ?? null,
      pullRequestUrl: event.metadata?.pullRequestUrl ?? null,
      commandSummary: event.commandSummary ?? null,
    }));
}

export function buildRetryTimeline(events: RunEventLike[]) {
  const ordered = orderRunEvents(events);
  const retries = ordered.filter((event) => event.eventType === "RETRY_STARTED");
  return retries.map((retry) => {
    const completion = ordered.find((event) => event.eventType === "RETRY_COMPLETED" && event.retryNumber === retry.retryNumber);
    return {
      retryNumber: retry.retryNumber ?? 0,
      workflowStep: retry.workflowStep ?? null,
      reason: retry.errorSummary ?? retry.commandSummary ?? null,
      checkpointArtifactId: retry.metadata?.checkpointArtifactId ?? null,
      outcome: completion?.status ?? completion?.eventType ?? null,
    };
  });
}

export function buildEvidenceLineage(args: {
  verificationReceiptId?: string | null;
  acceptanceCriterionId?: string | null;
  events: RunEventLike[];
  artifacts: RunArtifactLike[];
}) {
  const events = orderRunEvents(args.events).filter((event) =>
    (args.verificationReceiptId && event.verificationReceiptId === args.verificationReceiptId)
      || (args.acceptanceCriterionId && event.metadata?.acceptanceCriterionId === args.acceptanceCriterionId)
      || (args.acceptanceCriterionId && event.workflowStep === args.acceptanceCriterionId)
  );
  const artifacts = [...args.artifacts]
    .filter((artifact) =>
      (args.verificationReceiptId && artifact.verificationReceiptId === args.verificationReceiptId)
        || (args.acceptanceCriterionId && artifact.acceptanceCriterionId === args.acceptanceCriterionId)
    )
    .sort((a, b) => a.createdAt - b.createdAt);
  return { events, artifacts };
}

function arrayValue(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function readableDetail(value: unknown, fallback: string) {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return fallback;
  const record = value as Record<string, unknown>;
  for (const key of ["title", "claim", "recommendation", "name", "summary", "url", "id"]) {
    if (typeof record[key] === "string" && record[key]) return record[key] as string;
  }
  return fallback;
}

function stageDetails(values: unknown[], fallback: string) {
  return values.slice(0, 5).map((value, index) => readableDetail(value, `${fallback} ${index + 1}`));
}

export function buildContinuousEvidenceLineage(args: {
  context?: Record<string, any> | null;
  approval?: Record<string, any> | null;
  fileChanges?: Array<{ repositoryPath?: string | null }>;
  artifacts?: RunArtifactLike[];
  receipts?: Array<{ acceptanceCriterionId?: string; status?: string; result?: string }>;
}): ContinuousLineageStage[] {
  const context = args.context ?? {};
  const researchOutputs = Object.entries(context)
    .filter(([key]) => /^research.+Output$/.test(key))
    .map(([, value]) => value)
    .filter((value) => value && typeof value === "object");
  const sources = researchOutputs.flatMap((output: any) => arrayValue(output.sourceLedger));
  const uniqueSources = [...new Map(sources.map((source, index) => {
    const key = source?.url ?? source?.title ?? `source-${index}`;
    return [key, source] as const;
  })).values()];

  const verificationOutputs = Object.entries(context)
    .filter(([key]) => /^verify.+Output$/.test(key))
    .map(([, value]) => value)
    .filter((value) => value && typeof value === "object");
  const claims = verificationOutputs.flatMap((output: any) => arrayValue(output.acceptedClaims));
  const synthesis = context.synthesizeOutput && typeof context.synthesizeOutput === "object"
    ? context.synthesizeOutput
    : {};
  const recommendations = arrayValue(synthesis.recommendations);
  const measurements = arrayValue(synthesis.measurements);
  const hasSynthesis = Object.keys(synthesis).length > 0;
  const noChangeRequired = hasSynthesis && recommendations.length === 0;
  const approvalStatus = args.approval?.status ?? context.approvalOutput;
  const approvalComplete = approvalStatus === "APPROVED";
  const implementationEvidence = [
    ...(args.fileChanges ?? []).map((change) => change.repositoryPath).filter(Boolean),
    ...(args.artifacts ?? [])
      .filter((artifact) => artifact.artifactType === "CODE_DIFF")
      .map((artifact) => artifact.repositoryPath ?? artifact.name),
  ];
  const receipts = args.receipts ?? [];
  const acceptedReceipts = receipts.filter((receipt) => ["PASSED", "WAIVED"].includes(receipt.status ?? ""));

  return [
    {
      id: "evidence",
      label: "Research evidence",
      status: uniqueSources.length > 0 ? "COMPLETE" : "MISSING",
      count: uniqueSources.length,
      summary: uniqueSources.length > 0
        ? `${uniqueSources.length} unique sources preserved from the research lanes.`
        : "No source ledger is attached to this run.",
      details: stageDetails(uniqueSources, "Source"),
      target: "artifacts",
    },
    {
      id: "claims",
      label: "Verified claims",
      status: claims.length > 0 ? "COMPLETE" : "MISSING",
      count: claims.length,
      summary: claims.length > 0
        ? `${claims.length} independently accepted claims feed synthesis.`
        : "No accepted claims are recorded.",
      details: stageDetails(claims, "Accepted claim"),
      target: "timeline",
    },
    {
      id: "recommendation",
      label: "Recommendation",
      status: recommendations.length > 0 ? "COMPLETE" : noChangeRequired ? "NOT_REQUIRED" : "MISSING",
      count: recommendations.length,
      summary: recommendations.length > 0
        ? `${recommendations.length} evidence-linked recommendations were produced.`
        : noChangeRequired
          ? `Clean stop: ${synthesis.stopCondition ?? "no change was recommended."}`
          : "No synthesis recommendation is recorded.",
      details: stageDetails(recommendations, "Recommendation"),
      target: "artifacts",
    },
    {
      id: "approval",
      label: "Approval",
      status: approvalComplete ? "COMPLETE" : approvalStatus ? "PENDING" : "MISSING",
      count: approvalComplete ? 1 : 0,
      summary: approvalComplete
        ? `Approved by ${args.approval?.decidedByUserId ?? args.approval?.approver ?? "the recorded reviewer"}.`
        : approvalStatus
          ? `Approval status: ${approvalStatus}.`
          : "No approval decision is linked.",
      details: [
        context.approvalEvidenceDigest ? `Evidence digest: ${context.approvalEvidenceDigest}` : "",
        args.approval?.decidedAt ? `Decided ${new Date(args.approval.decidedAt).toISOString()}` : "",
      ].filter(Boolean),
      target: "timeline",
    },
    {
      id: "implementation",
      label: "Implementation",
      status: noChangeRequired ? "NOT_REQUIRED" : implementationEvidence.length > 0 ? "COMPLETE" : "MISSING",
      count: implementationEvidence.length,
      summary: noChangeRequired
        ? "No implementation was required for this clean-stop cycle."
        : implementationEvidence.length > 0
          ? `${implementationEvidence.length} code-change records are linked.`
          : "No structured implementation evidence is linked.",
      details: implementationEvidence.slice(0, 5) as string[],
      target: "files",
    },
    {
      id: "verification",
      label: "Verification",
      status: acceptedReceipts.length > 0 ? "COMPLETE" : receipts.length > 0 ? "PENDING" : "MISSING",
      count: acceptedReceipts.length,
      summary: acceptedReceipts.length > 0
        ? `${acceptedReceipts.length} of ${receipts.length} verification receipts passed or were explicitly waived.`
        : receipts.length > 0
          ? `${receipts.length} verification receipts are present but not accepted.`
          : "No verification receipt is linked.",
      details: acceptedReceipts.slice(0, 5).map((receipt) =>
        `${receipt.acceptanceCriterionId ?? "Criterion"}: ${receipt.status}${receipt.result ? ` — ${receipt.result}` : ""}`
      ),
      target: "receipts",
    },
    {
      id: "measurement",
      label: "Measurement",
      status: measurements.length > 0 ? "COMPLETE" : "MISSING",
      count: measurements.length,
      summary: measurements.length > 0
        ? `${measurements.length} outcome measurements feed the next research cycle.`
        : "No next-cycle measurement is recorded.",
      details: stageDetails(measurements, "Measurement"),
      target: "artifacts",
    },
  ];
}
