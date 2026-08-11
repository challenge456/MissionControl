export const CANONICAL_TASK_STATUSES = [
  "INBOX",
  "READY",
  "ASSIGNED",
  "IN_PROGRESS",
  "REVIEW",
  "NEEDS_APPROVAL",
  "BLOCKED",
  "FAILED",
  "DONE",
  "CANCELED",
] as const;

export type CanonicalTaskStatus = (typeof CANONICAL_TASK_STATUSES)[number];

export const TASK_STATUS_LABELS: Record<CanonicalTaskStatus, string> = {
  INBOX: "Inbox",
  READY: "Ready",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In progress",
  REVIEW: "Review",
  NEEDS_APPROVAL: "Needs approval",
  BLOCKED: "Blocked",
  FAILED: "Failed",
  DONE: "Done",
  CANCELED: "Canceled",
};

const PRESENTATION_ACTIVE_STATUSES = new Set<CanonicalTaskStatus>([
  "READY",
  "ASSIGNED",
  "IN_PROGRESS",
  "REVIEW",
  "NEEDS_APPROVAL",
]);

function startOfWeek(date: Date): number {
  const value = new Date(date);
  const day = value.getDay();
  const diff = value.getDate() - day + (day === 0 ? -6 : 1);
  value.setDate(diff);
  value.setHours(0, 0, 0, 0);
  return value.getTime();
}

export function buildTaskboardStats(
  tasks: Array<{ status: string; _creationTime?: number }>,
  now = new Date(),
) {
  const canonicalCounts = Object.fromEntries(
    CANONICAL_TASK_STATUSES.map((status) => [status, 0]),
  ) as Record<CanonicalTaskStatus, number>;
  let unknownStatusCount = 0;
  let presentationActiveCount = 0;

  for (const task of tasks) {
    if (CANONICAL_TASK_STATUSES.includes(task.status as CanonicalTaskStatus)) {
      const status = task.status as CanonicalTaskStatus;
      canonicalCounts[status] += 1;
      if (PRESENTATION_ACTIVE_STATUSES.has(status)) presentationActiveCount += 1;
    } else {
      unknownStatusCount += 1;
    }
  }

  const total = tasks.length;
  return {
    canonicalCounts,
    unknownStatusCount,
    presentationActiveCount,
    total,
    thisWeek: tasks.filter((task) => (task._creationTime ?? 0) >= startOfWeek(now)).length,
    completionPct: total > 0 ? Math.round((canonicalCounts.DONE / total) * 100) : 0,
  };
}
