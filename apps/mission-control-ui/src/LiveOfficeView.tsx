/**
 * Live Office — 2D view of Mission Control agents
 * Workstations for agents currently working; Break Room for idle/paused/offline.
 */

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import type { Id, Doc } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { PageHeader } from "./components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Coffee, Droplets, Bot, ListChecks, Building2, Waves } from "lucide-react";

interface LiveOfficeViewProps {
  projectId: Id<"projects"> | null;
}

const WORKSTATION_SLOTS = 6;
const BREAK_ROOM_COLORS = ["bg-pink-500/90", "bg-violet-500/90", "bg-blue-500/90", "bg-amber-500/90", "bg-emerald-500/90"];

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function LiveOfficeView({ projectId }: LiveOfficeViewProps) {
  const agents = useQuery(api.agents.list, { projectId: projectId ?? undefined });
  const tasks = useQuery(api.tasks.list, { projectId: projectId ?? undefined });
  const activities = useQuery(
    api.activities.listRecent,
    projectId ? { projectId, limit: 12 } : { limit: 12 }
  );
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 10_000);
    return () => clearInterval(interval);
  }, []);

  const { working, onBreak } = useMemo(() => {
    if (!agents) {
      return { working: [] as { agent: Doc<"agents">; currentTask: Doc<"tasks"> | null | undefined }[], onBreak: [] as { agent: Doc<"agents">; currentTask: Doc<"tasks"> | null | undefined }[] };
    }
    const withTasks = agents.map((agent) => {
      const currentTask = agent.currentTaskId
        ? tasks?.find((t) => t._id === agent.currentTaskId)
        : null;
      return { agent, currentTask };
    });
    const workingList = withTasks.filter(
      (x) => x.agent.status === "ACTIVE" && x.currentTask
    );
    const onBreakList = withTasks.filter(
      (x) => x.agent.status !== "ACTIVE" || !x.currentTask
    );
    return { working: workingList, onBreak: onBreakList };
  }, [agents, tasks]);

  const workingCount = working.length;
  const onBreakCount = onBreak.length;

  if (agents === undefined) {
    return (
      <main className="mc-page" role="region" aria-label="Live Office">
        <div className="mc-page-body">
          <div className="h-[620px] rounded-2xl border border-[var(--panel-line)] skeleton-shimmer" />
        </div>
      </main>
    );
  }

  return (
    <main
      className="mc-page"
      role="region"
      aria-label="Live Office"
      data-testid="live-office-view"
    >
      <PageHeader
        title="Live Office"
        description="A spatial view of active desks, idle agents, and recent motion across the office floor."
        eyebrow="Comms"
        icon={<Building2 className="h-4.5 w-4.5" strokeWidth={1.7} />}
        status={
          <Badge variant="outline" className="border-cyan-300/20 text-cyan-100">
            {workingCount} working / {onBreakCount} on break
          </Badge>
        }
      />

      <div className="mc-page-body mc-page-stack min-h-0">
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4">
            <div className="mc-kicker">Working desks</div>
            <div className="mt-2 text-3xl font-semibold text-cyan-100">{workingCount}</div>
            <div className="mt-1 text-xs text-muted-foreground">Desks currently attached to active task execution</div>
          </Card>
          <Card className="p-4">
            <div className="mc-kicker">Break room</div>
            <div className="mt-2 text-3xl font-semibold text-foreground">{onBreakCount}</div>
            <div className="mt-1 text-xs text-muted-foreground">Agents waiting, paused, offline, or otherwise detached from work</div>
          </Card>
          <Card className="p-4">
            <div className="mc-kicker">Recent activity</div>
            <div className="mt-2 text-3xl font-semibold text-foreground">{activities?.length ?? 0}</div>
            <div className="mt-1 text-xs text-muted-foreground">Latest recorded events available for visual context</div>
          </Card>
          <Card className="p-4">
            <div className="mc-kicker">Clock</div>
            <div className="mt-2 text-3xl font-semibold text-foreground">
              {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">Local operator time for reading the office state</div>
          </Card>
        </div>

        <div className="grid min-h-0 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Card className="min-h-0 overflow-hidden p-0">
            <div className="flex min-h-0 flex-col">
              <div className="border-b border-[var(--panel-line)] px-5 py-4">
                <div className="mc-kicker">Office floor</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Use the floor plan to understand who is actually busy, who is parked, and whether the execution surface feels balanced.
                </div>
              </div>

              {/* Left: Office canvas (orchestrator + workstations + break room) */}
              <div className="flex-1 flex flex-col min-w-0 overflow-auto p-4 md:p-6">
          {/* Orchestrator */}
                <div className="flex justify-center mb-4 shrink-0">
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 rounded-xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-4 py-3 shadow-[var(--card-shadow)]"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-400/8 text-cyan-100 shadow-[var(--glow-cyan)]">
                      <Bot className="w-5 h-5" aria-hidden />
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Mission Control
                      </div>
                      <div className="text-sm font-medium text-foreground">
                        Orchestrating the team
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Workstations + Break Room in a responsive grid */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-4 lg:gap-6 min-h-0">
            {/* Workstations — fixed 2x3 grid with min height so it always shows */}
                  <section aria-label="Workstations" className="min-h-[320px]">
              <div className="grid grid-cols-2 grid-rows-3 gap-3 sm:gap-4">
                {Array.from({ length: WORKSTATION_SLOTS }).map((_, i) => {
                  const slot = working[i];
                  return (
                    <motion.article
                      key={i}
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={cn(
                        "rounded-xl border-2 flex flex-col overflow-hidden min-h-[120px]",
                        slot
                          ? "border-primary/40 bg-primary/5 shadow-md shadow-primary/5"
                          : "border-[var(--panel-line)] bg-[color:var(--shell-panel)]"
                      )}
                    >
                      <div className="flex-1 flex flex-col p-2 min-h-0">
                        {/* Monitor area */}
                        <div
                          className={cn(
                            "flex-1 min-h-[80px] rounded-lg border-2 flex flex-col overflow-hidden",
                            slot ? "border-primary/30 bg-background" : "border-border bg-muted/30"
                          )}
                        >
                          {slot ? (
                            <>
                              <div className="p-1.5 sm:p-2 flex items-center gap-2 border-b border-[var(--panel-line)] shrink-0">
                                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 border-primary/50 bg-primary/20 text-primary shrink-0">
                                  {slot.agent.emoji || slot.agent.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-semibold text-foreground truncate">
                                    {slot.agent.name}
                                  </div>
                                  <div className="text-[10px] text-primary font-medium truncate">
                                    Working
                                  </div>
                                </div>
                                <motion.span
                                  animate={{ opacity: [0.4, 1, 0.4] }}
                                  transition={{ repeat: Infinity, duration: 1.5 }}
                                  className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"
                                  aria-hidden
                                />
                              </div>
                              <div className="p-1.5 sm:p-2 flex-1 min-h-0 overflow-hidden">
                                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                                  Current task
                                </div>
                                <div className="text-xs font-medium text-foreground line-clamp-2">
                                  {slot.currentTask?.title ?? "—"}
                                </div>
                                <div className="mt-1 h-0.5 rounded bg-primary/20 overflow-hidden">
                                  <motion.div
                                    animate={{ x: ["-100%", "150%"] }}
                                    transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                                    className="w-1/3 h-full bg-primary/50 rounded"
                                    aria-hidden
                                  />
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="flex-1 flex items-center justify-center min-h-[80px] text-muted-foreground/50">
                              <span className="text-xs">Empty desk</span>
                            </div>
                          )}
                        </div>
                        <div className="h-1 mt-1 rounded bg-amber-900/40 border border-amber-800/30 shrink-0" aria-hidden />
                      </div>
                    </motion.article>
                  );
                })}
              </div>
                  </section>

            {/* Break Room */}
                  <section aria-label="Break Room" className="lg:max-w-[240px] shrink-0">
              <div className="rounded-xl border-2 border-dashed border-blue-500/40 bg-blue-500/5 p-3 min-h-[200px] flex flex-col">
                <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-2 shrink-0">
                  <Coffee className="w-3.5 h-3.5" aria-hidden />
                  Break Room
                </div>
                <div className="flex gap-2 mb-2 shrink-0">
                  <div className="w-7 h-7 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center" aria-hidden>
                    <Coffee className="w-3.5 h-3.5 text-red-400" />
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center" aria-hidden>
                    <Droplets className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                </div>
                <div className="flex-1 flex flex-wrap content-start gap-2 overflow-auto min-h-0">
                  <AnimatePresence mode="popLayout">
                    {onBreak.map(({ agent }, idx) => (
                      <motion.div
                        key={agent._id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={cn(
                          "flex items-center gap-2 px-2 py-1.5 rounded-lg border bg-card shadow-sm shrink-0",
                          agent.status === "ACTIVE" && "border-blue-500/30 bg-blue-500/5",
                          agent.status === "PAUSED" && "border-amber-500/30 bg-amber-500/5",
                          agent.status === "OFFLINE" && "opacity-75 border-border"
                        )}
                      >
                        <div
                          className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0",
                            BREAK_ROOM_COLORS[idx % BREAK_ROOM_COLORS.length]
                          )}
                        >
                          {agent.emoji || agent.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 max-w-[100px]">
                          <div className="text-xs font-semibold text-foreground truncate leading-tight">
                            {agent.name}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {agent.status === "ACTIVE" ? "Idle" : agent.status}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
                  </section>
                </div>
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="overflow-hidden p-0">
              <div className="border-b border-[var(--panel-line)] px-4 py-3 flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-muted-foreground" aria-hidden />
                <span className="mc-kicker">Recent activity</span>
              </div>
              <div className="max-h-[420px] overflow-auto p-3">
                {activities === undefined ? (
                  <div className="rounded-lg border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-4 py-6 text-sm text-muted-foreground">
                    Loading recent activity…
                  </div>
                ) : activities.length === 0 ? (
                  <EmptyState
                    icon={Waves}
                    title="No recent activity"
                    description="Live Office becomes more useful once the activity stream has events to anchor what you’re seeing."
                    className="px-4 py-10"
                  />
                ) : (
                  <ul className="space-y-2" role="list">
                    {activities.map((act) => {
                      const created =
                        "_creationTime" in act && typeof (act as { _creationTime?: number })._creationTime === "number"
                          ? (act as { _creationTime: number })._creationTime
                          : Date.now();
                      return (
                        <li
                          key={act._id}
                          className="rounded-lg border border-[var(--panel-line)] bg-[color:var(--shell-panel)] p-3 text-xs"
                        >
                          <div className="mb-0.5 text-muted-foreground">{formatTime(created)}</div>
                          <div className="line-clamp-2 text-foreground">{act.description}</div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </Card>

            <Card className="p-5">
              <div className="mc-kicker">Operator guidance</div>
              <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted-foreground">
                <div className="rounded-xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-4 py-4">
                  Live Office is for situational awareness, not deep diagnostics. If something looks off here, drill into Office or System.
                </div>
                <div className="rounded-xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-4 py-4">
                  A healthy floor should show a believable balance between active desks and deliberate idle time, not constant saturation.
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <footer className="border-t border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-5 py-3 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary" aria-hidden />
            {workingCount} working
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" aria-hidden />
            {onBreakCount} on break
          </span>
          <time className="ml-auto tabular-nums" dateTime={new Date().toISOString()}>
            {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" })}
          </time>
        </div>
      </footer>
    </main>
  );
}
