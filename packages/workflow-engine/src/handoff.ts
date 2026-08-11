const MAX_STEP_OUTPUT_BYTES = 32 * 1024;
const MAX_RUN_CONTEXT_BYTES = 128 * 1024;

export function validateCompletionOutput(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false as const, error: "Structured step output must be an object." };
  }
  const status = (value as Record<string, unknown>).status;
  if (status !== "COMPLETED") {
    return { ok: false as const, error: "Structured step output status must be COMPLETED." };
  }
  return { ok: true as const };
}

export function buildBoundedContextUpdate(input: {
  existingContext: unknown;
  stepId: string;
  structuredOutput: unknown;
}) {
  const outputSize = byteLength(input.structuredOutput);
  if (outputSize > MAX_STEP_OUTPUT_BYTES) {
    return {
      ok: false as const,
      error: `Structured step output exceeds the ${MAX_STEP_OUTPUT_BYTES / 1024} KB context budget. Store large evidence as an artifact and return a compact handoff.`,
    };
  }
  const output = input.structuredOutput as Record<string, unknown>;
  const handoff = normalizeHandoff(output.handoff ?? output);
  const update = {
    [`${input.stepId}Output`]: input.structuredOutput,
    [`${input.stepId}Handoff`]: handoff,
  };
  const nextContext = { ...asRecord(input.existingContext), ...update };
  if (byteLength(nextContext) > MAX_RUN_CONTEXT_BYTES) {
    return {
      ok: false as const,
      error: `Workflow context exceeds the ${MAX_RUN_CONTEXT_BYTES / 1024} KB run budget. Replace prior detail with artifact references and compact handoffs.`,
    };
  }
  return { ok: true as const, update, handoff, outputSize, contextSize: byteLength(nextContext) };
}

function normalizeHandoff(value: unknown) {
  const source = asRecord(value);
  return {
    outcome: text(source.outcome) ?? text(source.status) ?? "COMPLETED",
    completedAssertionIds: strings(source.completedAssertionIds ?? source.completedAcceptanceCriterionIds),
    incompleteAssertionIds: strings(source.incompleteAssertionIds ?? source.incompleteAcceptanceCriterionIds),
    unknownAssertionIds: strings(source.unknownAssertionIds ?? source.unknownAcceptanceCriterionIds),
    artifactReferences: strings(source.artifactReferences),
    knownRisks: strings(source.knownRisks ?? source.risks),
    nextAction: text(source.nextAction) ?? "Continue to the next approved workflow step.",
    nextOwner: text(source.nextOwner),
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(0, 200) : [];
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 2_000) : undefined;
}

function byteLength(value: unknown) {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}
