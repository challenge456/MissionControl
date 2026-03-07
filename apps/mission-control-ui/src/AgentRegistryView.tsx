import { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { getOrchestrationBaseUrl } from "@/lib/orchestrationUrl";
import { useToast } from "./Toast";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "./components/PageHeader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DiscoverAgentsModal } from "./DiscoverAgentsModal";
import {
  Bot,
  Activity,
  ShieldAlert,
  ListTodo,
  Clock,
  DollarSign,
  AlertTriangle,
  Radio,
  Search,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Settings,
} from "lucide-react";
import { AgentSettingsPanel } from "./AgentSettingsPanel";

const STATUS_CONFIG: Record<string, { label: string; className: string; dotClass: string }> = {
  ACTIVE: { label: "Active", className: "bg-primary/15 text-primary/70 dark:text-primary border-primary/30", dotClass: "bg-primary" },
  PAUSED: { label: "Paused", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30", dotClass: "bg-amber-400" },
  DRAINED: { label: "Drained", className: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30", dotClass: "bg-slate-400" },
  QUARANTINED: { label: "Quarantined", className: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30", dotClass: "bg-red-400" },
  OFFLINE: { label: "Offline", className: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30", dotClass: "bg-zinc-400" },
};

const STATUS_FILTER_OPTIONS = ["ACTIVE", "PAUSED", "QUARANTINED", "OFFLINE"] as const;

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export function AgentRegistryView({
  projectId,
  onNavigateToIdentity,
  onOpenCreateAgent,
}: {
  projectId: Id<"projects"> | null;
  onNavigateToIdentity?: () => void;
  onOpenCreateAgent?: () => void;
}) {
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [settingsAgent, setSettingsAgent] = useState<Doc<"agents"> | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<typeof STATUS_FILTER_OPTIONS[number] | "ALL">("ALL");
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    description: string;
    danger?: boolean;
    onConfirm: () => void | Promise<void>;
  } | null>(null);
  const [gatewayConfigured, setGatewayConfigured] = useState(false);

  const orchestrationBase = getOrchestrationBaseUrl();

  useEffect(() => {
    let cancelled = false;
    fetch(orchestrationBase ? `${orchestrationBase}/gateway/status` : "/gateway/status")
      .then((r) => r.json())
      .then((data: { configured?: boolean; urlConfigured?: boolean; tokenConfigured?: boolean }) => {
        if (!cancelled)
          setGatewayConfigured(Boolean(data.configured ?? (data.urlConfigured && data.tokenConfigured)));
      })
      .catch(() => {
        if (!cancelled) setGatewayConfigured(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orchestrationBase]);

  const agents = useQuery(api.agents.listAll, projectId ? { projectId } : {});
  const tasks = useQuery(api.tasks.listAll, projectId ? { projectId } : {});
  const updateStatus = useMutation(api.agents.updateStatus);
  const pauseAll = useMutation(api.agents.pauseAll);
  const resumeAll = useMutation(api.agents.resumeAll);
  const resetAll = useMutation(api.agents.resetAll);
  const { toast } = useToast();

  const taskCountByAgent = useMemo(() => {
    const map = new Map<Id<"agents">, number>();
    if (!tasks) return map;
    for (const task of tasks)
      for (const id of task.assigneeIds)
        map.set(id, (map.get(id) ?? 0) + 1);
    return map;
  }, [tasks]);

  const filteredAgents = useMemo(() => {
    if (!agents) return [];
    let list = agents;
    if (statusFilter !== "ALL") list = list.filter((a) => a.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.role.toLowerCase().includes(q) ||
          (a.emoji ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [agents, statusFilter, search]);

  if (!agents || !tasks) {
    return (
      <main className="flex-1 overflow-auto p-6">
        <div className="h-6 w-40 rounded skeleton-shimmer mb-2" />
        <div className="h-4 w-56 rounded skeleton-shimmer" />
      </main>
    );
  }

  const activeCount = agents.filter((a) => a.status === "ACTIVE").length;
  const pausedCount = agents.filter((a) => a.status === "PAUSED").length;
  const quarantinedCount = agents.filter((a) => a.status === "QUARANTINED").length;
  const offlineCount = agents.filter((a) => a.status === "OFFLINE").length;
  const assignedCount = tasks.filter((t) => t.assigneeIds.length > 0).length;

  async function setStatus(agent: Doc<"agents">, status: string, reason: string) {
    const isDangerous = status === "QUARANTINED" || status === "DRAINED";
    if (isDangerous) {
      setConfirmState({
        open: true,
        title: `Set ${agent.name} to ${status}?`,
        description: `This will change the agent's status. ${status === "QUARANTINED" ? "The agent will be isolated from receiving new work." : ""}`,
        danger: true,
        onConfirm: async () => {
          try {
            await updateStatus({ agentId: agent._id, status, reason });
            toast(`${agent.name} → ${status}`);
          } catch (e) {
            toast(e instanceof Error ? e.message : "Status update failed", true);
          }
          setConfirmState(null);
        },
      });
      return;
    }
    try {
      await updateStatus({ agentId: agent._id, status, reason });
      toast(`${agent.name} → ${status}`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Status update failed", true);
    }
  }

  const handlePauseAll = () => {
    setConfirmState({
      open: true,
      title: "Pause all active agents?",
      description: "All agents currently active will be paused. You can resume them from the operator controls.",
      danger: true,
      onConfirm: async () => {
        try {
          const r = await pauseAll({ projectId: projectId ?? undefined, reason: "Operator pause", userId: "operator" });
          toast(`Paused ${(r as { paused: number }).paused} agent(s)`);
        } catch (e) {
          toast(e instanceof Error ? e.message : "Failed", true);
        }
        setConfirmState(null);
      },
    });
  };

  return (
    <main className="flex-1 overflow-auto">
      <PageHeader
        title="Agent Registry"
        description={`${agents.length} agents · ${activeCount} active`}
        status={
          gatewayConfigured ? (
            <Badge variant="outline" className="text-[10px] border-primary/40 text-primary/90">
              Gateway connected
            </Badge>
          ) : undefined
        }
        actions={
          <div className="flex items-center gap-2">
            {onOpenCreateAgent && (
              <Button size="sm" variant="neon" onClick={onOpenCreateAgent}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Create agent
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => setDiscoverOpen(true)}>
              <Radio className="h-3.5 w-3.5 mr-1.5" />
              Discover agents
            </Button>
          </div>
        }
      />
      <DiscoverAgentsModal
        projectId={projectId}
        open={discoverOpen}
        onClose={() => setDiscoverOpen(false)}
        onImported={() => toast("Agent imported")}
      />

      {/* Fleet health bar */}
      <div className="px-6 pb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter("ALL")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
            statusFilter === "ALL"
              ? "bg-primary/10 text-primary border-primary/30"
              : "bg-muted/40 text-muted-foreground border-border hover:bg-muted/60"
          )}
        >
          <Bot className="h-3 w-3" />
          All {agents.length}
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("ACTIVE")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
            statusFilter === "ACTIVE"
              ? "bg-primary/15 text-primary/70 dark:text-primary border-primary/30"
              : "bg-muted/40 text-muted-foreground border-border hover:bg-muted/60"
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full bg-primary", activeCount > 0 && "animate-pulse")} />
          Active {activeCount}
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("PAUSED")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
            statusFilter === "PAUSED"
              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
              : "bg-muted/40 text-muted-foreground border-border hover:bg-muted/60"
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          Paused {pausedCount}
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("QUARANTINED")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
            statusFilter === "QUARANTINED"
              ? "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30"
              : "bg-muted/40 text-muted-foreground border-border hover:bg-muted/60"
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
          Quarantined {quarantinedCount}
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("OFFLINE")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
            statusFilter === "OFFLINE"
              ? "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30"
              : "bg-muted/40 text-muted-foreground border-border hover:bg-muted/60"
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
          Offline {offlineCount}
        </button>
      </div>

      {/* Compact operator controls */}
      <div className="px-6 pb-4 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={handlePauseAll}>
          <Pause className="h-3 w-3 mr-1" />
          Pause Squad
        </Button>
        <Button
          size="sm"
          className="h-7 text-xs bg-primary hover:bg-primary/85 text-white"
          onClick={async () => {
            try {
              const r = await resumeAll({ projectId: projectId ?? undefined, reason: "Operator resume", userId: "operator" });
              toast(`Resumed ${(r as { resumed: number }).resumed} agent(s)`);
            } catch (e) {
              toast(e instanceof Error ? e.message : "Failed", true);
            }
          }}
        >
          <Play className="h-3 w-3 mr-1" />
          Resume Squad
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={async () => {
            try {
              const r = await resetAll({ projectId: projectId ?? undefined });
              toast(`Reset ${(r as { resetCount: number }).resetCount} agent(s)`);
            } catch (e) {
              toast(e instanceof Error ? e.message : "Failed", true);
            }
          }}
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset Quarantined/Offline
        </Button>
      </div>

      {/* Search + filters */}
      <div className="px-6 pb-4">
        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-input bg-background py-1.5 pl-8 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      {/* 2-column agent grid */}
      <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAgents.map((agent) => {
          const lastHB = agent.lastHeartbeatAt ? formatRelativeTime(agent.lastHeartbeatAt) : "Never";
          const aCount = taskCountByAgent.get(agent._id) ?? 0;
          const remaining = agent.budgetDaily - agent.spendToday;
          const budgetPct = Math.min(100, (agent.spendToday / Math.max(agent.budgetDaily, 0.01)) * 100);
          const cfg = STATUS_CONFIG[agent.status] ?? STATUS_CONFIG.OFFLINE;
          const currentTask = agent.currentTaskId ? tasks.find((t) => t._id === agent.currentTaskId) : null;

          return (
            <Card key={agent._id} className="p-4 hover:shadow-md transition-shadow flex flex-col">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-muted border border-border flex items-center justify-center text-lg shrink-0">
                    {agent.emoji || "🤖"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground leading-tight truncate">{agent.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{agent.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={cn("h-2 w-2 rounded-full", cfg.dotClass, agent.status === "ACTIVE" && "animate-pulse")} />
                  <Badge variant="outline" className={cn("text-[10px] font-semibold px-2 py-0", cfg.className)}>
                    {cfg.label}
                  </Badge>
                </div>
              </div>

              {/* Budget bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                  <span>Budget</span>
                  <span className={cn("font-medium tabular-nums", remaining < 1 ? "text-red-500" : "text-foreground/80")}>
                    ${agent.spendToday.toFixed(2)} / ${agent.budgetDaily.toFixed(2)}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      budgetPct >= 90 ? "bg-red-500" : budgetPct >= 70 ? "bg-amber-500" : "bg-primary"
                    )}
                    style={{ width: `${budgetPct}%` }}
                  />
                </div>
              </div>

              {currentTask && (
                <p className="text-xs text-muted-foreground truncate mb-1" title={currentTask.title}>
                  Task: {currentTask.title}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground/70 flex items-center gap-1 mb-3">
                <Clock className="h-2.5 w-2.5" />
                Last heartbeat {lastHB}
              </p>

              <div className="flex flex-wrap gap-1.5 pt-3 border-t border-border mt-auto">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs px-2 mr-auto"
                  onClick={() => setSettingsAgent(agent)}
                  title="Agent settings"
                >
                  <Settings className="h-3 w-3" />
                </Button>
                {[
                  { label: "Activate", s: "ACTIVE" },
                  { label: "Pause", s: "PAUSED" },
                  { label: "Drain", s: "DRAINED" },
                ].map(({ label, s }) => (
                  <Button
                    key={s}
                    size="sm"
                    variant="outline"
                    disabled={agent.status === s}
                    onClick={() => setStatus(agent, s, `Operator ${label.toLowerCase()}d agent`)}
                    className="h-7 text-xs px-2"
                  >
                    {label}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={agent.status === "QUARANTINED"}
                  onClick={() => setStatus(agent, "QUARANTINED", "Operator quarantined agent")}
                  className="h-7 text-xs px-2 border-red-500/40 text-red-600 hover:bg-red-500/10 dark:text-red-400"
                >
                  <AlertTriangle className="h-3 w-3 mr-0.5" />
                  Quarantine
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredAgents.length === 0 && (
        <div className="px-6 pb-6 text-center py-12">
          <p className="text-muted-foreground text-sm mb-4">
            {agents.length === 0 ? "No agents registered yet." : "No agents match the current filters."}
          </p>
          {agents.length === 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {onOpenCreateAgent && (
                <Button onClick={onOpenCreateAgent}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first agent
                </Button>
              )}
              <Button variant="outline" onClick={() => setDiscoverOpen(true)}>
                <Activity className="h-4 w-4 mr-2" />
                Discover agents
              </Button>
            </div>
          )}
        </div>
      )}

      {settingsAgent && (
        <AgentSettingsPanel
          agent={settingsAgent}
          open={!!settingsAgent}
          onClose={() => setSettingsAgent(null)}
          onNavigateToIdentity={() => {
            setSettingsAgent(null);
            onNavigateToIdentity?.();
          }}
          onDelete={(agentId) => {
            setConfirmState({
              open: true,
              title: "Delete agent",
              description: "Agent removal (Gateway + Convex/ARM cleanup) is not yet implemented. Use OpenClaw Studio or Gateway to remove the agent.",
              danger: true,
              onConfirm: () => {
                setConfirmState(null);
                setSettingsAgent(null);
                toast("Agent deletion not yet implemented.", true);
              },
            });
          }}
        />
      )}

      {/* Confirmation dialog */}
      <Dialog open={!!confirmState?.open} onOpenChange={(open) => !open && setConfirmState(null)}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{confirmState?.title}</DialogTitle>
            <DialogDescription>{confirmState?.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmState(null)}>
              Cancel
            </Button>
            <Button
              variant={confirmState?.danger ? "destructive" : "default"}
              onClick={() => confirmState?.onConfirm()}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
