import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { MainView } from "./TopNav";
import { PageHeader } from "./components/PageHeader";
import { Card } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Calendar, Clock, ListTodo } from "lucide-react";

/** Static list derived from convex/crons.ts for read-only display */
const CONVEX_CRONS = [
  { name: "expire stale approvals", interval: "Every 15 min" },
  { name: "escalate overdue approvals", interval: "Every 10 min" },
  { name: "detect loops", interval: "Every 15 min" },
  { name: "daily standup report", interval: "Daily 09:00 UTC" },
  { name: "daily CEO brief", interval: "Daily 09:00 UTC" },
  { name: "detect stale heartbeats", interval: "Every 2 min" },
  { name: "auto-route executions", interval: "Every 5 min" },
  { name: "guard ARM migration health", interval: "Every 30 min" },
  { name: "execute scheduled jobs", interval: "Every 1 min" },
  { name: "evaluate alert rules", interval: "Every 1 hour" },
];

const NOW = Date.now();
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

interface ScheduleViewProps {
  projectId: Id<"projects"> | null;
  onNavigate?: (view: MainView) => void;
  onTaskSelect?: (taskId: Id<"tasks">) => void;
}

export function ScheduleView({ projectId, onNavigate, onTaskSelect }: ScheduleViewProps) {
  const tasks = useQuery(api.tasks.listAll, projectId ? { projectId } : {});
  const jobs = useQuery(api.scheduledJobs.list, projectId ? { projectId } : {});

  const tasksList = tasks ?? [];
  const jobsList = jobs ?? [];

  const scheduledTasks = tasksList.filter((t) => t.scheduledFor || t.recurrence);
  const upcomingTasks = scheduledTasks
    .filter((t) => {
      const at = t.scheduledFor ?? 0;
      return at >= NOW && at <= NOW + SEVEN_DAYS_MS;
    })
    .sort((a, b) => (a.scheduledFor ?? 0) - (b.scheduledFor ?? 0))
    .slice(0, 15);

  const nextJobs = [...jobsList]
    .filter((j) => j.nextRun != null && j.nextRun >= NOW)
    .sort((a, b) => (a.nextRun ?? 0) - (b.nextRun ?? 0))
    .slice(0, 15);

  return (
    <main className="mc-page">
      <PageHeader
        title="Schedule"
        description="What's running and when. Upcoming tasks, scheduled jobs, and Convex crons in one place."
        icon={<Calendar className="h-4 w-4" />}
        eyebrow="Operations"
        actions={
          <div className="flex gap-2">
            {onNavigate && (
              <>
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => onNavigate("calendar")}>
                  <Calendar className="h-3.5 w-3.5 mr-1.5" />
                  Calendar
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => onNavigate("schedules")}>
                  Schedules
                </Button>
              </>
            )}
          </div>
        }
      />
      <div className="mc-page-body mc-page-stack">
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4">
            <div className="mc-kicker">Upcoming tasks</div>
            <div className="mt-2 text-3xl font-semibold text-foreground">{upcomingTasks.length}</div>
            <div className="mt-1 text-xs text-muted-foreground">Scheduled work in the next seven days</div>
          </Card>
          <Card className="p-4">
            <div className="mc-kicker">Scheduled jobs</div>
            <div className="mt-2 text-3xl font-semibold text-cyan-100">{jobsList.length}</div>
            <div className="mt-1 text-xs text-muted-foreground">Jobs with persisted next-run timestamps</div>
          </Card>
          <Card className="p-4">
            <div className="mc-kicker">Recurring tasks</div>
            <div className="mt-2 text-3xl font-semibold text-amber-100">{scheduledTasks.filter((task) => task.recurrence).length}</div>
            <div className="mt-1 text-xs text-muted-foreground">Operator routines and repeating agent work</div>
          </Card>
          <Card className="p-4">
            <div className="mc-kicker">Convex crons</div>
            <div className="mt-2 text-3xl font-semibold text-foreground">{CONVEX_CRONS.length}</div>
            <div className="mt-1 text-xs text-muted-foreground">Background jobs defined in code</div>
          </Card>
        </div>

        {/* Upcoming tasks */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
            <ListTodo className="h-4 w-4 text-muted-foreground" />
            Upcoming tasks (next 7 days)
          </h3>
          {upcomingTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks scheduled in the next 7 days.</p>
          ) : (
            <ul className="space-y-2">
              {upcomingTasks.map((t) => (
                <li key={t._id}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted/50 border border-transparent hover:border-border transition-colors"
                    onClick={() => onTaskSelect?.(t._id)}
                  >
                    <span className="font-medium text-foreground">{t.title}</span>
                    <span className="text-muted-foreground ml-2">
                      {t.scheduledFor
                        ? new Date(t.scheduledFor).toLocaleString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Recurring"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {onNavigate && (
            <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => onNavigate("calendar")}>
              View full calendar
            </Button>
          )}
        </Card>

        {/* Next scheduled job runs */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
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
                    {j.nextRun
                      ? new Date(j.nextRun).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {onNavigate && (
            <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => onNavigate("schedules")}>
              Manage schedules
            </Button>
          )}
        </Card>

        {/* Convex crons (read-only) */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Convex cron jobs
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Background jobs from crons.ts. Read-only; edit in code.
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
