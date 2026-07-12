import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface ExecutionViewProps {
  projectId: Id<"projects"> | null;
}

export function ExecutionView({ projectId }: ExecutionViewProps) {
  const results = useQuery((api as any).execution.list, { projectId: projectId ?? undefined, limit: 50 });

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-6 py-6">
      <header>
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-ink">Execution Engine</h1>
        <p className="mt-1.5 text-[14px] text-ink-secondary">Unified run history for API/UI/Hybrid executions with step-level outcomes.</p>
      </header>

      <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface-1 p-5">
        <h2 className="text-[15px] font-semibold text-ink">Execution Results</h2>
        <div className="flex flex-col gap-2">
          {(results ?? []).map((row: any) => (
            <div
              key={row._id}
              className="rounded-lg border border-line px-3 py-2 transition-colors duration-150 hover:bg-surface-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[13px] font-medium text-ink">{row.resultId}</span>
                <span className="text-[12.5px] text-ink-muted">{row.executionType} · {row.success ? "success" : "failed"}</span>
              </div>
              <div className="text-[12.5px] text-ink-muted">
                passed {row.passed} · failed {row.failed} · total {row.totalTime}ms
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
