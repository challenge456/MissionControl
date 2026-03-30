/**
 * Air Traffic Control (ATC) board — real-time view of all agents:
 * status, current task, model, token/cost, last heartbeat. Idle agents highlighted.
 */

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Radio, User, ExternalLink } from "lucide-react";
import { PageHeader } from "./components/PageHeader";
import { usePrivacy } from "./contexts/PrivacyContext";
import { redact } from "@/lib/redact";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<string, string> = {
  INTERN: "Intern",
  SPECIALIST: "Specialist",
  LEAD: "Lead",
  CEO: "CEO",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  PAUSED: "Paused",
  DRAINED: "Drained",
  QUARANTINED: "Quarantined",
  OFFLINE: "Offline",
};

function formatTimeAgo(ts: number | undefined): string {
  if (ts == null) return "—";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

interface AtcBoardViewProps {
  projectId: Id<"projects"> | null;
  onNavigateToTask?: (taskId: Id<"tasks">) => void;
  onNavigateToAgent?: (agentId: Id<"agents">) => void;
  onNavigateToTasks?: () => void;
}

export function AtcBoardView({
  projectId,
  onNavigateToTask,
  onNavigateToAgent,
  onNavigateToTasks,
}: AtcBoardViewProps) {
  const { privacyMode } = usePrivacy();
  const agents = useQuery(api.agents.listAll, projectId ? { projectId } : {});
  const tasks = useQuery(api.tasks.listAll, projectId ? { projectId } : {});
  const runs = useQuery(api.runs.listRecent, projectId ? { projectId, limit: 500 } : { limit: 500 });

  if (agents === undefined || tasks === undefined || runs === undefined) {
    return (
      <main className="flex-1 overflow-auto p-6">
        <PageHeader title="Air Traffic Control" />
        <p className="text-muted-foreground text-sm">Loading…</p>
      </main>
    );
  }

  const activeTaskStatuses = new Set(["ASSIGNED", "IN_PROGRESS", "REVIEW"]);
  const busyAgentIds = new Set(
    tasks
      .filter((t) => activeTaskStatuses.has(t.status))
      .flatMap((t) => t.assigneeIds)
  );

  const agentRows = agents.map((agent) => {
    const currentTask = tasks.find(
      (t) =>
        t.assigneeIds.includes(agent._id) &&
        activeTaskStatuses.has(t.status)
    );
    const agentRuns = runs.filter((r) => r.agentId === agent._id);
    const sessionCost = agentRuns.reduce((sum, r) => sum + r.costUsd, 0);
    const sessionTokens =
      agentRuns.reduce((sum, r) => sum + (r.inputTokens ?? 0) + (r.outputTokens ?? 0), 0);
    const isIdle = agent.status === "ACTIVE" && !currentTask;

    return {
      agent,
      currentTask,
      sessionCost,
      sessionTokens,
      isIdle,
    };
  });

  const idleCount = agentRows.filter((r) => r.isIdle).length;
  const busyCount = agents.length - idleCount;

  return (
    <main className="flex-1 overflow-auto p-6">
      <PageHeader
        title="Air Traffic Control"
        description="Real-time agent status. Idle agents are highlighted — assign work from Tasks."
      />

      {/* Command bar */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Radio className="h-4 w-4 text-primary" />
            {idleCount === 0
              ? "All agents busy"
              : `${idleCount} agent${idleCount === 1 ? "" : "s"} idle`}
          </span>
          {idleCount > 0 && (
            <Button size="sm" variant="outline" onClick={onNavigateToTasks}>
              Assign idle agents
            </Button>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {agents.length} total · {busyCount} busy
        </span>
      </div>

      {/* Agent grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {agentRows.map(({ agent, currentTask, sessionCost, sessionTokens, isIdle }) => (
          <Card
            key={agent._id}
            className={cn(
              "p-4 flex flex-col gap-3 transition-all",
              isIdle && "ring-2 ring-amber-500/50 border-amber-500/30"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground truncate flex items-center gap-2">
                  <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  {redact(agent.name, privacyMode)}
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  <Badge variant="secondary" className="text-[11px] font-normal">
                    {ROLE_LABELS[agent.role] ?? agent.role}
                  </Badge>
                  <Badge
                    variant={agent.status === "ACTIVE" ? "default" : "outline"}
                    className={cn(
                      "text-[11px] font-normal",
                      agent.status === "QUARANTINED" && "border-red-500/50 text-red-400",
                      agent.status === "PAUSED" && "border-amber-500/50 text-amber-400"
                    )}
                  >
                    {STATUS_LABELS[agent.status] ?? agent.status}
                  </Badge>
                </div>
              </div>
              {isIdle && (
                <span className="shrink-0 text-[11px] font-medium text-amber-500 uppercase tracking-wider">
                  Idle
                </span>
              )}
            </div>

            {currentTask ? (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Current task</p>
                <p className="text-sm font-medium text-foreground truncate" title={currentTask.title}>
                  {redact(currentTask.title, privacyMode)}
                </p>
                <Badge variant="outline" className="text-[11px] font-normal">
                  {currentTask.status}
                </Badge>
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs"
                    onClick={() => onNavigateToTask?.(currentTask._id)}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground py-1">No active task</div>
            )}

            <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground border-t border-border pt-2 mt-auto">
              <span title="Cost this session">${sessionCost.toFixed(3)}</span>
              <span title="Tokens this session">{sessionTokens.toLocaleString()} tok</span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span title="Last heartbeat">♥ {formatTimeAgo(agent.lastHeartbeatAt)}</span>
              <Button
                size="sm"
                variant="ghost"
                className="h-5 text-xs"
                onClick={() => onNavigateToAgent?.(agent._id)}
              >
                Details
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {agents.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">
          No agents in this project. Register agents to see them here.
        </Card>
      )}
    </main>
  );
}
