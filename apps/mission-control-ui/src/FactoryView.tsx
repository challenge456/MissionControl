import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Card } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { EmptyState } from "./components/ui/empty-state";
import { StatusBadge } from "@/components/factory/badges";
import { Factory, Play, Clock, Radar, Settings } from "lucide-react";

interface FactoryViewProps {
  projectId: Id<"projects"> | null;
  onNavigate?: (view: string) => void;
}

export function FactoryView({ projectId, onNavigate }: FactoryViewProps) {
  const jobs = useQuery(api.scheduledJobs.list, projectId ? { projectId } : {});

  const jobsList = jobs ?? [];
  const factoryTypes = ["workflow", "hybrid", "mission_prompt", "test_suite", "qc_run"];
  const factoryJobs = jobsList.filter((j) => factoryTypes.includes(j.jobType ?? ""));
  const displayJobs = factoryJobs.length > 0 ? factoryJobs : jobsList;

  function formatNextRun(ts: number | undefined): string {
    if (!ts) return "—";
    const now = Date.now();
    if (ts <= now) return "Due now";
    const mins = Math.round((ts - now) / 60_000);
    if (mins < 60) return `in ${mins}m`;
    const hours = Math.round((ts - now) / 3_600_000);
    if (hours < 24) return `in ${hours}h`;
    return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-6 py-6">
      <header className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-ink">Factory</h1>
            <StatusBadge tone="neutral">{displayJobs.length} jobs</StatusBadge>
          </div>
          <p className="mt-1.5 text-[14px] text-ink-secondary">
            Batch and automated runs. Scheduled jobs that run without you.
          </p>
        </div>
        {onNavigate && (
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="sm" className="h-8 text-[12.5px]" onClick={() => onNavigate("schedules")}>
              <Play className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.75} />
              All Schedules
            </Button>
            <Button variant="ghost" size="sm" className="h-8 text-[12.5px]" onClick={() => onNavigate("radar")}>
              <Radar className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.75} />
              Radar
            </Button>
            <Button variant="ghost" size="sm" className="h-8 text-[12.5px]" onClick={() => onNavigate("system")}>
              <Settings className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.75} />
              System
            </Button>
          </div>
        )}
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-[12.5px] font-medium text-ink-secondary">Factory jobs</div>
          <div className="mt-2 font-mono text-[26px] font-semibold leading-none text-ink">{displayJobs.length}</div>
          <div className="mt-1.5 text-[12px] text-ink-muted">Automated or batched jobs visible in this workspace</div>
        </Card>
        <Card className="p-4">
          <div className="text-[12.5px] font-medium text-ink-secondary">Enabled</div>
          <div className="mt-2 font-mono text-[26px] font-semibold leading-none text-ink">{displayJobs.filter((job) => job.enabled).length}</div>
          <div className="mt-1.5 text-[12px] text-ink-muted">Jobs currently allowed to run without intervention</div>
        </Card>
        <Card className="p-4">
          <div className="text-[12.5px] font-medium text-ink-secondary">Paused</div>
          <div className="mt-2 font-mono text-[26px] font-semibold leading-none text-ink">{displayJobs.filter((job) => !job.enabled).length}</div>
          <div className="mt-1.5 text-[12px] text-ink-muted">Jobs waiting on a restart or policy change</div>
        </Card>
        <Card className="p-4">
          <div className="text-[12.5px] font-medium text-ink-secondary">Mode</div>
          <div className="mt-2 text-[26px] font-semibold leading-none text-ink">{factoryJobs.length > 0 ? "Curated" : "All"}</div>
          <div className="mt-1.5 text-[12px] text-ink-muted">Whether the view is scoped to factory-native job types</div>
        </Card>
      </div>

      {displayJobs.length === 0 ? (
        <EmptyState
          icon={Factory}
          title="No factory jobs"
          description="Scheduled jobs, workflow batches, and automated mission prompts will appear here once they are configured."
          action={
            onNavigate ? (
              <Button onClick={() => onNavigate("schedules")}>
                Go to schedules
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-3">
            {displayJobs.map((job) => (
              <Card key={job._id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-semibold text-ink">{job.name}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <StatusBadge tone={job.enabled ? "success" : "neutral"}>
                        {job.enabled ? "Enabled" : "Paused"}
                      </StatusBadge>
                      {job.jobType ? (
                        <StatusBadge tone="neutral">{job.jobType}</StatusBadge>
                      ) : null}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-4 text-[12px] text-ink-muted">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" strokeWidth={1.75} />
                        Next: {formatNextRun(job.nextRun)}
                      </span>
                      {job.lastRun != null && (
                        <span>
                          Last: {new Date(job.lastRun).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-5">
            <div className="text-[15px] font-semibold text-ink">Operator guidance</div>
            <div className="mt-2 space-y-3 text-[13px] leading-relaxed text-ink-secondary">
              <div className="rounded-lg bg-surface-2 px-4 py-3">
                Factory is for repeatable execution, not one-off intervention. If a job needs constant babysitting, it belongs back in system design.
              </div>
              <div className="rounded-lg bg-surface-2 px-4 py-3">
                Watch the next run and last run together. A healthy pipeline is predictable in both cadence and recovery.
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
