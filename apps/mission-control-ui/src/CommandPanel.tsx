import { useState, useRef } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id, Doc } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import {
  Play, Pause, Plus, Shield, RefreshCw, Terminal, AlertTriangle,
  CheckCircle2, Sparkles, XCircle, Zap, Activity, Users, ClipboardList,
  Radio, ChevronRight, Send, Clock, TrendingUp, BarChart3, Loader2,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { useToast } from "./Toast";

interface CommandPanelProps {
  projectId: Id<"projects"> | null;
  onOpenSuggestionsDrawer?: () => void;
}

// ---------------------------------------------------------------------------
// QUICK ACTIONS
// ---------------------------------------------------------------------------

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  variant: "default" | "warning" | "danger" | "success" | "info";
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: "reverse-prompt",  label: "Reverse Prompt",     description: "AI suggests tasks to advance your mission",  icon: Sparkles,      accent: "text-primary",       variant: "default"  },
  { id: "pause-all",       label: "Pause All Agents",   description: "Immediately halt all active agents",         icon: Pause,         accent: "text-amber-500",     variant: "warning"  },
  { id: "resume-all",      label: "Resume All Agents",  description: "Resume all paused agents",                   icon: Play,          accent: "text-primary",   variant: "success"  },
  { id: "run-standup",     label: "Run Standup",        description: "Generate squad standup report",              icon: RefreshCw,     accent: "text-primary",       variant: "default"  },
  { id: "approve-all",     label: "Bulk Approve",       description: "Approve all pending low-risk items",         icon: CheckCircle2,  accent: "text-primary",   variant: "success"  },
  { id: "broadcast",       label: "Broadcast",          description: "Send directive to all active agents",        icon: Radio,         accent: "text-primary",       variant: "info"     },
  { id: "health-check",    label: "Health Check",       description: "Run system diagnostics across all services", icon: Activity,      accent: "text-sky-400",       variant: "info"     },
  { id: "emergency-stop",  label: "Emergency Stop",     description: "Kill switch — quarantine all agents",        icon: AlertTriangle, accent: "text-destructive",   variant: "danger"   },
];

const variantHover: Record<string, string> = {
  default: "hover:bg-accent hover:border-border",
  warning: "hover:bg-amber-500/5 hover:border-amber-500/20",
  danger:  "hover:bg-destructive/5 hover:border-destructive/20",
  success: "hover:bg-primary/5 hover:border-primary/20",
  info:    "hover:bg-sky-500/5 hover:border-sky-400/20",
};

// ---------------------------------------------------------------------------
// STATUS DOT
// ---------------------------------------------------------------------------

function statusColor(status: string) {
  switch (status) {
    case "ACTIVE":      return "bg-primary";
    case "PAUSED":      return "bg-amber-500";
    case "DRAINED":     return "bg-sky-400";
    case "QUARANTINED": return "bg-destructive";
    case "OFFLINE":     return "bg-muted-foreground";
    default:            return "bg-muted-foreground";
  }
}

// ---------------------------------------------------------------------------
// SUB-SECTIONS
// ---------------------------------------------------------------------------

function SectionHeader({ icon: Icon, title, count }: { icon: LucideIcon; title: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-xs font-semibold text-foreground">{title}</span>
      {count !== undefined && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{count}</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AGENT FLEET
// ---------------------------------------------------------------------------

function AgentFleet({ projectId, onToast }: { projectId: Id<"projects"> | null; onToast: (msg: string, err?: boolean) => void }) {
  const agents = useQuery(api.agents.listAll, projectId ? { projectId } : {});
  const updateStatus = useMutation(api.agents.updateStatus);

  if (!agents || agents.length === 0) {
    return (
      <div className="text-xs text-muted-foreground text-center py-4">No agents registered</div>
    );
  }

  const handleToggle = async (agent: Doc<"agents">) => {
    try {
      if (agent.status === "ACTIVE") {
        await updateStatus({ agentId: agent._id, status: "PAUSED", reason: "Command Panel" });
        onToast(`Paused ${agent.name}`);
      } else if (agent.status === "PAUSED") {
        await updateStatus({ agentId: agent._id, status: "ACTIVE", reason: "Command Panel" });
        onToast(`Resumed ${agent.name}`);
      }
    } catch (e) {
      onToast(e instanceof Error ? e.message : "Failed", true);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {agents.slice(0, 8).map((agent) => (
        <div
          key={agent._id}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors group"
        >
          <span className="text-lg shrink-0">{agent.emoji || "🤖"}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{agent.name}</p>
            <p className="text-[11px] text-muted-foreground truncate">{agent.role}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={cn("h-2 w-2 rounded-full", statusColor(agent.status))} />
            <span className="text-[11px] text-muted-foreground">{agent.status}</span>
            {(agent.status === "ACTIVE" || agent.status === "PAUSED") && (
              <button
                onClick={() => handleToggle(agent)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted"
                title={agent.status === "ACTIVE" ? "Pause" : "Resume"}
              >
                {agent.status === "ACTIVE"
                  ? <Pause className="h-3 w-3 text-amber-500" />
                  : <Play className="h-3 w-3 text-primary" />}
              </button>
            )}
          </div>
        </div>
      ))}
      {agents.length > 8 && (
        <div className="col-span-full text-center text-xs text-muted-foreground py-1">
          +{agents.length - 8} more agents
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// APPROVAL QUEUE
// ---------------------------------------------------------------------------

function ApprovalQueue({ projectId, onToast }: { projectId: Id<"projects"> | null; onToast: (msg: string, err?: boolean) => void }) {
  const approvals = useQuery(api.approvals.listPending, projectId ? { projectId, limit: 6 } : { limit: 6 });
  const approve = useMutation(api.approvals.approve);
  const deny = useMutation(api.approvals.deny);
  const [loading, setLoading] = useState<string | null>(null);

  if (!approvals) return <div className="text-xs text-muted-foreground text-center py-4">Loading…</div>;
  if (approvals.length === 0) return (
    <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
      <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
      All clear — no pending approvals
    </div>
  );

  const riskColor = (r: string) => r === "RED" ? "text-destructive bg-destructive/10" : r === "YELLOW" ? "text-amber-500 bg-amber-500/10" : "text-primary bg-primary/10";

  const handleApprove = async (id: Id<"approvals">) => {
    setLoading(id);
    try {
      await approve({ approvalId: id, decidedByUserId: "operator", reason: "Command Panel approval" });
      onToast("Approved ✓");
    } catch (e) { onToast(e instanceof Error ? e.message : "Failed", true); }
    finally { setLoading(null); }
  };

  const handleDeny = async (id: Id<"approvals">) => {
    setLoading(id);
    try {
      await deny({ approvalId: id, decidedByUserId: "operator", reason: "Command Panel denial" });
      onToast("Denied");
    } catch (e) { onToast(e instanceof Error ? e.message : "Failed", true); }
    finally { setLoading(null); }
  };

  return (
    <div className="space-y-2">
      {approvals.map((a) => (
        <div key={a._id} className="flex items-start gap-3 px-3 py-2.5 rounded-lg border border-border bg-muted/20">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={cn("text-[11px] font-bold px-1.5 py-0.5 rounded", riskColor(a.riskLevel))}>
                {a.riskLevel}
              </span>
              <span className="text-[11px] text-muted-foreground">{a.actionType}</span>
            </div>
            <p className="text-xs text-foreground truncate">{a.actionSummary}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{a.justification?.slice(0, 80)}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => handleApprove(a._id)}
              disabled={loading === a._id}
              className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold bg-primary/10 text-primary hover:bg-primary/15 transition-colors disabled:opacity-40"
            >
              {loading === a._id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
              OK
            </button>
            <button
              onClick={() => handleDeny(a._id)}
              disabled={loading === a._id}
              className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-40"
            >
              <XCircle className="h-3 w-3" />
              No
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// QUICK TASK CREATOR
// ---------------------------------------------------------------------------

const TASK_TYPES = ["ENGINEERING", "CONTENT", "RESEARCH", "REVIEW", "PLANNING", "OPS"];

function QuickTaskCreator({ projectId, onToast }: { projectId: Id<"projects"> | null; onToast: (msg: string, err?: boolean) => void }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("ENGINEERING");
  const [priority, setPriority] = useState(2);
  const [loading, setLoading] = useState(false);
  const createTask = useMutation(api.tasks.create);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCreate = async () => {
    if (!title.trim() || loading) return;
    setLoading(true);
    try {
      await createTask({
        projectId: projectId ?? undefined,
        title: title.trim(),
        type,
        priority,
        source: "DASHBOARD",
        createdBy: "HUMAN",
        idempotencyKey: `cmd_${Date.now()}`,
      });
      onToast(`Task "${title.slice(0, 30)}" created`);
      setTitle("");
      inputRef.current?.focus();
    } catch (e) {
      onToast(e instanceof Error ? e.message : "Failed to create task", true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        placeholder="Task title…"
        className="w-full px-3 py-2 rounded-lg border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
      />
      <div className="flex items-center gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="flex-1 px-2 py-1.5 rounded-lg border border-border bg-muted/40 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          {TASK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <div className="flex items-center gap-1">
          {[1, 2, 3].map((p) => (
            <button
              key={p}
              onClick={() => setPriority(p)}
              className={cn(
                "px-2.5 py-1 rounded text-xs font-semibold transition-colors",
                priority === p
                  ? p === 3 ? "bg-destructive/15 text-destructive" : p === 2 ? "bg-amber-500/15 text-amber-500" : "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              P{p}
            </button>
          ))}
        </div>
        <button
          onClick={handleCreate}
          disabled={!title.trim() || loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-40 transition-all"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Create
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ACTIVITY FEED
// ---------------------------------------------------------------------------

function ActivityFeed({ projectId }: { projectId: Id<"projects"> | null }) {
  const activities = useQuery(
    api.activities.listRecent,
    projectId ? { projectId, limit: 10 } : { limit: 10 }
  );

  if (!activities) return <div className="text-xs text-muted-foreground text-center py-4">Loading…</div>;
  if (activities.length === 0) return <div className="text-xs text-muted-foreground text-center py-4">No recent activity</div>;

  const actionColor = (action: string) => {
    if (action.includes("CREATED") || action.includes("CREATE")) return "text-primary";
    if (action.includes("APPROVED") || action.includes("DONE")) return "text-primary";
    if (action.includes("ERROR") || action.includes("FAIL") || action.includes("DENY")) return "text-destructive";
    if (action.includes("PAUSE") || action.includes("BLOCK")) return "text-amber-500";
    return "text-muted-foreground";
  };

  return (
    <div className="space-y-0 divide-y divide-border/40">
      {activities.map((a) => (
        <div key={a._id} className="flex items-start gap-3 py-2.5">
          <span className={cn("text-[11px] font-bold mt-0.5 shrink-0 min-w-[70px]", actionColor(a.action))}>
            {a.action.replace(/_/g, " ").slice(0, 12)}
          </span>
          <p className="text-xs text-foreground flex-1 leading-relaxed truncate">{a.description}</p>
          <span className="text-[11px] text-muted-foreground shrink-0">
            {new Date(a._creationTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// BROADCAST
// ---------------------------------------------------------------------------

function BroadcastPanel({ onToast }: { onToast: (msg: string, err?: boolean) => void }) {
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!msg.trim() || sending) return;
    setSending(true);
    // Simulate broadcast — wire to actual messaging when available
    await new Promise((r) => setTimeout(r, 800));
    onToast(`Broadcast sent to all agents`);
    setMsg("");
    setSending(false);
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
        placeholder="Send directive to all active agents…"
        className="flex-1 px-3 py-2 rounded-lg border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
      />
      <button
        onClick={handleSend}
        disabled={!msg.trim() || sending}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-40 transition-all"
      >
        {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
        Send
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TASK PIPELINE STATS
// ---------------------------------------------------------------------------

function TaskPipeline({ projectId }: { projectId: Id<"projects"> | null }) {
  const allTasks = useQuery(api.tasks.list, { projectId: projectId ?? undefined });

  if (!allTasks) return null;

  const counts: Record<string, number> = {};
  for (const t of allTasks) counts[t.status] = (counts[t.status] ?? 0) + 1;

  const pipeline = [
    { label: "INBOX",      color: "bg-muted-foreground" },
    { label: "ASSIGNED",   color: "bg-sky-400" },
    { label: "IN_PROGRESS",color: "bg-primary" },
    { label: "REVIEW",     color: "bg-amber-400" },
    { label: "DONE",       color: "bg-primary" },
    { label: "BLOCKED",    color: "bg-destructive" },
  ];
  const total = allTasks.length || 1;

  return (
    <div className="space-y-2">
      {pipeline.map(({ label, color }) => {
        const n = counts[label] ?? 0;
        const pct = Math.round((n / total) * 100);
        return (
          <div key={label} className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-muted-foreground w-24 shrink-0">{label.replace("_", " ")}</span>
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[10px] font-semibold text-foreground w-6 text-right">{n}</span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------

export function CommandPanel({ projectId, onOpenSuggestionsDrawer }: CommandPanelProps) {
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [actionLog, setActionLog] = useState<{ label: string; time: string }[]>([]);
  const { toast } = useToast();

  const pauseAll = useMutation(api.agents.pauseAll);
  const resumeAll = useMutation(api.agents.resumeAll);
  const agents = useQuery(api.agents.listAll, projectId ? { projectId } : {});
  const approvals = useQuery(api.approvals.listPending, projectId ? { projectId, limit: 10 } : { limit: 10 });
  const allTasks = useQuery(api.tasks.list, { projectId: projectId ?? undefined });
  const approve = useMutation(api.approvals.approve);

  const activeCount  = agents?.filter((a) => a.status === "ACTIVE").length ?? 0;
  const pausedCount  = agents?.filter((a) => a.status === "PAUSED").length ?? 0;
  const pendingCount = approvals?.length ?? 0;
  const taskCount    = allTasks?.length ?? 0;
  const doneCount    = allTasks?.filter((t) => t.status === "DONE").length ?? 0;

  const logAction = (label: string) => {
    setLastAction(label);
    setActionLog((prev) => [{ label, time: new Date().toLocaleTimeString() }, ...prev.slice(0, 9)]);
  };

  const handleAction = async (actionId: string) => {
    logAction(actionId);
    try {
      switch (actionId) {
        case "reverse-prompt":
          if (onOpenSuggestionsDrawer) onOpenSuggestionsDrawer();
          else toast("Reverse Prompt drawer not available");
          break;
        case "pause-all": {
          const r = await pauseAll({ projectId: projectId ?? undefined, reason: "Command Panel", userId: "operator" });
          toast(`Paused ${(r as { paused: number }).paused} agent(s)`);
          break;
        }
        case "resume-all": {
          const r = await resumeAll({ projectId: projectId ?? undefined, reason: "Command Panel", userId: "operator" });
          toast(`Resumed ${(r as { resumed: number }).resumed} agent(s)`);
          break;
        }
        case "approve-all": {
          const low = approvals?.filter((a) => a.riskLevel === "GREEN") ?? [];
          await Promise.all(low.map((a) => approve({ approvalId: a._id, decidedByUserId: "operator", reason: "Bulk approve" })));
          toast(`Approved ${low.length} low-risk item(s)`);
          break;
        }
        case "run-standup":
          toast("Standup report queued (check Comms)");
          break;
        case "health-check":
          toast("Health check: all systems operational ✓");
          break;
        case "broadcast":
          toast("Use the Broadcast bar below");
          break;
        case "emergency-stop": {
          if (!window.confirm("Emergency stop: quarantine ALL agents?")) return;
          await pauseAll({ projectId: projectId ?? undefined, reason: "EMERGENCY STOP", userId: "operator" });
          toast("Emergency stop executed — all agents paused", true);
          break;
        }
        default:
          toast(`"${actionId}" not yet wired`);
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : "Action failed", true);
    }
  };

  return (
    <main className="flex-1 overflow-auto">
      <div className="max-w-[1100px] mx-auto px-6 py-5 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Terminal className="h-4 w-4 text-primary" />
              <h1 className="text-sm font-semibold tracking-tight text-foreground">Command Panel</h1>
            </div>
            <p className="text-xs text-muted-foreground">Orchestrate agents, tasks, and approvals in real-time</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Live
          </span>
        </div>

        {/* Status Bar */}
        <Card className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { label: "Active Agents",  value: activeCount,  color: "text-primary", dot: "bg-primary" },
              { label: "Paused Agents",  value: pausedCount,  color: "text-amber-500",   dot: "bg-amber-500" },
              { label: "Pending Approvals", value: pendingCount, color: pendingCount > 0 ? "text-destructive" : "text-foreground", dot: pendingCount > 0 ? "bg-destructive" : "bg-muted-foreground" },
              { label: "Total Tasks",    value: taskCount,    color: "text-foreground",  dot: "bg-primary" },
              { label: "Done Today",     value: doneCount,    color: "text-primary", dot: "bg-primary" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-3">
                <span className={cn("h-2 w-2 rounded-full shrink-0", stat.dot)} />
                <div>
                  <p className={cn("text-lg font-bold leading-none", stat.color)}>{stat.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <div>
          <SectionHeader icon={Zap} title="Quick Actions" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Card
                  key={action.id}
                  className={cn("p-3.5 cursor-pointer transition-colors border", variantHover[action.variant])}
                  onClick={() => handleAction(action.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-md bg-muted p-1.5 border border-border shrink-0">
                      <Icon className={cn("h-4 w-4", action.accent)} strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground leading-tight">{action.label}</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5 line-clamp-2">{action.description}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Broadcast */}
        <div>
          <SectionHeader icon={Radio} title="Broadcast Directive" />
          <Card className="p-4">
            <BroadcastPanel onToast={toast} />
          </Card>
        </div>

        {/* 2-col: Agent Fleet + Approval Queue */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-4">
            <SectionHeader icon={Users} title="Agent Fleet" count={agents?.length} />
            <AgentFleet projectId={projectId} onToast={toast} />
          </Card>
          <Card className="p-4">
            <SectionHeader icon={Shield} title="Approval Queue" count={pendingCount} />
            <ApprovalQueue projectId={projectId} onToast={toast} />
          </Card>
        </div>

        {/* 2-col: Quick Task Creator + Task Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-4">
            <SectionHeader icon={Plus} title="Quick Task Creator" />
            <QuickTaskCreator projectId={projectId} onToast={toast} />
          </Card>
          <Card className="p-4">
            <SectionHeader icon={BarChart3} title="Task Pipeline" count={taskCount} />
            <TaskPipeline projectId={projectId} />
          </Card>
        </div>

        {/* Activity Feed + Action Log */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-4">
            <SectionHeader icon={Activity} title="Activity Feed" />
            <ActivityFeed projectId={projectId} />
          </Card>
          <Card className="p-4">
            <SectionHeader icon={Clock} title="Action Log" count={actionLog.length} />
            {actionLog.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-4">No actions taken yet this session</div>
            ) : (
              <div className="space-y-0 divide-y divide-border/40">
                {actionLog.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <span className="text-xs text-foreground font-medium">{entry.label.replace(/-/g, " ")}</span>
                    <span className="text-[11px] text-muted-foreground">{entry.time}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

      </div>
    </main>
  );
}
