export type ObservationType =
  | "SPAN"
  | "GENERATION"
  | "AGENT"
  | "TOOL"
  | "RETRIEVAL"
  | "EMBEDDING"
  | "EVENT"
  | "EVALUATOR";

export type ObservationStatus = "RUNNING" | "SUCCESS" | "FAILED";

export interface TokenUsage {
  input?: number;
  output?: number;
  cached?: number;
  total?: number;
}

export interface TraceMetricInput {
  status: "RUNNING" | "SUCCESS" | "FAILED" | "CANCELED";
  durationMs?: number;
  estimatedCostUsd?: number;
  tokenUsage?: TokenUsage;
  humanInterventionCount?: number;
}

const SECRET_KEY = /(authorization|cookie|credential|secret|password|passwd|private.?key|api.?key|^token$|access.?token|refresh.?token)/i;
const CREDENTIAL_PATTERNS = [
  /\b(sk-(?:(?:proj|or|live|test)-)?[a-z0-9_-]{10,})\b/gi,
  /\b(gh[pousr]_[a-z0-9]{10,})\b/gi,
  /\b(AKIA[0-9A-Z]{16})\b/g,
  /\b(xox[baprs]-[a-z0-9-]{10,})\b/gi,
  /\b(eyJ[a-z0-9_-]{10,}\.[a-z0-9_-]{10,}\.[a-z0-9_-]{10,})\b/gi,
  /\b((?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/[^:\s/]+:[^@\s/]+@[^\s]+)\b/gi,
  /(-----BEGIN [A-Z ]*PRIVATE KEY-----)[\s\S]*?(-----END [A-Z ]*PRIVATE KEY-----)/gi,
  /\b(Bearer\s+)[a-z0-9._~+\/-]{8,}/gi,
  /(authorization|cookie|token|secret|password|api[-_]?key)\s*[:=]\s*([^\s,;]+)/gi,
];

function sanitizeString(value: string): string {
  let sanitized = value;
  for (const pattern of CREDENTIAL_PATTERNS) {
    sanitized = sanitized.replace(pattern, (match, prefix) =>
      typeof prefix === "string" && /^(Bearer\s+|authorization|cookie|token|secret|password|api[-_]?key)$/i.test(prefix)
        ? `${prefix}${prefix.toLowerCase().startsWith("bearer") ? "[REDACTED]" : "=[REDACTED]"}`
        : "[REDACTED]"
    );
  }
  return sanitized.slice(0, 20_000);
}

/**
 * Bounded recursive redaction for trace payloads. This deliberately drops
 * deep/large runtime state rather than risking secret or unbounded log capture.
 */
export function sanitizeTraceValue(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "string") return sanitizeString(value);
  if (depth >= 6) return "[TRUNCATED]";
  if (Array.isArray(value)) {
    return value.slice(0, 100).flatMap((item) => {
      const sanitized = sanitizeTraceValue(item, depth + 1);
      return sanitized === undefined ? [] : [sanitized];
    });
  }
  if (typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [rawKey, rawValue] of Object.entries(value).slice(0, 100)) {
      const key = rawKey.slice(0, 200);
      const sanitized = SECRET_KEY.test(key) ? "[REDACTED]" : sanitizeTraceValue(rawValue, depth + 1);
      if (sanitized !== undefined) output[key] = sanitized;
    }
    return output;
  }
  return sanitizeString(String(value));
}

export function normalizeTokenUsage(value: unknown): TokenUsage | undefined {
  if (!value || typeof value !== "object") return undefined;
  const source = value as Record<string, unknown>;
  const finite = (candidate: unknown) =>
    typeof candidate === "number" && Number.isFinite(candidate) && candidate >= 0
      ? candidate
      : undefined;
  const input = finite(source.input ?? source.inputTokens);
  const output = finite(source.output ?? source.outputTokens);
  const cached = finite(source.cached ?? source.cachedTokens);
  const explicitTotal = finite(source.total ?? source.totalTokens);
  // Cached tokens are commonly a subset of input tokens. Do not add them to a
  // derived total or Mission Control would invent usage that the provider did
  // not report.
  const total = explicitTotal ?? [input, output]
    .filter((candidate): candidate is number => candidate !== undefined)
    .reduce((sum, candidate) => sum + candidate, 0);
  if (input === undefined && output === undefined && cached === undefined && explicitTotal === undefined) return undefined;
  return {
    ...(input === undefined ? {} : { input }),
    ...(output === undefined ? {} : { output }),
    ...(cached === undefined ? {} : { cached }),
    ...(explicitTotal === undefined && input === undefined && output === undefined ? {} : { total }),
  };
}

export function mapRunEventToObservation(event: Record<string, any>) {
  const type: ObservationType = event.eventType === "TOOL_CALLED" || event.eventType?.startsWith("COMMAND_")
    ? "TOOL"
    : event.eventType?.startsWith("VERIFICATION_")
      ? "EVALUATOR"
      : event.eventType === "STEP_STARTED" || event.eventType === "STEP_COMPLETED"
        ? "SPAN"
        : event.eventType?.includes("AGENT")
          ? "AGENT"
          : "EVENT";
  const failed = event.status === "FAILED" || event.eventType?.includes("FAILED") || Boolean(event.errorSummary);
  const running = event.status === "RUNNING" || event.eventType?.endsWith("STARTED");
  return {
    type,
    name: event.commandSummary || event.workflowStep || String(event.eventType ?? "Execution event"),
    status: failed ? "FAILED" as const : running ? "RUNNING" as const : "SUCCESS" as const,
    level: failed ? "ERROR" as const : event.eventType?.includes("RETRY") ? "WARNING" as const : "DEFAULT" as const,
    startedAt: event.startedAt,
    endedAt: event.endedAt,
    durationMs: event.durationMs,
    toolName: event.toolName,
    input: event.metadata?.toolArguments,
    output: event.metadata?.resultSummary,
    model: event.metadata?.model,
    provider: event.metadata?.provider,
    promptVersion: event.metadata?.promptVersion,
    tokenUsage: normalizeTokenUsage(event.metadata?.tokenUsage),
    estimatedCostUsd: finiteNonNegative(event.metadata?.estimatedCostUsd),
    error: failed
      ? { code: optionalString(event.errorCategory), message: optionalString(event.errorSummary) ?? "Execution step failed." }
      : undefined,
    metadata: event.metadata,
  };
}

export function aggregateTraceMetrics(traces: TraceMetricInput[]) {
  const completed = traces.filter((trace) => trace.status !== "RUNNING");
  const successful = traces.filter((trace) => trace.status === "SUCCESS").length;
  const durations = traces
    .map((trace) => trace.durationMs)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value))
    .sort((left, right) => left - right);
  const percentile = (p: number) => {
    if (!durations.length) return undefined;
    return durations[Math.min(durations.length - 1, Math.floor((durations.length - 1) * p))];
  };
  const costs = traces.map((trace) => trace.estimatedCostUsd).filter((value): value is number => typeof value === "number");
  const tokens = traces.map((trace) => trace.tokenUsage?.total).filter((value): value is number => typeof value === "number");
  const interventions = traces.reduce((sum, trace) => sum + (trace.humanInterventionCount ?? 0), 0);
  return {
    attempts: traces.length,
    completed: completed.length,
    successRate: completed.length ? successful / completed.length : undefined,
    medianDurationMs: percentile(0.5),
    p95DurationMs: percentile(0.95),
    averageCostUsd: costs.length ? costs.reduce((sum, value) => sum + value, 0) / costs.length : undefined,
    averageTokens: tokens.length ? tokens.reduce((sum, value) => sum + value, 0) / tokens.length : undefined,
    humanInterventionRate: traces.length ? traces.filter((trace) => (trace.humanInterventionCount ?? 0) > 0).length / traces.length : undefined,
    totalHumanInterventions: interventions,
  };
}

export function evaluateDurationThreshold(input: { durationMs?: number; thresholdMs: number }) {
  if (!Number.isFinite(input.thresholdMs) || input.thresholdMs <= 0) {
    throw new Error("Duration evaluator requires a positive finite threshold.");
  }
  const measured = input.durationMs;
  if (measured !== undefined && (!Number.isFinite(measured) || measured < 0)) {
    throw new Error("Duration evaluator requires a non-negative finite duration.");
  }
  const passed = typeof measured === "number" && measured <= input.thresholdMs;
  return {
    value: passed,
    reason: typeof measured !== "number"
      ? "Trace has not produced a terminal duration."
      : `Duration ${measured}ms ${passed ? "met" : "exceeded"} the ${input.thresholdMs}ms threshold.`,
  };
}

export function evaluateFixtureJudge(input: {
  rubric: string;
  rubricVersion: string;
  score: number;
  reason: string;
}) {
  if (!input.rubric.trim()) throw new Error("Fixture judge requires an explicit rubric.");
  if (!/^v\d+$/.test(input.rubricVersion)) throw new Error("Fixture judge requires a versioned rubric.");
  if (!Number.isFinite(input.score) || input.score < 0 || input.score > 1) {
    throw new Error("Fixture judge score must be between 0 and 1.");
  }
  if (!input.reason.trim()) throw new Error("Fixture judge requires an attributable reason.");
  return { value: input.score, reason: sanitizeString(input.reason), evaluatorVersion: input.rubricVersion };
}

export function compareExperimentVariants(variants: Array<{
  name: string;
  samples: Array<{ success: boolean; durationMs: number; costUsd: number; score: number }>;
}>) {
  if (variants.length !== 2) throw new Error("V1 experiments compare exactly two variants.");
  return variants.map((variant) => {
    const size = variant.samples.length;
    if (variant.samples.some((sample) =>
      !Number.isFinite(sample.durationMs) || sample.durationMs < 0
      || !Number.isFinite(sample.costUsd) || sample.costUsd < 0
      || !Number.isFinite(sample.score) || sample.score < 0 || sample.score > 1
    )) {
      throw new Error("Experiment samples require non-negative duration/cost and scores between 0 and 1.");
    }
    const average = (values: number[]) => size ? values.reduce((sum, value) => sum + value, 0) / size : undefined;
    return {
      name: variant.name,
      sampleSize: size,
      metrics: {
        successRate: size ? variant.samples.filter((sample) => sample.success).length / size : undefined,
        averageDurationMs: average(variant.samples.map((sample) => sample.durationMs)),
        averageCostUsd: average(variant.samples.map((sample) => sample.costUsd)),
        averageScore: average(variant.samples.map((sample) => sample.score)),
      },
    };
  });
}

export function finiteNonNegative(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;
}

export function optionalString(value: unknown, maxLength = 2_000): string | undefined {
  return typeof value === "string" && value.trim() ? sanitizeString(value.trim()).slice(0, maxLength) : undefined;
}
