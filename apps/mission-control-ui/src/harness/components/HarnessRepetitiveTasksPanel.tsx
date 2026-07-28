import { useQuery } from "convex/react";
import { FileSearch, ReceiptText } from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

export function HarnessRepetitiveTasksPanel({
  projectId,
}: {
  projectId?: Id<"projects"> | null;
}): JSX.Element {
  const candidates = useQuery(api.factory.repetitiveTasks.listCandidates, {
    projectId: projectId ?? undefined,
    limit: 8,
  });

  return (
    <section className="registry-eval-card space-y-4">
      <div className="flex items-start gap-3">
        <FileSearch className="mt-0.5 h-5 w-5 shrink-0 text-registry-accent" aria-hidden />
        <div>
          <h3 className="text-[15px] font-semibold text-ink">Repetitive task detector</h3>
          <p className="mt-0.5 text-[13px] text-ink-secondary">
            Repeated Work Orders grouped by workflow, with verification receipts as the promotion evidence.
          </p>
        </div>
      </div>
      {!candidates ? (
        <p className="text-[13px] text-ink-muted">Scanning governed work…</p>
      ) : candidates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-surface-2 p-4 text-[13px] text-ink-secondary">
          No repeatable work yet. A candidate appears after two comparable Work Orders share a workflow or repository.
        </div>
      ) : (
        <ul className="space-y-2">
          {candidates.map((candidate) => (
          <li key={candidate.id} className="rounded-xl border border-line bg-surface-2 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium text-ink">{candidate.pattern}</span>
              <span className="registry-delta">{candidate.occurrences}× Work Orders</span>
            </div>
            <p className="mt-1 text-[12.5px] text-ink-secondary">{candidate.suggestion}</p>
            <div className="mt-2 flex items-center gap-3 text-[12px] text-ink-muted">
              <span>{candidate.completedCount} completed</span>
              <span className="flex items-center gap-1">
                <ReceiptText className="h-3.5 w-3.5" aria-hidden />
                {candidate.receiptCount}/{candidate.occurrences} with receipts
              </span>
            </div>
          </li>
          ))}
        </ul>
      )}
    </section>
  );
}
