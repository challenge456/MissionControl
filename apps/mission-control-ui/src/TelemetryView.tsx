import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "./components/PageHeader";
import { useToast } from "./Toast";
import { cn } from "@/lib/utils";
import { Activity, Zap, Filter, Radio, AlertTriangle, CheckCircle2, Play } from "lucide-react";

function fmtTime(ts?: number) {
  if (!ts) return "n/a";
  return new Date(ts).toLocaleString();
}

function compactJson(value: unknown) {
  if (value === undefined || value === null) return "n/a";
  const s = JSON.stringify(value);
  return s.length <= 100 ? s : `${s.slice(0, 100)}…`;
}

function eventPillClass(type: string) {
  if (type.includes("FAILED") || type.includes("BLOCKED"))
    return "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30";
  if (type.includes("STARTED") || type.includes("STEP"))
    return "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30";
  if (type.includes("COMPLETED") || type.includes("DONE"))
    return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
  if (type.includes("DECISION"))
    return "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30";
  return "bg-muted text-muted-foreground border-border";
}

function EventTypePill({ value }: { value: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap", eventPillClass(value))}>
      {value}
    </span>
  );
}

export function TelemetryView({ projectId }: { projectId: Id<"projects"> | null }) {
  const { toast } = useToast();
  const [typeFilter, setTypeFilter] = useState("");
  const [windowMinutes, setWindowMinutes] = useState(60);

  const agents = useQuery(api.agents.listAll, projectId ? { projectId } : {});
  const events = useQuery(api["operations/opEvents"].listOpEvents, {
    projectId: projectId ?? undefined,
    type: typeFilter || undefined,
    limit: 200,
  });
  const stats = useQuery(api["operations/opEvents"].getOpEventStats, {
    projectId: projectId ?? undefined,
    windowMinutes,
  });
  const evaluateWithARM = useMutation(api.policy.evaluateWithARM);

  const handleEmitTestEvent = async () => {
    const agent = (agents ?? [])[0];
    if (!agent) { toast("No agents available to emit telemetry.", true); return; }
    try {
      await evaluateWithARM({
        agentId: agent._id,
        actionType: "TOOL_CALL",
        toolName: "shell",
        toolArgs: { command: "echo telemetry_probe" },
        context: { source: "telemetry.ui" },
      });
      toast("Telemetry probe emitted via ARM policy evaluator.");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to emit telemetry probe", true);
    }
  };

  const topTypes: { type: string; count: number }[] = stats?.topTypes ?? [];
  const totalEvents = stats?.total ?? 0;
  const inWindow    = stats?.inWindow ?? 0;

  return (
    <main className="flex-1 overflow-auto">
      <PageHeader
        title="ARM Telemetry"
        description="Operational events stream for runs, tool calls, workflow steps, and decision traces."
        actions={
          <Button size="sm" onClick={handleEmitTestEvent} variant="outline">
            <Zap className="h-3.5 w-3.5 mr-1.5" />
            Emit Test Event
          </Button>
        }
      />

      {/* Summary stats */}
      <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Activity,     label: "Total Events",     value: totalEvents,             accent: "text-foreground" },
          { icon: Radio,        label: `Last ${windowMinutes}m`, value: inWindow,          accent: inWindow > 0 ? "text-blue-500" : "text-foreground" },
          { icon: Filter,       label: "Filtered Rows",    value: (events ?? []).length,   accent: "text-foreground" },
          { icon: CheckCircle2, label: "Latest Event",     value: stats?.latestTimestamp ? 1 : 0, accent: "text-emerald-500" },
        ].map(({ icon: Icon, label, value, accent }) => (
          <Card key={label} className="p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
            </div>
            <p className={cn("text-2xl font-bold tracking-tight tabular-nums", accent)}>{value}</p>
          </Card>
        ))}
      </div>

      <div className="px-6 pb-4 flex flex-col gap-4">
        {/* Filters + Event type breakdown */}
        <Card className="overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Event Type Breakdown</p>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="h-3 w-3 text-muted-foreground" />
                <input
                  className="rounded-md border border-border bg-background px-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring w-36"
                  placeholder="Filter type…"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                />
              </div>
              <select
                className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={windowMinutes}
                onChange={(e) => setWindowMinutes(Number(e.target.value))}
              >
                <option value={15}>Last 15m</option>
                <option value={60}>Last 60m</option>
                <option value={240}>Last 4h</option>
                <option value={1440}>Last 24h</option>
              </select>
            </div>
          </div>
          <div className="p-4">
            {topTypes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No events captured yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {topTypes.map((row) => (
                  <div key={row.type} className="rounded-lg border border-border bg-muted/40 px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1 truncate">{row.type}</p>
                    <p className="text-xl font-bold text-foreground tabular-nums">{row.count}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Recent events table */}
        <Card className="overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-muted/30">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent Events</p>
          </div>
          {(events ?? []).length === 0 ? (
            <div className="py-12 text-center">
              <Activity className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No op events found.</p>
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full min-w-[960px] text-left text-xs">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    {["Timestamp", "Type", "Run", "Instance", "Version", "Payload"].map((h) => (
                      <th key={h} className="px-3 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(events ?? []).map((event, i) => (
                    <tr
                      key={event._id}
                      className={cn(
                        "border-b border-border/50 hover:bg-muted/40 transition-colors",
                        i % 2 !== 0 ? "bg-muted/20" : ""
                      )}
                    >
                      <td className="px-3 py-2.5 font-mono text-muted-foreground whitespace-nowrap">{fmtTime(event.timestamp)}</td>
                      <td className="px-3 py-2.5"><EventTypePill value={event.type} /></td>
                      <td className="px-3 py-2.5 font-mono text-muted-foreground truncate max-w-[120px]">{event.runId ?? "n/a"}</td>
                      <td className="px-3 py-2.5 font-mono text-muted-foreground truncate max-w-[120px]">{event.instanceId ?? "n/a"}</td>
                      <td className="px-3 py-2.5 font-mono text-muted-foreground truncate max-w-[120px]">{event.versionId ?? "n/a"}</td>
                      <td className="px-3 py-2.5 text-muted-foreground/80 truncate max-w-[240px] font-mono">{compactJson(event.payload)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
