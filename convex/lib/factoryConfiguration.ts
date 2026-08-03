export interface FactoryConfigurationInput {
  repositoryId: string;
  workflowId: string;
  executor: { adapter: string; version: string };
  policyEnvelopeId?: string;
  environmentId?: string;
  budget: { maxCostUsd: number; maxRuntimeMinutes: number; maxAttempts: number };
  verifierIds: string[];
  riskBoundary: "GREEN" | "YELLOW" | "RED";
  recovery: { pause: boolean; cancel: boolean; retry: boolean; resume: boolean };
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, stable(item)])
    );
  }
  return value;
}

export function factoryConfigurationDigest(input: FactoryConfigurationInput): string {
  const serialized = JSON.stringify(stable({
    ...input,
    verifierIds: [...input.verifierIds].sort(),
  }));
  let hash = 0x811c9dc5;
  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= serialized.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `factory-v1-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function validFactoryBudget(input: FactoryConfigurationInput["budget"]): boolean {
  return input.maxCostUsd > 0 && input.maxCostUsd <= 1_000 &&
    input.maxRuntimeMinutes > 0 && input.maxRuntimeMinutes <= 480 &&
    Number.isInteger(input.maxAttempts) && input.maxAttempts > 0 && input.maxAttempts <= 3;
}
