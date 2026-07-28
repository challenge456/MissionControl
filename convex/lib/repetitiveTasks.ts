export interface RepetitiveTaskSource {
  workflowId?: string;
  repository?: string;
  state: string;
  hasReceipt: boolean;
}

export interface RepetitiveTaskCandidate {
  id: string;
  pattern: string;
  occurrences: number;
  completedCount: number;
  receiptCount: number;
  suggestion: string;
}

const TERMINAL_STATES = new Set(["DONE", "CANCELED", "SUPERSEDED"]);

function candidateKey(source: RepetitiveTaskSource): string | null {
  if (source.workflowId?.trim()) return `workflow:${source.workflowId.trim()}`;
  if (source.repository?.trim()) return `repository:${source.repository.trim()}`;
  return null;
}

function candidateLabel(key: string): string {
  const [kind, value] = key.split(":", 2);
  return kind === "workflow" ? `Workflow: ${value}` : `Repository work: ${value}`;
}

/**
 * Detect repeatable work from governed records only. A candidate needs at least
 * two Work Orders so a single incident can never be mistaken for a flywheel.
 */
export function detectRepetitiveTasks(
  sources: readonly RepetitiveTaskSource[]
): RepetitiveTaskCandidate[] {
  const groups = new Map<string, { occurrences: number; completedCount: number; receiptCount: number }>();

  for (const source of sources) {
    const key = candidateKey(source);
    if (!key) continue;
    const group = groups.get(key) ?? { occurrences: 0, completedCount: 0, receiptCount: 0 };
    group.occurrences += 1;
    if (TERMINAL_STATES.has(source.state)) group.completedCount += 1;
    if (source.hasReceipt) group.receiptCount += 1;
    groups.set(key, group);
  }

  return [...groups.entries()]
    .filter(([, group]) => group.occurrences >= 2)
    .map(([key, group]) => ({
      id: key,
      pattern: candidateLabel(key),
      ...group,
      suggestion:
        group.receiptCount > 0
          ? "Evidence is available. Review the workflow, then schedule a bounded automation."
          : "Capture a verification receipt before promoting this pattern to automation.",
    }))
    .sort((a, b) => b.occurrences - a.occurrences || b.receiptCount - a.receiptCount);
}
