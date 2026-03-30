import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AgentDashboardProps {
  projectId: Id<"projects"> | null;
  onClose: () => void;
  onSelectAgent?: (agentId: Id<"agents">) => void;
}

const statusClassMap: Record<string, string> = {
  ACTIVE: "bg-primary/15 text-primary",
  PAUSED: "bg-yellow-500/15 text-yellow-500",
  OFFLINE: "bg-slate-500/15 text-muted-foreground",
  DRAINED: "bg-slate-500/15 text-muted-foreground",
  QUARANTINED: "bg-red-500/15 text-red-500",
};

const roleClassMap: Record<string, string> = {
  INTERN: "bg-blue-500/15 text-blue-500",
  SPECIALIST: "bg-blue-500/15 text-blue-400",
  LEAD: "bg-orange-500/15 text-orange-500",
};

export function AgentDashboard({ projectId, onClose, onSelectAgent }: AgentDashboardProps) {
  const agents = useQuery(
    api.agents.listAll,
    projectId ? { projectId } : {}
  );

  const tasks = useQuery(
    api.tasks.listAll,
    projectId ? { projectId } : {}
  );

  const runs = useQuery(
    api.runs.listRecent,
    projectId ? { projectId, limit: 1000 } : { limit: 1000 }
  );

  if (!agents || !tasks || !runs) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
        <div className="bg-card rounded-lg p-6">
          <div className="w-8 h-8 rounded-full border-2 border-border border-t-primary animate-spin" />
        </div>
      </div>
    );
  }

  const agentMetrics = agents.map((agent) => {
    const agentTasks = tasks.filter((t) => t.assigneeIds.includes(agent._id));
    const agentRuns = runs.filter((r) => r.agentId === agent._id);

    const completedTasks = agentTasks.filter((t) => t.status === "DONE").length;
    const inProgressTasks = agentTasks.filter((t) => t.status === "IN_PROGRESS").length;
    const totalCost = agentRuns.reduce((sum, r) => sum + r.costUsd, 0);
    const avgCostPerRun = agentRuns.length > 0 ? totalCost / agentRuns.length : 0;
    const successRate = agentRuns.length > 0
      ? (agentRuns.filter((r) => r.status === "COMPLETED").length / agentRuns.length) * 100
      : 0;

    return {
      agent,
      completedTasks,
      inProgressTasks,
      totalTasks: agentTasks.length,
      totalRuns: agentRuns.length,
      totalCost,
      avgCostPerRun,
      successRate,
      spendToday: agent.spendToday,
      budgetDaily: agent.budgetDaily,
      budgetRemaining: agent.budgetDaily - agent.spendToday,
      utilization: agent.budgetDaily > 0 ? (agent.spendToday / agent.budgetDaily) * 100 : 0,
    };
  });

  agentMetrics.sort((a, b) => b.totalCost - a.totalCost);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-card rounded-lg shadow-2xl max-w-[80rem] w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground m-0">Agent Performance Dashboard</h2>
              <p className="text-sm text-muted-foreground mt-1 mb-0">
                {agents.length} agents · {runs.length} runs · ${agentMetrics.reduce((sum, m) => sum + m.totalCost, 0).toFixed(2)} total cost
              </p>
            </div>
            <button onClick={onClose} className="bg-transparent border-none text-muted-foreground hover:text-foreground cursor-pointer p-1" aria-label="Close agent dashboard">
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4">
            {agentMetrics.map(({ agent, ...metrics }) => (
              <TooltipProvider key={agent._id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      role={onSelectAgent ? "button" : undefined}
                      tabIndex={onSelectAgent ? 0 : undefined}
                      onClick={onSelectAgent ? () => onSelectAgent(agent._id) : undefined}
                      onKeyDown={
                        onSelectAgent
                          ? (e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                onSelectAgent(agent._id);
                              }
                            }
                          : undefined}
                      className={cn(
                        "bg-background rounded-lg p-4 border border-border",
                        onSelectAgent && "cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                      )}
                      aria-label={onSelectAgent ? `Agent ${agent.name}. Click to open details.` : undefined}
                    >
                      {/* Agent Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{agent.emoji || "🤖"}</span>
                          <div>
                            <h3 className="font-semibold text-foreground m-0 text-base" title={agent._id}>
                              {agent.name}
                            </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", roleClassMap[agent.role])}>
                          {agent.role}
                        </span>
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusClassMap[agent.status])}>
                          {agent.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Tasks</div>
                    <div className="text-lg font-semibold text-foreground">
                      {metrics.completedTasks}/{metrics.totalTasks}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {metrics.inProgressTasks} in progress
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Runs</div>
                    <div className="text-lg font-semibold text-foreground">{metrics.totalRuns}</div>
                    <div className="text-xs text-muted-foreground">
                      {(metrics.successRate != null && !Number.isNaN(metrics.successRate)
                        ? metrics.successRate.toFixed(0)
                        : "—")}% success
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Total Cost</div>
                    <div className="text-lg font-semibold text-foreground">
                      ${metrics.totalCost.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ${metrics.avgCostPerRun.toFixed(3)}/run
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Today&apos;s Spend</div>
                    <div className="text-lg font-semibold text-foreground">
                      ${metrics.spendToday.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ${metrics.budgetRemaining.toFixed(2)} left
                    </div>
                  </div>
                </div>

                {/* Budget Bar */}
                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Budget Utilization</span>
                    <span>
                      {(metrics.utilization != null && !Number.isNaN(metrics.utilization)
                        ? metrics.utilization.toFixed(0)
                        : "—")}%
                    </span>
                  </div>
                  <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                    <div
                      className={cn(
                        "h-2 rounded-full transition-[width] duration-300",
                        (metrics.utilization ?? 0) >= 90
                          ? "bg-red-500"
                          : (metrics.utilization ?? 0) >= 70
                            ? "bg-yellow-500"
                            : "bg-primary"
                      )}
                      style={{ width: `${Math.min(metrics.utilization ?? 0, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                    <span>${metrics.spendToday.toFixed(2)}</span>
                    <span>${metrics.budgetDaily.toFixed(2)}</span>
                  </div>
                </div>

                {/* Task Types */}
                {agent.allowedTaskTypes && agent.allowedTaskTypes.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="text-xs text-muted-foreground mb-0.5">Allowed Task Types</div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {agent.allowedTaskTypes.map((type) => (
                        <span key={type} className="text-xs px-2 py-0.5 bg-secondary text-muted-foreground rounded-md">
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[280px]">
                    <div className="font-medium">{agent.name}</div>
                    <div className="text-[0.65rem] text-muted-foreground break-all">{agent._id}</div>
                    {onSelectAgent && <div className="text-[0.65rem] mt-0.5">Click to open agent details</div>}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
