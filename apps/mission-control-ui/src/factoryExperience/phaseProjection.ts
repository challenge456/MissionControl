import type { FactoryPhaseKind } from "./recipeCatalog";

export interface FactoryTraceObservation {
  _id: string;
  parentObservationId?: string;
  type: string;
  name: string;
  status: "RUNNING" | "SUCCESS" | "FAILED";
  startedAt: number;
  endedAt?: number;
  durationMs?: number;
  input?: unknown;
  output?: unknown;
  metadata?: unknown;
  model?: string;
  provider?: string;
  promptVersion?: string;
  toolName?: string;
  tokenUsage?: {
    input?: number;
    output?: number;
    cached?: number;
    total?: number;
  };
  estimatedCostUsd?: number;
  evidenceEnvelopeIds?: unknown[];
  error?: { code?: string; message: string };
}

export interface FactoryPhaseProjection extends FactoryTraceObservation {
  kind: FactoryPhaseKind;
  owner: string;
  retry: number | null;
  artifacts: unknown[];
  gates: unknown[];
}

const HUMAN_NAME =
  /\b(request|approval|approve|accept|merge|human|operator|decision)\b/i;

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function classifyObservationKind(
  observation: FactoryTraceObservation,
): FactoryPhaseKind {
  const metadata = record(observation.metadata);
  const actorType = String(
    metadata.actorType ?? metadata.ownerType ?? "",
  ).toUpperCase();
  if (actorType === "HUMAN" || HUMAN_NAME.test(observation.name))
    return "human";
  if (
    observation.model ||
    ["AGENT", "GENERATION", "RETRIEVAL", "EMBEDDING"].includes(
      observation.type,
    ) ||
    (observation.type === "EVALUATOR" &&
      Boolean(metadata.model ?? metadata.provider))
  )
    return "agent";
  return "code";
}

export function projectFactoryPhases(
  observations: FactoryTraceObservation[],
): FactoryPhaseProjection[] {
  return [...observations]
    .sort(
      (left, right) =>
        left.startedAt - right.startedAt || left.name.localeCompare(right.name),
    )
    .map((observation) => {
      const metadata = record(observation.metadata);
      const kind = classifyObservationKind(observation);
      const owner =
        kind === "human"
          ? String(metadata.actorName ?? metadata.actorId ?? "Operator")
          : kind === "agent"
            ? String(
                metadata.agent ?? metadata.role ?? observation.model ?? "Agent",
              )
            : String(
                observation.toolName ??
                  metadata.executor ??
                  metadata.owner ??
                  "Deterministic code",
              );
      const retryValue =
        metadata.retry ?? metadata.retryIndex ?? metadata.attempt;
      const retry =
        typeof retryValue === "number" && Number.isFinite(retryValue)
          ? retryValue
          : null;
      const output = record(observation.output);
      const artifacts = Array.isArray(output.artifacts)
        ? output.artifacts
        : Array.isArray(metadata.artifacts)
          ? metadata.artifacts
          : [];
      const gates = Array.isArray(output.gates)
        ? output.gates
        : Array.isArray(metadata.gates)
          ? metadata.gates
          : [];
      return { ...observation, kind, owner, retry, artifacts, gates };
    });
}

export function phaseCounts(phases: FactoryPhaseProjection[]) {
  return phases.reduce<Record<FactoryPhaseKind, number>>(
    (counts, phase) => {
      counts[phase.kind] += 1;
      return counts;
    },
    { human: 0, agent: 0, code: 0 },
  );
}

export function phaseInspectorSections(phase: FactoryPhaseProjection) {
  const input = record(phase.input);
  const metadata = record(phase.metadata);
  const output = record(phase.output);
  const systemPrompt =
    input.systemPrompt ?? input.system ?? metadata.systemPrompt;
  const userPrompt =
    input.userPrompt ?? input.prompt ?? metadata.userPrompt ?? metadata.prompt;
  return {
    input: {
      request: input.request ?? input.task ?? input.objective,
      contextPackage:
        input.contextPackage ??
        input.contextPackageId ??
        metadata.contextPackageId,
      previousHandoff:
        input.previous ?? input.handoff ?? metadata.previousHandoff,
      raw: phase.input,
    },
    prompt: {
      systemPrompt,
      userPrompt,
      version:
        phase.promptVersion ??
        metadata.promptVersion ??
        metadata.promptIdentity,
    },
    configuration: {
      model: phase.model,
      provider: phase.provider,
      reasoning: metadata.reasoning ?? metadata.thinkingPolicy,
      harness: metadata.harness ?? metadata.executor,
      tools: metadata.tools ?? metadata.capabilities,
      writeScope: metadata.writeScope ?? metadata.writes,
    },
    execution: {
      tool: phase.toolName,
      durationMs: phase.durationMs,
      tokens: phase.tokenUsage,
      costUsd: phase.estimatedCostUsd,
      retry: phase.retry,
      error: phase.error,
    },
    output: {
      summary: output.summary,
      artifacts: phase.artifacts,
      handoff:
        output.notesForNextAgent ??
        output.notes_for_next_agent ??
        output.handoff,
      raw: phase.output,
    },
    gates: {
      checks: phase.gates,
      evidenceEnvelopeIds: phase.evidenceEnvelopeIds ?? [],
    },
  };
}
