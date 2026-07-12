import type { Doc } from "../../../convex/_generated/dataModel";
import { useState } from "react";
import { Pencil } from "lucide-react";
import { QuickEditModal } from "./QuickEditModal";
import { StatusChip } from "@/components/StatusChip";
import { PriorityChip } from "@/components/PriorityChip";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Doc<"tasks">;
  agents?: Doc<"agents">[];
  onClick: () => void;
  isDragging?: boolean;
  onUpdate?: () => void;
}

export function TaskCard({ task, agents, onClick, isDragging, onUpdate }: TaskCardProps) {
  const [showQuickEdit, setShowQuickEdit] = useState(false);
  const assignedAgent = agents?.find(a => task.assigneeIds?.includes(a._id));

  return (
    <>
      <div
        onClick={onClick}
        onDoubleClick={(e) => {
          e.stopPropagation();
          setShowQuickEdit(true);
        }}
        className={cn(
          "rounded-xl border border-line bg-surface-1 p-3 mb-2 cursor-pointer transition-colors duration-150 hover:border-line-strong",
          isDragging && "opacity-50"
        )}
    >
      <div className="flex justify-between mb-2">
        <div className="flex gap-1.5 items-center">
          <StatusChip status={task.status} />
          <PriorityChip priority={task.priority as number} />
        </div>
        <div className="flex gap-1 items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowQuickEdit(true);
            }}
            className="bg-transparent border-none text-ink-muted cursor-pointer px-1 py-0.5 hover:text-ink transition-colors duration-150"
            title="Edit task (or double-click card)"
            aria-label="Edit task"
          >
            <Pencil size={14} strokeWidth={1.6} aria-hidden />
          </button>
          <span className="text-[11.5px] text-ink-muted font-mono">
            {task.identifier ?? task._id.slice(-6)}
          </span>
        </div>
      </div>

      <div className="text-[13.5px] font-medium text-ink mb-2 leading-snug">
        {task.title}
      </div>

      {task.description && (
        <div className="text-[12.5px] text-ink-muted mb-2 overflow-hidden line-clamp-2">
          {task.description}
        </div>
      )}

      {task.dueAt != null && (
        <div
          className={cn(
            "text-[11.5px] mb-2",
            task.dueAt < Date.now()
              ? "text-err font-medium"
              : task.dueAt < Date.now() + 86400000 * 2
                ? "text-warn"
                : "text-ink-muted"
          )}
        >
          Due {new Date(task.dueAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: task.dueAt > Date.now() + 86400000 * 365 ? "numeric" : undefined })}
          {task.dueAt < Date.now() && " (overdue)"}
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="flex gap-1.5 items-center">
          <span className="text-[11.5px] text-ink-muted">
            {task.type}
          </span>
          {task.actualCost > 0 && (
            <span className="text-[11.5px] text-ink-secondary">
              ${task.actualCost.toFixed(2)}
            </span>
          )}
        </div>
        {assignedAgent && (
          <div className="text-[11.5px] px-2 py-0.5 rounded-md border border-line bg-surface-2 text-ink-secondary">
            {assignedAgent.emoji ? `${assignedAgent.emoji} ` : ""}{assignedAgent.name}
          </div>
        )}
      </div>
    </div>

    {showQuickEdit && (
      <QuickEditModal
        task={task}
        onClose={() => setShowQuickEdit(false)}
        onSave={() => {
          if (onUpdate) onUpdate();
        }}
      />
    )}
    </>
  );
}
