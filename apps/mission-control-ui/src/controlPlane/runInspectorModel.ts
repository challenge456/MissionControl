export interface RunInspectorEvent {
  _id?: string;
  eventType: string;
  sequenceNumber: number;
  workflowStep?: string;
  status?: string;
  commandSummary?: string;
  toolName?: string;
  retryNumber?: number;
  errorSummary?: string;
  startedAt?: number;
  endedAt?: number;
  durationMs?: number;
}

export interface RunInspectorArtifact {
  _id?: string;
  artifactType: string;
  name: string;
  createdAt: number;
  verificationReceiptId?: string;
  acceptanceCriterionId?: string;
}

export function orderTimelineEvents<T extends RunInspectorEvent>(events: T[]) {
  return [...events].sort((a, b) => a.sequenceNumber - b.sequenceNumber || (a.startedAt ?? 0) - (b.startedAt ?? 0));
}

export function latestHumanAttention(events: RunInspectorEvent[]) {
  const intervention = [...events].reverse().find((event) => event.eventType === "HUMAN_INTERVENTION_REQUESTED");
  return intervention?.errorSummary ?? intervention?.commandSummary ?? null;
}

export function filterEvidenceArtifacts(artifacts: RunInspectorArtifact[], args: { verificationReceiptId?: string; acceptanceCriterionId?: string }) {
  return artifacts.filter((artifact) =>
    (args.verificationReceiptId && artifact.verificationReceiptId === args.verificationReceiptId)
    || (args.acceptanceCriterionId && artifact.acceptanceCriterionId === args.acceptanceCriterionId)
  );
}
