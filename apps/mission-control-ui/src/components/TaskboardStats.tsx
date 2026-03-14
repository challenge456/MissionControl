import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface TaskboardStatsProps {
  projectId: Id<"projects"> | null;
  className?: string;
}

function startOfWeek(date: Date): number {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function TaskboardStats({ projectId, className }: TaskboardStatsProps) {
  const tasks = useQuery(api.tasks.listAll, projectId ? { projectId } : {});

  if (tasks === undefined) return null;

  const weekStart = startOfWeek(new Date());
  const thisWeek = tasks.filter(
    (t) => (t as { _creationTime?: number })._creationTime >= weekStart
  ).length;
  const inProgress = tasks.filter(
    (t) =>
      t.status === "IN_PROGRESS" ||
      t.status === "ASSIGNED" ||
      t.status === "REVIEW" ||
      t.status === "NEEDS_APPROVAL"
  ).length;
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "DONE").length;
  const completionPct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-4 px-4 py-2 border-b border-border bg-muted/30",
        className
      )}
    >
      <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
        {thisWeek} This week
      </span>
      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
        {inProgress} In progress
      </span>
      <span className="text-sm font-medium text-foreground">
        {total} Total
      </span>
      <span className="text-sm font-medium text-violet-600 dark:text-violet-400">
        {completionPct}% Completion
      </span>
    </div>
  );
}
