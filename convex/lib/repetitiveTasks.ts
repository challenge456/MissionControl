export interface RepetitiveTaskSource {
  workOrderId?: string;
  workflowId?: string;
  repository?: string;
  state: string;
  hasReceipt?: boolean;
  eligibleReceiptCount?: number;
}

export interface RepetitiveTaskCandidate {
  id: string;
  pattern: string;
  occurrences: number;
  completedCount: number;
  receiptCount: number;
  workflowId?: string;
  repository?: string;
  supportingWorkOrderIds: string[];
  suggestedCadence: string;
  confidence: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  recommendedAutonomyLevel: "LEVEL_0" | "LEVEL_1";
  estimatedHumanMinutesSaved: number;
  suggestion: string;
}

export function isEligibleAutomationReceipt(
  receipt: { status: string; validUntil?: number; invalidatedAt?: number },
  now = Date.now()
): boolean {
  return receipt.status === "PASSED"
    && receipt.invalidatedAt == null
    && (!receipt.validUntil || receipt.validUntil > now);
}

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
  const groups = new Map<string, {
    occurrences: number;
    completedCount: number;
    receiptCount: number;
    supportingWorkOrderIds: string[];
  }>();

  for (const source of sources) {
    const key = candidateKey(source);
    if (!key) continue;
    const group = groups.get(key) ?? {
      occurrences: 0,
      completedCount: 0,
      receiptCount: 0,
      supportingWorkOrderIds: [],
    };
    group.occurrences += 1;
    if (source.state === "DONE") group.completedCount += 1;
    group.receiptCount += source.eligibleReceiptCount ?? (source.hasReceipt ? 1 : 0);
    if (source.workOrderId) group.supportingWorkOrderIds.push(source.workOrderId);
    groups.set(key, group);
  }

  return [...groups.entries()]
    .filter(([, group]) => group.completedCount >= 2)
    .map(([key, group]) => {
      const [kind, value] = key.split(":", 2);
      const evidenceRatio = Math.min(group.receiptCount / Math.max(group.completedCount, 1), 1);
      return {
        id: key,
        pattern: candidateLabel(key),
        ...group,
        workflowId: kind === "workflow" ? value : undefined,
        repository: kind === "repository" ? value : undefined,
        suggestedCadence: "0 8 * * 1",
        confidence: Math.round((0.55 + evidenceRatio * 0.4) * 100) / 100,
        riskLevel: "MEDIUM" as const,
        recommendedAutonomyLevel: group.receiptCount > 0 ? "LEVEL_1" as const : "LEVEL_0" as const,
        estimatedHumanMinutesSaved: group.completedCount * 30,
        suggestion:
          group.receiptCount > 0
            ? "Evidence is available. Review the workflow, then schedule a bounded automation."
            : "Capture a passing verification receipt before promoting this pattern to automation.",
      };
    })
    .sort((a, b) => b.occurrences - a.occurrences || b.receiptCount - a.receiptCount);
}
