import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { PageHeader } from "./components/PageHeader";
import { Card } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { EmptyState } from "./components/ui/empty-state";
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
    <main className="mc-page">
      <PageHeader
        title="Factory"
        description="Batch and automated runs. Scheduled jobs that run without you."
        icon={<Factory className="h-4 w-4" />}
        status={
          <Badge variant="outline" className="border-cyan-300/20 text-cyan-100">
            {displayJobs.length} jobs
          </Badge>
        }
        actions={
          onNavigate && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => onNavigate("schedules")}>
                <Play className="h-3.5 w-3.5 mr-1.5" />
                All Schedules
              </Button>
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => onNavigate("radar")}>
                <Radar className="h-3.5 w-3.5 mr-1.5" />
                Radar
              </Button>
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => onNavigate("system")}>
                <Settings className="h-3.5 w-3.5 mr-1.5" />
                System
              </Button>
            </div>
          )
        }
      />
      <div className="mc-page-body mc-page-stack">
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4">
            <div className="mc-kicker">Factory jobs</div>
            <div className="mt-2 text-3xl font-semibold text-foreground">{displayJobs.length}</div>
            <div className="mt-1 text-xs text-muted-foreground">Automated or batched jobs visible in this workspace</div>
          </Card>
          <Card className="p-4">
            <div className="mc-kicker">Enabled</div>
            <div className="mt-2 text-3xl font-semibold text-cyan-100">{displayJobs.filter((job) => job.enabled).length}</div>
            <div className="mt-1 text-xs text-muted-foreground">Jobs currently allowed to run without intervention</div>
          </Card>
          <Card className="p-4">
            <div className="mc-kicker">Paused</div>
            <div className="mt-2 text-3xl font-semibold text-amber-100">{displayJobs.filter((job) => !job.enabled).length}</div>
            <div className="mt-1 text-xs text-muted-foreground">Jobs waiting on a restart or policy change</div>
          </Card>
          <Card className="p-4">
            <div className="mc-kicker">Mode</div>
            <div className="mt-2 text-3xl font-semibold text-foreground">{factoryJobs.length > 0 ? "Curated" : "All"}</div>
            <div className="mt-1 text-xs text-muted-foreground">Whether the view is scoped to factory-native job types</div>
          </Card>
        </div>

        {displayJobs.length === 0 ? (
          <Card className="p-5">
            <EmptyState
              icon={Factory}
              title="No factory jobs"
              description="Scheduled jobs, workflow batches, and automated mission prompts will appear here once they are configured."
              action={
                onNavigate ? (
                  <Button variant="neon-cyan" onClick={() => onNavigate("schedules")}>
                    Go to schedules
                  </Button>
                ) : undefined
              }
            />
          </Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-3">
              {displayJobs.map((job) => (
                <Card key={job._id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground">{job.name}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="outline" className={cn(job.enabled ? "border-cyan-300/20 text-cyan-100" : "border-[var(--panel-line)] text-muted-foreground")}>
                          {job.enabled ? "Enabled" : "Paused"}
                        </Badge>
                        {job.jobType ? (
                          <Badge variant="outline" className="border-[var(--panel-line)] text-muted-foreground">
                            {job.jobType}
                          </Badge>
                        ) : null}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
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
              <div className="mc-kicker">Operator guidance</div>
              <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted-foreground">
                <div className="rounded-xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-4 py-4">
                  Factory is for repeatable execution, not one-off intervention. If a job needs constant babysitting, it belongs back in system design.
                </div>
                <div className="rounded-xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-4 py-4">
                  Watch the next run and last run together. A healthy pipeline is predictable in both cadence and recovery.
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
