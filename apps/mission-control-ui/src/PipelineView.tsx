import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { MainView } from "./TopNav";
import { PageHeader } from "./components/PageHeader";
import { Card } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { cn } from "@/lib/utils";
import { getBuildPipelineStages, getCurrentBuildStage } from "@/lib/buildPipeline";
import { getOrchestrationBaseUrl } from "@/lib/orchestrationUrl";
import {
  GitBranch,
  ArrowRight,
  Users,
  FileText,
  LayoutTemplate,
  MonitorSmartphone,
  Database,
  Rocket,
} from "lucide-react";

interface PipelineViewProps {
  projectId: Id<"projects"> | null;
  onNavigate: (view: MainView) => void;
}

const STAGE_ICONS = {
  actors: Users,
  prd: FileText,
  architecture: LayoutTemplate,
  prototype: MonitorSmartphone,
  backend: Database,
  launch: Rocket,
} as const;

export function PipelineView({ projectId, onNavigate }: PipelineViewProps) {
  const [gatewayConfigured, setGatewayConfigured] = useState<boolean | null>(null);
  const [focusLens, setFocusLens] = useState<"design" | "build" | "launch">("design");
  const missionData = useQuery(api.mission.getMission, projectId ? { projectId } : {});
  const agents = useQuery(api.agents.listAll, projectId ? { projectId } : {});
  const tasks = useQuery(api.tasks.listAll, projectId ? { projectId } : {});
  const approvals = useQuery(api.approvals.listPending, projectId ? { projectId, limit: 100 } : { limit: 100 });

  useEffect(() => {
    let cancelled = false;
    const base = getOrchestrationBaseUrl();
    fetch(base ? `${base}/gateway/status` : "/gateway/status")
      .then((response) => response.json())
      .then((data: { configured?: boolean; urlConfigured?: boolean; tokenConfigured?: boolean }) => {
        if (!cancelled) {
          setGatewayConfigured(Boolean(data.configured ?? (data.urlConfigured && data.tokenConfigured)));
        }
      })
      .catch(() => {
        if (!cancelled) setGatewayConfigured(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const isLoading = !agents || !tasks || !approvals;

  const stages = useMemo(() => {
    if (!agents || !tasks || !approvals) return [];
    return getBuildPipelineStages({
      hasMission: Boolean(missionData?.missionStatement?.trim()),
      taskCount: tasks.length,
      activeAgents: agents.filter((agent) => agent.status === "ACTIVE").length,
      gatewayConfigured,
      approvalsCount: approvals.length,
    });
  }, [agents, approvals, gatewayConfigured, missionData?.missionStatement, tasks]);

  const currentStage = stages.length > 0 ? getCurrentBuildStage(stages) : null;
  const playbooks = [
    {
      title: "Actor-first brief",
      lens: "design" as const,
      detail: "Clarify who uses the system, what they see first, and what they cannot do before naming more features.",
      actionLabel: "Open home",
      onClick: () => onNavigate("home"),
    },
    {
      title: "PRD and architecture pass",
      lens: "design" as const,
      detail: "Use documentation and the build pipeline to lock the PRD and architecture.md before the prototype expands.",
      actionLabel: "Open docs",
      onClick: () => onNavigate("docs"),
    },
    {
      title: "Prototype review",
      lens: "build" as const,
      detail: "Review the frontend in a high-fidelity state with mock data and get a yes before backend complexity grows.",
      actionLabel: "Open projects",
      onClick: () => onNavigate("projects"),
    },
    {
      title: "Backend readiness",
      lens: "build" as const,
      detail: "Shape API, schema, auth, billing, and integration work only after the prototype is accepted.",
      actionLabel: "Open build pipeline",
      onClick: () => onNavigate("pipeline"),
    },
    {
      title: "Launch gate",
      lens: "launch" as const,
      detail: "Audit approvals, notifications, auth, and monitoring so the system feels trustworthy before users arrive.",
      actionLabel: "Open feedback",
      onClick: () => onNavigate("feedback"),
    },
  ];
  const focusRecommendations = {
    design: [
      "Use root `design.md` and the mission brief to keep visual direction explicit.",
      "Steal patterns from references, not entire layouts.",
      "Make prototype approval a hard gate before backend work.",
    ],
    build: [
      "Generate API and schema shape from the approved frontend and docs.",
      "Keep shadcn as the implementation base so interactions are real, not static exports.",
      "Use the operator queue on home to spot drift between prototype and execution.",
    ],
    launch: [
      "Treat auth, payments, alerts, and auditability as launch requirements, not post-launch polish.",
      "Use approvals and feedback views as final trust checks.",
      "Promote only the features that help operators act with confidence.",
    ],
  } as const;
  const readinessMatrix = stages.map((stage) => ({
    id: stage.id,
    label: stage.label,
    artifact: stage.artifact,
    status: stage.status,
    note:
      stage.status === "done"
        ? "Locked enough to build on."
        : stage.status === "active"
          ? "This is the current constraint on product quality."
          : "Do not expand scope before this becomes explicit.",
  }));

  if (isLoading) {
    return (
      <main className="mc-page">
        <div className="mc-page-body">
          <div className="h-[680px] rounded-2xl border border-[var(--panel-line)] skeleton-shimmer" />
        </div>
      </main>
    );
  }

  return (
    <main className="mc-page">
      <PageHeader
        title="Build Pipeline"
        description="Actor-first product development workflow. Move from mission and structure to prototype, backend, and launch without falling back to the old handoff ritual."
        icon={<GitBranch className="h-4.5 w-4.5" strokeWidth={1.7} />}
        status={
          currentStage ? (
            <Badge variant="outline" className="border-cyan-300/20 text-cyan-100">
              Current stage: {currentStage.label}
            </Badge>
          ) : undefined
        }
      />

      <div className="mc-page-body mc-page-stack">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <Card className="p-5">
            <div className="mc-kicker">Modern workflow</div>
            <div className="mt-2 text-xl font-semibold text-foreground">Prototype first. Backend second. Approval before complexity.</div>
            <div className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              This replaces the old design-to-code handoff with a single operator-visible loop: define actors, write the PRD, shape the flows, prototype with mock data, then generate the backend from the approved frontend and docs.
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {(["design", "build", "launch"] as const).map((lens) => (
                <button
                  key={lens}
                  type="button"
                  onClick={() => setFocusLens(lens)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition-all",
                    focusLens === lens
                      ? "border-cyan-300/20 bg-cyan-400/10 text-cyan-100 shadow-[var(--glow-cyan)]"
                      : "border-[var(--panel-line)] bg-[color:var(--shell-panel)] text-muted-foreground hover:text-foreground"
                  )}
                >
                  {lens} lens
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline" className="border-[var(--panel-line)] text-muted-foreground">
                `design.md` source of truth
              </Badge>
              <Badge variant="outline" className="border-cyan-300/20 text-cyan-100">
                Actor-first
              </Badge>
              <Badge variant="outline" className="border-emerald-300/20 text-emerald-100">
                Prototype before backend
              </Badge>
              <Badge variant="outline" className="border-amber-300/20 text-amber-100">
                Approval gates complexity
              </Badge>
            </div>
          </Card>

          <Card className="p-5">
            <div className="mc-kicker">Operator brief</div>
            <div className="mt-2 text-sm font-semibold text-foreground">
              {currentStage ? `${currentStage.label} is the next discipline to protect.` : "Build-stage guidance will appear here."}
            </div>
            <div className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {currentStage?.description ?? "No stage data available yet."}
            </div>
            {currentStage && (
              <div className="mt-4 rounded-xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Next artifact</div>
                <div className="mt-1 text-sm font-semibold text-foreground">{currentStage.artifact}</div>
                {currentStage.view && (
                  <Button className="mt-4" variant="neon-cyan" size="sm" onClick={() => onNavigate(currentStage.view as MainView)}>
                    Open relevant surface
                  </Button>
                )}
              </div>
            )}
            <div className="mt-4 rounded-xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-4 py-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Current lens
              </div>
              <div className="mt-1 text-sm font-semibold text-foreground">
                {focusLens === "design" ? "Design integrity" : focusLens === "build" ? "Build execution" : "Launch trust"}
              </div>
              <div className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {focusLens === "design"
                  ? "Keep actors, visual intent, and prototype quality explicit before implementation expands."
                  : focusLens === "build"
                    ? "Translate approved structure into real product behavior without creating drift."
                    : "Use readiness gates so the app feels trustworthy the first time a user touches it."}
              </div>
            </div>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)]">
          <Card className="overflow-hidden">
            <div className="border-b border-[var(--panel-line)] px-5 py-4">
              <div className="mc-kicker">Pipeline stages</div>
              <div className="mt-1 text-sm font-semibold text-foreground">The six-stage build loop</div>
            </div>
            <div className="space-y-3 p-4">
              {stages.map((stage, index) => {
                const Icon = STAGE_ICONS[stage.id];
                return (
                  <div key={stage.id} className="relative">
                    <button
                      type="button"
                      onClick={() => stage.view && onNavigate(stage.view as MainView)}
                      className={cn(
                        "w-full rounded-2xl border px-4 py-4 text-left transition-all",
                        stage.status === "done" && "border-emerald-300/20 bg-emerald-400/8",
                        stage.status === "active" && "border-cyan-300/20 bg-cyan-400/10 shadow-[var(--glow-cyan)]",
                        stage.status === "todo" && "border-[var(--panel-line)] bg-[color:var(--shell-panel)] hover:border-[var(--panel-line-strong)]"
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-cyan-300/18 bg-cyan-400/10 text-cyan-100">
                          <Icon className="h-4.5 w-4.5" strokeWidth={1.7} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="mc-kicker">{stage.eyebrow}</span>
                            <Badge
                              variant="outline"
                              className={cn(
                                stage.status === "done" && "border-emerald-300/20 text-emerald-100",
                                stage.status === "active" && "border-cyan-300/20 text-cyan-100",
                                stage.status === "todo" && "border-[var(--panel-line)] text-muted-foreground"
                              )}
                            >
                              {stage.status}
                            </Badge>
                          </div>
                          <div className="mt-2 text-sm font-semibold text-foreground">{stage.label}</div>
                          <div className="mt-1 text-sm leading-relaxed text-muted-foreground">{stage.description}</div>
                          <div className="mt-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                            Artifact: {stage.artifact}
                          </div>
                        </div>
                      </div>
                    </button>
                    {index < stages.length - 1 && (
                      <div className="pointer-events-none absolute bottom-[-14px] left-[22px] flex h-4.5 items-center text-cyan-200/35">
                        <ArrowRight className="h-3.5 w-3.5 rotate-90" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-5">
            <div className="mc-kicker">Artifacts and gates</div>
            <div className="mt-3 space-y-3">
              {[
                "Actors drive the interface. Features come after the actor and the first screen are clear.",
                "The PRD and architecture file should exist before the prototype expands beyond one-off prompts.",
                "Do not start backend shape until the mock-data prototype is approved.",
                "Launch means auth, approvals, billing, notifications, and real operator trust are in place.",
              ].map((item) => (
                <div key={item} className="rounded-xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                  {item}
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <Card className="p-5">
            <div className="mc-kicker">Playbooks</div>
            <div className="mt-2 text-sm font-semibold text-foreground">
              Stage-aware workflows for operating this build loop
            </div>
            <div className="mt-4 space-y-3">
              {playbooks.filter((playbook) => playbook.lens === focusLens).map((playbook) => (
                <div key={playbook.title} className="rounded-xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-4 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-foreground">{playbook.title}</div>
                      <div className="mt-1 text-sm leading-relaxed text-muted-foreground">{playbook.detail}</div>
                    </div>
                    <Button variant="outline" size="sm" onClick={playbook.onClick}>
                      {playbook.actionLabel}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="mc-kicker">Readiness matrix</div>
            <div className="mt-2 text-sm font-semibold text-foreground">
              See which artifacts are explicit and which are still creating drift
            </div>
            <div className="mt-4 space-y-3">
              {readinessMatrix.map((item) => (
                <div key={item.id} className="rounded-xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-foreground">{item.label}</div>
                      <div className="mt-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                        {item.artifact}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        item.status === "done" && "border-emerald-300/20 text-emerald-100",
                        item.status === "active" && "border-cyan-300/20 text-cyan-100",
                        item.status === "todo" && "border-[var(--panel-line)] text-muted-foreground"
                      )}
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <div className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.note}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-4 py-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Current recommendations
              </div>
              <div className="mt-3 space-y-2.5">
                {focusRecommendations[focusLens].map((item) => (
                  <div key={item} className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-100" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
