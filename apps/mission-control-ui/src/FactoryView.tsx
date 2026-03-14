import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { PageHeader } from "./components/PageHeader";
import { Card } from "./components/ui/card";
import { Button } from "./components/ui/button";
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
    <main className="flex-1 overflow-auto bg-background">
      <PageHeader
        title="Factory"
        description="Batch and automated runs. Scheduled jobs that run without you."
        icon={<Factory className="h-4 w-4" />}
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
      <div className="p-6">
        {displayJobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center">
            <Factory className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-sm font-semibold text-foreground mb-1">No factory jobs</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Scheduled jobs (workflows, batch, mission prompts) will appear here. Add them from Schedules.
            </p>
            {onNavigate && (
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => onNavigate("schedules")}>
                  Go to Schedules
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onNavigate("radar")}>
                  Radar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onNavigate("system")}>
                  System
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {displayJobs.map((j) => (
              <Card key={j._id} className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-semibold text-foreground">{j.name}</div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Next: {formatNextRun(j.nextRun)}
                    </span>
                    {j.lastRun != null && (
                      <span>Last: {new Date(j.lastRun).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    )}
                  </div>
                </div>
                <div className="shrink-0">
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-medium uppercase",
                    j.enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    {j.enabled ? "Enabled" : "Paused"}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
