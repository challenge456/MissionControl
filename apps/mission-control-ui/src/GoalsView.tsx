import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id, Doc } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface GoalsViewProps {
  projectId: Id<"projects"> | null;
  onTaskSelect?: (taskId: Id<"tasks">) => void;
}

type GoalLevel = "COMPANY" | "TEAM" | "AGENT" | "TASK";
type GoalStatus = "PLANNED" | "ACTIVE" | "ACHIEVED" | "CANCELLED";

const LEVEL_CONFIG: Record<GoalLevel, { label: string; color: string; icon: string }> = {
  COMPANY: { label: "Company", color: "text-amber-400", icon: "🏢" },
  TEAM: { label: "Team", color: "text-blue-400", icon: "👥" },
  AGENT: { label: "Agent", color: "text-purple-400", icon: "🤖" },
  TASK: { label: "Task", color: "text-green-400", icon: "📋" },
};

const STATUS_CONFIG: Record<GoalStatus, { label: string; bg: string; text: string }> = {
  PLANNED: { label: "Planned", bg: "bg-muted", text: "text-muted-foreground" },
  ACTIVE: { label: "Active", bg: "bg-blue-500/15", text: "text-blue-400" },
  ACHIEVED: { label: "Achieved", bg: "bg-emerald-500/15", text: "text-emerald-400" },
  CANCELLED: { label: "Cancelled", bg: "bg-red-500/15", text: "text-red-400" },
};

// ============================================================================
// CREATE GOAL MODAL
// ============================================================================

interface CreateGoalModalProps {
  projectId: Id<"projects">;
  parentGoalId?: Id<"goals">;
  defaultLevel: GoalLevel;
  onClose: () => void;
}

function CreateGoalModal({ projectId, parentGoalId, defaultLevel, onClose }: CreateGoalModalProps) {
  const createGoal = useMutation(api.goals.create);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState<GoalLevel>(defaultLevel);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await createGoal({
        projectId,
        title: title.trim(),
        description: description.trim() || undefined,
        level,
        parentGoalId,
      });
      onClose();
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-foreground mb-4">
          {parentGoalId ? "Add Sub-Goal" : "Create Goal"}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Reach $1M ARR by Q3"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why does this goal matter?"
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Level</label>
            <div className="flex gap-2">
              {(["COMPANY", "TEAM", "AGENT", "TASK"] as GoalLevel[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                    level === l
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {LEVEL_CONFIG[l].icon} {LEVEL_CONFIG[l].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || saving}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving ? "Creating..." : "Create Goal"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// GOAL NODE (recursive tree)
// ============================================================================

interface GoalNodeData {
  _id: Id<"goals">;
  title: string;
  description?: string;
  level: GoalLevel;
  status: GoalStatus;
  progressPct?: number;
  parentGoalId?: Id<"goals">;
  ownerAgentId?: Id<"agents">;
  children: GoalNodeData[];
}

interface GoalNodeProps {
  node: GoalNodeData;
  depth: number;
  projectId: Id<"projects">;
  onTaskSelect?: (taskId: Id<"tasks">) => void;
}

function GoalNode({ node, depth, projectId, onTaskSelect }: GoalNodeProps) {
  const [expanded, setExpanded] = useState(depth < 2);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const updateGoal = useMutation(api.goals.update);

  const linkedTasks = useQuery(api.goals.getLinkedTasks, { goalId: node._id });
  const levelCfg = LEVEL_CONFIG[node.level];
  const statusCfg = STATUS_CONFIG[node.status];
  const hasChildren = node.children.length > 0;
  const taskCount = linkedTasks?.length ?? 0;
  const doneCount = linkedTasks?.filter((t) => t.status === "DONE").length ?? 0;

  const nextLevel = (): GoalLevel => {
    if (node.level === "COMPANY") return "TEAM";
    if (node.level === "TEAM") return "AGENT";
    return "TASK";
  };

  const handleStatusCycle = async () => {
    const order: GoalStatus[] = ["PLANNED", "ACTIVE", "ACHIEVED", "CANCELLED"];
    const idx = order.indexOf(node.status);
    const next = order[(idx + 1) % order.length];
    await updateGoal({ goalId: node._id, status: next });
  };

  return (
    <div className={cn("border-l-2 border-border/50", depth > 0 && "ml-6")}>
      <div
        className={cn(
          "group flex items-start gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer",
          "hover:bg-muted/50",
          showDetail && "bg-muted/30"
        )}
        onClick={() => setShowDetail(!showDetail)}
      >
        {/* Expand/collapse */}
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          className={cn(
            "mt-0.5 w-5 h-5 flex items-center justify-center rounded text-xs text-muted-foreground transition-transform",
            expanded && "rotate-90",
            !hasChildren && taskCount === 0 && "invisible"
          )}
        >
          ▶
        </button>

        {/* Level icon */}
        <span className="text-base mt-0.5">{levelCfg.icon}</span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-foreground truncate">{node.title}</span>
            <span className={cn("text-[10px] font-semibold uppercase tracking-wider", levelCfg.color)}>
              {levelCfg.label}
            </span>
          </div>

          {showDetail && node.description && (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{node.description}</p>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-3 mt-1">
            {taskCount > 0 && (
              <span className="text-[11px] text-muted-foreground">
                {doneCount}/{taskCount} tasks
              </span>
            )}
            {node.progressPct !== undefined && node.progressPct > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, node.progressPct)}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{Math.round(node.progressPct)}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Status badge */}
        <button
          onClick={(e) => { e.stopPropagation(); handleStatusCycle(); }}
          className={cn(
            "px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-colors",
            statusCfg.bg,
            statusCfg.text
          )}
          title="Click to cycle status"
        >
          {statusCfg.label}
        </button>

        {/* Add sub-goal */}
        <button
          onClick={(e) => { e.stopPropagation(); setShowCreate(true); }}
          className="opacity-0 group-hover:opacity-100 mt-0.5 w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-all text-sm"
          title="Add sub-goal"
        >
          +
        </button>
      </div>

      {/* Linked tasks (when expanded and detail shown) */}
      {expanded && showDetail && linkedTasks && linkedTasks.length > 0 && (
        <div className="ml-14 mb-2 space-y-1">
          {linkedTasks.map((task) => (
            <button
              key={task._id}
              onClick={() => onTaskSelect?.(task._id)}
              className="flex items-center gap-2 w-full text-left px-3 py-1.5 rounded-md text-xs hover:bg-muted/50 transition-colors"
            >
              <span className={cn(
                "w-2 h-2 rounded-full",
                task.status === "DONE" ? "bg-emerald-400" :
                task.status === "IN_PROGRESS" ? "bg-blue-400" :
                task.status === "BLOCKED" || task.status === "FAILED" ? "bg-red-400" :
                "bg-muted-foreground/50"
              )} />
              <span className="text-muted-foreground font-mono mr-1">{task.identifier ?? ""}</span>
              <span className="text-foreground truncate">{task.title}</span>
              <span className="text-[10px] text-muted-foreground ml-auto">{task.status}</span>
            </button>
          ))}
        </div>
      )}

      {/* Children */}
      {expanded && node.children.map((child) => (
        <GoalNode
          key={child._id}
          node={child as GoalNodeData}
          depth={depth + 1}
          projectId={projectId}
          onTaskSelect={onTaskSelect}
        />
      ))}

      {showCreate && (
        <CreateGoalModal
          projectId={projectId}
          parentGoalId={node._id}
          defaultLevel={nextLevel()}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}

// ============================================================================
// GOALS VIEW (main export)
// ============================================================================

export function GoalsView({ projectId, onTaskSelect }: GoalsViewProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState<GoalStatus | "ALL">("ALL");

  const hierarchy = useQuery(
    api.goals.getHierarchy,
    projectId ? { projectId } : "skip"
  );

  if (!projectId) {
    return (
      <main className="flex-1 overflow-auto bg-background p-6">
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Select a project to view goals.
        </div>
      </main>
    );
  }

  const filteredHierarchy = hierarchy?.filter((root) => {
    if (statusFilter === "ALL") return true;
    return root.status === statusFilter;
  });

  return (
    <main className="flex-1 overflow-auto bg-background p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mt-0 mb-1">Goal Alignment</h1>
          <p className="text-sm text-muted-foreground mt-0">
            Every task traces back to a company goal. If you can&apos;t explain why it matters, it shouldn&apos;t exist.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <span>+</span>
          <span>New Goal</span>
        </button>
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-2 mb-6">
        {(["ALL", "ACTIVE", "PLANNED", "ACHIEVED", "CANCELLED"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              statusFilter === s
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {s === "ALL" ? "All" : STATUS_CONFIG[s].label}
          </button>
        ))}
        {hierarchy && (
          <span className="ml-auto text-xs text-muted-foreground">
            {hierarchy.length} top-level goal{hierarchy.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Tree */}
      {!hierarchy ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Loading goals...
        </div>
      ) : filteredHierarchy && filteredHierarchy.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-4xl mb-4">🎯</span>
          <p className="text-muted-foreground text-sm mb-4">
            {statusFilter === "ALL"
              ? "No goals yet. Start by defining your company mission."
              : `No ${statusFilter.toLowerCase()} goals.`}
          </p>
          {statusFilter === "ALL" && (
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Create First Goal
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          {filteredHierarchy?.map((root) => (
            <GoalNode
              key={root._id}
              node={root as GoalNodeData}
              depth={0}
              projectId={projectId}
              onTaskSelect={onTaskSelect}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateGoalModal
          projectId={projectId}
          defaultLevel="COMPANY"
          onClose={() => setShowCreate(false)}
        />
      )}
    </main>
  );
}
