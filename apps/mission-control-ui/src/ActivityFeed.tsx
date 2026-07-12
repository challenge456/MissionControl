import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import {
  Ban,
  CheckCircle2,
  Eye,
  FileText,
  Inbox,
  MessageSquare,
  Pencil,
  Plus,
  Trash2,
  User,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";

interface ActivityFeedProps {
  projectId: Id<"projects"> | null;
  limit?: number;
}

export function ActivityFeed({ projectId, limit = 50 }: ActivityFeedProps) {
  const activities = useQuery(
    api.activities.listRecent,
    projectId ? { projectId, limit } : { limit }
  );

  if (!activities) {
    return (
      <div className="flex flex-col gap-2 p-5">
        <div className="h-4 w-56 animate-pulse rounded bg-surface-2" />
        <div className="h-4 w-72 animate-pulse rounded bg-surface-2" />
        <div className="h-4 w-48 animate-pulse rounded bg-surface-2" />
      </div>
    );
  }

  const getActivityIcon = (action: string): LucideIcon => {
    if (action.includes("CREATED")) return Plus;
    if (action.includes("UPDATED")) return Pencil;
    if (action.includes("DELETED")) return Trash2;
    if (action.includes("APPROVED")) return CheckCircle2;
    if (action.includes("DENIED")) return XCircle;
    if (action.includes("ASSIGNED")) return User;
    if (action.includes("COMPLETED")) return CheckCircle2;
    if (action.includes("BLOCKED")) return Ban;
    if (action.includes("REVIEW")) return Eye;
    if (action.includes("COMMENT")) return MessageSquare;
    return FileText;
  };

  const getActivityBorderClass = (action: string) => {
    if (action.includes("CREATED")) return "border-l-ok";
    if (action.includes("COMPLETED")) return "border-l-ok";
    if (action.includes("APPROVED")) return "border-l-ok";
    if (action.includes("DENIED")) return "border-l-err";
    if (action.includes("BLOCKED")) return "border-l-err";
    if (action.includes("DELETED")) return "border-l-err";
    if (action.includes("REVIEW")) return "border-l-info-accent";
    if (action.includes("ASSIGNED")) return "border-l-info-accent";
    return "border-l-line-strong";
  };

  return (
    <div className="rounded-lg bg-surface-1 p-4 max-h-[600px] overflow-auto">
      <h3 className="mb-4 text-[15px] font-semibold text-ink">Recent Activity</h3>

      {activities.length === 0 ? (
        <EmptyState icon={Inbox} title="No activity yet" className="border-none bg-transparent" />
      ) : (
        <div className="flex flex-col gap-2">
          {activities.map((activity) => {
            const Icon = getActivityIcon(activity.action);
            return (
              <div
                key={activity._id}
                className={cn(
                  "p-3 bg-surface-2 rounded-md border-l-2",
                  getActivityBorderClass(activity.action)
                )}
              >
                <div className="flex items-start gap-2.5">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" strokeWidth={1.75} />
                  <div className="flex-1">
                    <div className="text-[13px] text-ink mb-1">
                      {activity.description}
                    </div>
                    <div className="text-[11.5px] text-ink-muted flex gap-2">
                      <span>{activity.actorType}</span>
                      <span>·</span>
                      <span>{new Date(activity._creationTime).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ActivityFeedModal({ projectId, onClose }: { projectId: Id<"projects"> | null; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[800px] max-h-[85vh] flex flex-col gap-0 p-0">
        <DialogHeader className="p-6 pb-4 border-b border-line">
          <DialogTitle className="text-[19px]">Activity Feed</DialogTitle>
        </DialogHeader>
        <div className="p-6 overflow-auto flex-1 min-h-0">
          <ActivityFeed projectId={projectId} limit={100} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
