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
