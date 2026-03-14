import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { PageHeader } from "./components/PageHeader";
import { Card } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Radar, Calendar, AlertTriangle, ListTodo, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface RadarViewProps {
  projectId: Id<"projects"> | null;
  onNavigate?: (view: string) => void;
  onTaskSelect?: (taskId: Id<"tasks">) => void;
}

const NOW = Date.now();
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function RadarView({ projectId, onNavigate, onTaskSelect }: RadarViewProps) {
  const tasks = useQuery(api.tasks.listAll, projectId ? { projectId } : {});
  const jobs = useQuery(api.scheduledJobs.list, projectId ? { projectId } : {});
  const alerts = useQuery(api.alerts.listOpen, { limit: 20 });

  const tasksList = tasks ?? [];
  const jobsList = jobs ?? [];
  const alertsList = alerts ?? [];

  const tasksWithDue = tasksList.filter((t) => {
    const due = (t as { dueAt?: number }).dueAt;
    return due != null && due >= NOW && due <= NOW + SEVEN_DAYS_MS;
  });
  const sortedByDue = [...tasksWithDue].sort(
    (a, b) => ((a as { dueAt?: number }).dueAt ?? 0) - ((b as { dueAt?: number }).dueAt ?? 0)
  );

  const nextJobs = [...jobsList]
    .filter((j) => j.nextRun != null && j.nextRun >= NOW)
    .sort((a, b) => (a.nextRun ?? 0) - (b.nextRun ?? 0))
    .slice(0, 10);

  return (
    <main className="flex-1 overflow-auto bg-background">
      <PageHeader
        title="Radar"
        description="What's on the horizon. Upcoming deadlines, scheduled runs, and recent alerts."
        icon={<Radar className="h-4 w-4" />}
        actions={
          onNavigate && (
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => onNavigate("system")}>
              <Settings className="h-3.5 w-3.5 mr-1.5" />
              System
            </Button>
          )
        }
      />
      <div className="p-6 space-y-6">
        {/* Tasks due in next 7 days */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
            <ListTodo className="h-4 w-4 text-muted-foreground" />
            Due in next 7 days
          </h3>
          {sortedByDue.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No tasks with due dates in the next week.
              {onNavigate && (
                <>
                  {" "}
                  <button type="button" className="underline hover:text-foreground" onClick={() => onNavigate("tasks")}>View Tasks</button>
                  {" or "}
                  <button type="button" className="underline hover:text-foreground" onClick={() => onNavigate("system")}>System</button>.
                </>
              )}
            </p>
          ) : (
            <ul className="space-y-2">
              {sortedByDue.slice(0, 15).map((t) => {
                const dueAt = (t as { dueAt?: number }).dueAt;
                const dueStr = dueAt ? new Date(dueAt).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) : "—";
                return (
                  <li key={t._id}>
                    <button
                      type="button"
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                        "hover:bg-muted/50 border border-transparent hover:border-border"
                      )}
                      onClick={() => onTaskSelect?.(t._id)}
                    >
                      <span className="font-medium text-foreground">{t.title}</span>
                      <span className="text-muted-foreground ml-2">{dueStr}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {onNavigate && sortedByDue.length > 0 && (
            <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => onNavigate("calendar")}>
              View Calendar
            </Button>
          )}
        </Card>

        {/* Next scheduled job runs */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Next scheduled job runs
          </h3>
          {nextJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming job runs.</p>
          ) : (
            <ul className="space-y-2">
              {nextJobs.map((j) => (
                <li key={j._id} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                  <span className="font-medium text-foreground">{j.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {j.nextRun ? new Date(j.nextRun).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {onNavigate && (
            <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => onNavigate("schedules")}>
              View Schedules
            </Button>
          )}
        </Card>

        {/* Recent alerts */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            Recent alerts
          </h3>
          {alertsList.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent alerts.</p>
          ) : (
            <ul className="space-y-2">
              {alertsList.slice(0, 10).map((a) => (
                <li key={a._id} className="text-sm py-1.5 border-b border-border last:border-0">
                  <span className={cn(
                    "font-medium",
                    a.severity === "ERROR" || a.severity === "CRITICAL" ? "text-red-400" : "text-amber-500"
                  )}>
                    {a.severity}
                  </span>
                  <span className="text-muted-foreground ml-2">{a.title}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </main>
  );
}
