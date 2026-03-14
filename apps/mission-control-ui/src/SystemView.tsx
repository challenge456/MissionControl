import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { PageHeader } from "./components/PageHeader";
import { Card } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { StatusDot } from "./components/ui/status-dot";
import { cn } from "@/lib/utils";
import { Settings, Activity, ExternalLink, Clock, Radar, Factory, MessageSquare } from "lucide-react";

/** Static list of Convex crons (from crons.ts) for read-only display */
const CONVEX_CRONS = [
  { name: "expire stale approvals", interval: "Every 15 min" },
  { name: "escalate overdue approvals", interval: "Every 10 min" },
  { name: "detect loops", interval: "Every 15 min" },
  { name: "daily standup report", interval: "Daily 09:00 UTC" },
  { name: "daily CEO brief", interval: "Daily 09:00 UTC" },
  { name: "detect stale heartbeats", interval: "Every 2 min" },
  { name: "auto-route execution requests", interval: "Every 5 min" },
];

interface SystemViewProps {
  projectId: Id<"projects"> | null;
  onNavigate?: (view: string) => void;
  onOpenHealthDashboard?: () => void;
  onOpenMonitoringDashboard?: () => void;
}

export function SystemView({
  projectId,
  onNavigate,
  onOpenHealthDashboard,
  onOpenMonitoringDashboard,
}: SystemViewProps) {
  const agents = useQuery(api.agents.listAll, projectId ? { projectId } : {});
  const tasks = useQuery(api.tasks.listAll, projectId ? { projectId } : {});
  const approvals = useQuery(
    api.approvals.listPending,
    projectId ? { projectId, limit: 50 } : { limit: 50 }
  );
  const scheduledJobs = useQuery(api.scheduledJobs.list, projectId ? { projectId } : {});
  const openAlerts = useQuery(api.alerts.listOpen, { limit: 20 });

  const agentsList = agents ?? [];
  const tasksList = tasks ?? [];
  const approvalsList = approvals ?? [];
  const jobsList = scheduledJobs ?? [];
  const alertsList = openAlerts ?? [];

  const quarantinedCount = agentsList.filter((a) => a.status === "QUARANTINED").length;
  const failedCount = tasksList.filter((t) => t.status === "FAILED").length;
  const blockedCount = tasksList.filter((t) => t.status === "BLOCKED").length;
  const pendingApprovals = approvalsList.length;

  const issues = [
    quarantinedCount > 0 && { label: `${quarantinedCount} quarantined`, variant: "error" as const },
    failedCount > 0 && { label: `${failedCount} failed`, variant: "error" as const },
    blockedCount > 0 && { label: `${blockedCount} blocked`, variant: "warning" as const },
    pendingApprovals > 0 && { label: `${pendingApprovals} pending approvals`, variant: "warning" as const },
  ].filter(Boolean) as { label: string; variant: "error" | "warning" }[];

  const isHealthy = issues.length === 0;

  return (
    <main className="flex-1 overflow-auto bg-background">
      <PageHeader
        title="System"
        description="System health, gateway status, and scheduled crons. One place for platform status."
        icon={<Settings className="h-4 w-4" />}
        actions={
          <div className="flex gap-2">
            {onOpenHealthDashboard && (
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onOpenHealthDashboard}>
                <Activity className="h-3.5 w-3.5 mr-1.5" />
                Health
              </Button>
            )}
            {onOpenMonitoringDashboard && (
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onOpenMonitoringDashboard}>
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Monitor
              </Button>
            )}
          </div>
        }
      />
      <div className="p-6 space-y-6">
        {/* Live operations summary */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Live summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="rounded-lg bg-muted/30 border border-border/50 px-3 py-2">
              <span className="text-muted-foreground block">Scheduled jobs</span>
              <span className="font-semibold tabular-nums text-foreground">{jobsList.length}</span>
            </div>
            <div className="rounded-lg bg-muted/30 border border-border/50 px-3 py-2">
              <span className="text-muted-foreground block">Open alerts</span>
              <span className={cn("font-semibold tabular-nums", alertsList.length > 0 ? "text-amber-500" : "text-foreground")}>
                {alertsList.length}
              </span>
            </div>
            <div className="rounded-lg bg-muted/30 border border-border/50 px-3 py-2">
              <span className="text-muted-foreground block">Active agents</span>
              <span className="font-semibold tabular-nums text-foreground">
                {agentsList.filter((a) => a.status === "ACTIVE").length}
              </span>
            </div>
            <div className="rounded-lg bg-muted/30 border border-border/50 px-3 py-2">
              <span className="text-muted-foreground block">Tasks in progress</span>
              <span className="font-semibold tabular-nums text-foreground">
                {tasksList.filter((t) => t.status === "IN_PROGRESS").length}
              </span>
            </div>
          </div>
          {onNavigate && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border">
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onNavigate("radar")}>
                <Radar className="h-3 w-3 mr-1.5" />
                Radar
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onNavigate("factory")}>
                <Factory className="h-3 w-3 mr-1.5" />
                Factory
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onNavigate("feedback")}>
                <MessageSquare className="h-3 w-3 mr-1.5" />
                Feedback
              </Button>
            </div>
          )}
        </Card>

        {/* Status bar */}
        <div
          className={cn(
            "flex items-center gap-3 px-4 py-2.5 rounded-lg border text-xs",
            isHealthy
              ? "bg-primary/5 border-primary/20"
              : issues.some((i) => i.variant === "error")
                ? "bg-red-500/5 border-red-500/20"
                : "bg-amber-500/5 border-amber-500/20"
          )}
        >
          <StatusDot
            variant={isHealthy ? "active" : issues.some((i) => i.variant === "error") ? "error" : "warning"}
            pulse
            size="sm"
          />
          <span
            className={cn(
              "font-semibold",
              isHealthy ? "text-primary" : issues.some((i) => i.variant === "error") ? "text-red-400" : "text-amber-500"
            )}
          >
            {isHealthy ? "All Systems Operational" : "Attention Required"}
          </span>
          {issues.length > 0 && (
            <>
              <span className="text-muted-foreground">·</span>
              <div className="flex items-center gap-2 flex-wrap">
                {issues.map((issue, i) => (
                  <span
                    key={i}
                    className={cn(
                      "px-2 py-0.5 rounded-full border text-[0.6rem] font-medium uppercase tracking-wider",
                      issue.variant === "error"
                        ? "bg-red-500/10 border-red-500/20 text-red-400"
                        : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                    )}
                  >
                    {issue.label}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Convex crons (read-only) */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Convex Cron Jobs
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Background jobs defined in crons.ts. Read-only; edit in code.
          </p>
          <ul className="space-y-2">
            {CONVEX_CRONS.map((cron, i) => (
              <li key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                <span className="font-mono text-foreground">{cron.name}</span>
                <span className="text-muted-foreground text-xs">{cron.interval}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </main>
  );
}
