import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { useToast } from "./Toast";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "./components/PageHeader";
import { DiscoverAgentsModal } from "./DiscoverAgentsModal";
import {
  Bot, Activity, ShieldAlert, ListTodo, Clock, Cpu, Wrench, DollarSign, AlertTriangle, Radio,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  ACTIVE:      { label: "Active",      className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
  PAUSED:      { label: "Paused",      className: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30" },
  DRAINED:     { label: "Drained",     className: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30" },
  QUARANTINED: { label: "Quarantined", className: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30" },
  OFFLINE:     { label: "Offline",     className: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30" },
};

export function AgentRegistryView({ projectId }: { projectId: Id<"projects"> | null }) {
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const agents = useQuery(api.agents.listAll, projectId ? { projectId } : {});
  const tasks  = useQuery(api.tasks.listAll,  projectId ? { projectId } : {});
  const updateStatus = useMutation(api.agents.updateStatus);
  const pauseAll     = useMutation(api.agents.pauseAll);
  const resumeAll    = useMutation(api.agents.resumeAll);
  const resetAll     = useMutation(api.agents.resetAll);
  const { toast }    = useToast();

  const taskCountByAgent = useMemo(() => {
    const map = new Map<Id<"agents">, number>();
    if (!tasks) return map;
    for (const task of tasks)
      for (const id of task.assigneeIds)
        map.set(id, (map.get(id) ?? 0) + 1);
    return map;
  }, [tasks]);

  if (!agents || !tasks) {
    return (
      <main className="flex-1 overflow-auto p-6">
        <div className="h-6 w-40 rounded skeleton-shimmer mb-2" />
        <div className="h-4 w-56 rounded skeleton-shimmer" />
      </main>
    );
  }

  const activeCount      = agents.filter((a) => a.status === "ACTIVE").length;
  const quarantinedCount = agents.filter((a) => a.status === "QUARANTINED").length;
  const assignedCount    = tasks.filter((t) => t.assigneeIds.length > 0).length;

  async function setStatus(agent: Doc<"agents">, status: string, reason: string) {
    const isDangerous = status === "QUARANTINED" || status === "DRAINED";
    if (isDangerous && !window.confirm(`Set ${agent.name} to ${status}?`)) return;
    try {
      await updateStatus({ agentId: agent._id, status, reason });
      toast(`${agent.name} → ${status}`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Status update failed", true);
    }
  }

  return (
    <main className="flex-1 overflow-auto">
      <PageHeader
        title="Agent Registry"
        description={`${agents.length} agents · ${activeCount} active`}
        actions={
          <Button size="sm" variant="outline" onClick={() => setDiscoverOpen(true)}>
            <Radio className="h-3.5 w-3.5 mr-1.5" />
            Discover agents
          </Button>
        }
      />
      <DiscoverAgentsModal
        projectId={projectId}
        open={discoverOpen}
        onClose={() => setDiscoverOpen(false)}
        onImported={() => toast("Agent imported")}
      />

      {/* Stats */}
      <div className="px-6 pb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Bot}         label="Total Agents"    value={agents.length} />
        <StatCard icon={Activity}    label="Active"          value={activeCount}      accent="text-emerald-500" />
        <StatCard icon={ShieldAlert} label="Quarantined"     value={quarantinedCount} accent="text-red-500" />
        <StatCard icon={ListTodo}    label="Assigned Tasks"  value={assignedCount} />
      </div>

      {/* Operator controls */}
      <div className="px-6 pb-4">
        <Card className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Operator Controls
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="destructive"
              onClick={async () => {
                if (!window.confirm("Pause all active agents?")) return;
                try {
                  const r = await pauseAll({ projectId: projectId ?? undefined, reason: "Operator pause", userId: "operator" });
                  toast(`Paused ${(r as { paused: number }).paused} agent(s)`);
                } catch (e) { toast(e instanceof Error ? e.message : "Failed", true); }
              }}>
              Pause Squad
            </Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={async () => {
                try {
                  const r = await resumeAll({ projectId: projectId ?? undefined, reason: "Operator resume", userId: "operator" });
                  toast(`Resumed ${(r as { resumed: number }).resumed} agent(s)`);
                } catch (e) { toast(e instanceof Error ? e.message : "Failed", true); }
              }}>
              Resume Squad
            </Button>
            <Button size="sm" variant="outline"
              onClick={async () => {
                try {
                  const r = await resetAll({ projectId: projectId ?? undefined });
                  toast(`Reset ${(r as { resetCount: number }).resetCount} agent(s)`);
                } catch (e) { toast(e instanceof Error ? e.message : "Failed", true); }
              }}>
              Reset Quarantined/Offline
            </Button>
          </div>
        </Card>
      </div>

      {/* Agent cards */}
      <div className="px-6 pb-6 flex flex-col gap-3">
        {agents.map((agent) => {
          const lastHB   = agent.lastHeartbeatAt ? new Date(agent.lastHeartbeatAt).toLocaleString() : "Never";
          const aCount   = taskCountByAgent.get(agent._id) ?? 0;
          const remaining = agent.budgetDaily - agent.spendToday;
          const cfg      = STATUS_CONFIG[agent.status] ?? STATUS_CONFIG.OFFLINE;

          return (
            <Card key={agent._id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-muted border border-border flex items-center justify-center text-xl shrink-0">
                    {agent.emoji || "🤖"}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground leading-tight">{agent.name}</p>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{agent.role}</p>
                  </div>
                </div>
                <Badge variant="outline" className={cn("text-[11px] font-semibold px-2.5 py-0.5", cfg.className)}>
                  {cfg.label}
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4 p-3 rounded-lg bg-muted/40 border border-border/50">
                <AgentField icon={Cpu}      label="Capabilities" value={agent.allowedTaskTypes.length ? agent.allowedTaskTypes.join(", ") : "All types"} />
                <AgentField icon={Wrench}   label="Tools"        value={agent.allowedTools?.length ? agent.allowedTools.join(", ") : "Default toolset"} />
                <AgentField icon={Clock}    label="Last Heartbeat" value={lastHB} />
                <AgentField icon={ListTodo} label="Assigned"     value={String(aCount)} />
                <AgentField icon={DollarSign} label="Spend / Budget" value={`$${agent.spendToday.toFixed(2)} / $${agent.budgetDaily.toFixed(2)}`} />
                <AgentField icon={DollarSign} label="Remaining"  value={`$${remaining.toFixed(2)}`} accent={remaining < 1 ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"} />
              </div>

              <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
                {[
                  { label: "Activate", s: "ACTIVE" },
                  { label: "Pause",    s: "PAUSED" },
                  { label: "Drain",    s: "DRAINED" },
                ].map(({ label, s }) => (
                  <Button key={s} size="sm" variant="outline"
                    disabled={agent.status === s}
                    onClick={() => setStatus(agent, s, `Operator ${label.toLowerCase()}d agent`)}
                    className="h-7 text-xs">
                    {label}
                  </Button>
                ))}
                <Button size="sm" variant="outline"
                  disabled={agent.status === "QUARANTINED"}
                  onClick={() => setStatus(agent, "QUARANTINED", "Operator quarantined agent")}
                  className="h-7 text-xs border-red-500/40 text-red-600 hover:bg-red-500/10 dark:text-red-400">
                  <AlertTriangle className="h-3 w-3 mr-1" />Quarantine
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </main>
  );
}

function StatCard({ icon: Icon, label, value, accent = "text-foreground" }: {
  icon: React.ElementType; label: string; value: number | string; accent?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <p className={cn("text-2xl font-bold tracking-tight", accent)}>{value}</p>
    </Card>
  );
}

function AgentField({ icon: Icon, label, value, accent }: {
  icon: React.ElementType; label: string; value: string; accent?: string;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1 mb-0.5">
        <Icon className="h-2.5 w-2.5 text-muted-foreground/60" strokeWidth={1.5} />
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium">{label}</p>
      </div>
      <p className={cn("text-xs text-foreground/80 truncate", accent)}>{value}</p>
    </div>
  );
}
