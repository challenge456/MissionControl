import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";

interface MetricsViewProps {
  projectId: Id<"projects"> | null;
}

export function MetricsView({ projectId }: MetricsViewProps) {
  const [metricName, setMetricName] = useState("execution.duration_ms");
  const [value, setValue] = useState("123");

  const record = useMutation((api as any).metrics.record);
  const series = useQuery((api as any).metrics.queryRange, {
    projectId: projectId ?? undefined,
    metricName,
    limit: 100,
  });
  const aggregate = useQuery((api as any).metrics.aggregate, {
    projectId: projectId ?? undefined,
    metricName,
  });

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-6 py-6">
      <header>
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-ink">Metrics</h1>
        <p className="mt-1.5 text-[14px] text-ink-secondary">Capture time-series metrics and inspect aggregate stats for quality and execution observability.</p>
      </header>

      <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface-1 p-5">
        <div className="flex gap-2">
          <input
            className="h-9 flex-1 rounded-lg border border-line bg-surface-1 px-3 font-mono text-[12.5px] text-ink placeholder:text-ink-muted"
            value={metricName}
            onChange={(e) => setMetricName(e.target.value)}
          />
          <input
            className="h-9 w-36 rounded-lg border border-line bg-surface-1 px-3 font-mono text-[12.5px] text-ink placeholder:text-ink-muted"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <Button
            onClick={() =>
              record({
                projectId: projectId ?? undefined,
                metricName,
                metricType: "histogram",
                value: Number(value),
                labels: { source: "metrics-view" },
              })
            }
          >
            Record Metric
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface-1 p-5">
        <h2 className="text-[15px] font-semibold text-ink">Aggregate</h2>
        <div className="font-mono text-[12.5px] text-ink-secondary">
          count {aggregate?.count ?? 0} · min {aggregate?.min ?? 0} · avg {(aggregate?.avg ?? 0).toFixed?.(2) ?? 0} · p95 {aggregate?.p95 ?? 0} · p99 {aggregate?.p99 ?? 0}
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface-1 p-5">
        <h2 className="text-[15px] font-semibold text-ink">Recent Points</h2>
        <div className="flex flex-col">
          {(series ?? []).slice(0, 20).map((point: any) => (
            <div
              key={point._id}
              className="flex items-center justify-between border-b border-line py-1.5 font-mono text-[12px] text-ink-secondary last:border-b-0"
            >
              <span>{new Date(point.timestamp).toLocaleTimeString()}</span>
              <span>{point.metricName}</span>
              <span>{point.value}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
