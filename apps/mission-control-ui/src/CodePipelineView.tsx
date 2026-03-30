import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { GitBranch, Clock, CheckCircle2, XCircle, Loader2, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/ui/status-dot";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "./components/PageHeader";

interface CodePipelineViewProps {
  projectId: Id<"projects"> | null;
  onTaskSelect?: (taskId: Id<"tasks">) => void;
}

export function CodePipelineView({ projectId, onTaskSelect }: CodePipelineViewProps) {
  const workflowRuns = useQuery(api.workflowRuns.list, projectId ? { projectId } : {});
  const tasks = useQuery(api.tasks.listAll, projectId ? { projectId } : {});

  const isLoading = !workflowRuns || !tasks;

  if (isLoading) {
    return (
      <main className="mc-page">
        <div className="mc-page-body space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} lines={3} />
          ))}
        </div>
      </main>
    );
  }

  // Derive pipeline runs from tasks with workflow associations
  const activeTasks = tasks.filter((t) =>
    ["IN_PROGRESS", "REVIEW", "NEEDS_APPROVAL"].includes(t.status)
  );
  const runningWorkflowRuns = workflowRuns.filter((run) => run.status === "RUNNING").length;
  const recentCompleted = tasks
    .filter((t) => t.status === "DONE")
    .sort((a, b) => b._creationTime - a._creationTime)
    .slice(0, 10);

  const statusIcon = (status: string) => {
    switch (status) {
      case "IN_PROGRESS":
        return <Loader2 className="h-3.5 w-3.5 text-amber-400 animate-spin" />;
      case "REVIEW":
        return <Clock className="h-3.5 w-3.5 text-blue-400" />;
      case "DONE":
        return <CheckCircle2 className="h-3.5 w-3.5 text-primary" />;
      case "CANCELED":
        return <XCircle className="h-3.5 w-3.5 text-zinc-500" />;
      default:
        return <Activity className="h-3.5 w-3.5 text-blue-400" />;
    }
  };

  return (
    <main className="mc-page">
      <PageHeader
        title="Code Pipeline"
        description="Workflow runs, execution requests, and active code delivery lanes."
        icon={<GitBranch className="h-4.5 w-4.5" strokeWidth={1.7} />}
        eyebrow="Code"
        status={
          <Badge variant="outline" className="border-cyan-300/20 text-cyan-100">
            {activeTasks.length} active
          </Badge>
        }
      />
      <div className="mc-page-body mc-page-stack">
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4">
            <div className="mc-kicker">Active runs</div>
            <div className="mt-2 text-3xl font-semibold text-foreground">{activeTasks.length}</div>
            <div className="mt-1 text-xs text-muted-foreground">Tasks currently pushing code execution forward</div>
          </Card>
          <Card className="p-4">
            <div className="mc-kicker">Workflow runs</div>
            <div className="mt-2 text-3xl font-semibold text-cyan-100">{workflowRuns.length}</div>
            <div className="mt-1 text-xs text-muted-foreground">Recorded pipeline runs associated with this project</div>
          </Card>
          <Card className="p-4">
            <div className="mc-kicker">Running now</div>
            <div className="mt-2 text-3xl font-semibold text-amber-100">{runningWorkflowRuns}</div>
            <div className="mt-1 text-xs text-muted-foreground">Workflow runs still executing in the background</div>
          </Card>
          <Card className="p-4">
            <div className="mc-kicker">Recently done</div>
            <div className="mt-2 text-3xl font-semibold text-emerald-100">{recentCompleted.length}</div>
            <div className="mt-1 text-xs text-muted-foreground">Recently completed tasks available for review</div>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Active Runs */}
        <Card className="p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-amber-400 status-dot-pulse" />
            Active Runs
          </h2>

          {activeTasks.length === 0 ? (
            <Card className="p-6">
              <EmptyState
                icon={Activity}
                title="No active runs"
                description="All pipelines are idle. Create a workflow to get started."
                className="py-8"
              />
            </Card>
          ) : (
            <div className="space-y-2">
              {activeTasks.map((task, idx) => (
                <Card
                  key={task._id}
                  className="p-4 cursor-pointer"
                  onClick={() => onTaskSelect?.(task._id)}
                >
                  <div className="flex items-center gap-3">
                    {statusIcon(task.status)}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground/90 truncate">
                        {task.title}
                      </p>
                      <p className="text-[0.65rem] text-muted-foreground/60 mt-0.5">
                        {task.type} &middot; P{task.priority} &middot; ${task.actualCost.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusDot
                        variant={task.status === "IN_PROGRESS" ? "active" : "warning"}
                        size="sm"
                      />
                      <span className="text-[0.65rem] text-muted-foreground/60 uppercase tracking-wider">
                        {task.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>

        <div className="space-y-4">
          {workflowRuns && workflowRuns.length > 0 && (
            <Card className="p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Workflow Runs
              </h2>
              <div className="space-y-2">
                {workflowRuns.slice(0, 8).map((run) => (
                  <Card key={run._id} className="p-4">
                    <div className="flex items-center gap-3">
                      <GitBranch className="h-3.5 w-3.5 text-primary/60" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-foreground/90">
                          Workflow Run #{run._id.slice(-6)}
                        </p>
                        <p className="text-[0.65rem] text-muted-foreground/60 mt-0.5">
                          {run.status} &middot;{" "}
                          {new Date(run._creationTime).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <StatusDot
                        variant={
                          run.status === "RUNNING"
                            ? "active"
                            : run.status === "COMPLETED"
                              ? "healthy"
                              : run.status === "FAILED"
                                ? "error"
                                : "offline"
                        }
                        size="sm"
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-5">
            <div className="mc-kicker">Operator brief</div>
            <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>Use this page to track real execution lanes, not just completed work. The highest-signal items are active runs and failures that need rerouting.</p>
              <p>If a workflow run is healthy but the task is stuck, the problem is usually scope or approval friction rather than infrastructure.</p>
            </div>
          </Card>
        </div>
        </div>

        {/* Recent Completed */}
        <Card className="p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Recently Completed
          </h2>
          {recentCompleted.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground/40">
              No completed runs yet
            </div>
          ) : (
            <div className="space-y-2">
              {recentCompleted.map((task, idx) => (
                <Card
                  key={task._id}
                  className="p-3 cursor-pointer"
                  onClick={() => onTaskSelect?.(task._id)}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary/60" />
                    <p className="text-xs text-foreground/70 truncate flex-1">
                      {task.title}
                    </p>
                    <span className="text-[0.65rem] text-muted-foreground/40">
                      {new Date(task._creationTime).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
