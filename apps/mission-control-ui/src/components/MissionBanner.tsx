import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Sparkles, Pencil, Target, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MissionBannerProps {
  projectId: Id<"projects"> | null;
  onEditClick: () => void;
  onReversePromptClick: () => void;
  brief?: {
    stageLabel: string;
    stageEyebrow: string;
    artifact: string;
    rule: string;
  };
  className?: string;
}

export function MissionBanner({ projectId, onEditClick, onReversePromptClick, brief, className }: MissionBannerProps) {
  const missionData = useQuery(api.mission.getMission, projectId ? { projectId } : {});

  if (!missionData) {
    return null;
  }

  const hasMission = !!missionData.missionStatement;
  const missionPreview = missionData.missionStatement?.trim() ?? "";
  const missionLead = missionPreview.split(/(?<=[.!?])\s+/)[0] ?? missionPreview;
  const missionSupport =
    missionPreview.length > missionLead.length
      ? missionPreview.slice(missionLead.length).trim()
      : "";
  const missionSupportPreview =
    missionSupport.length > 180 ? `${missionSupport.slice(0, 177).trimEnd()}...` : missionSupport;
  const compressedMission =
    missionPreview.length > 220 ? `${missionPreview.slice(0, 217).trimEnd()}...` : missionPreview;

  return (
    <Card className={cn("mb-6 overflow-hidden", className)}>
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(103,232,249,0.08),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.06),transparent_28%)]" />
        <div className="relative px-5 py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan-400/10 text-cyan-100 shadow-[var(--glow-cyan)]">
                <Target className="h-4.5 w-4.5" strokeWidth={1.65} />
              </div>
              <div className="min-w-0">
                <div className="mc-kicker">North star</div>
                <div className="mt-1 text-sm font-semibold text-foreground">
                  {hasMission ? "Operator brief" : "Set the mission"}
                </div>
              </div>
            </div>
            {hasMission && (
              <div className="hidden rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-100/80 md:inline-flex">
                Strategic source of truth
              </div>
            )}
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
            <div className="rounded-2xl border border-[var(--panel-line)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--shell-panel)_90%,transparent),color-mix(in_srgb,var(--background)_88%,transparent))] px-5 py-5">
              {hasMission ? (
                <>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Mission statement
                  </div>
                  <p className="mt-3 max-w-3xl font-[family:var(--font-display)] text-[1.18rem] leading-8 text-foreground/94">
                    {missionLead}
                  </p>
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                    {missionSupportPreview || compressedMission}
                  </p>
                </>
              ) : (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Give the system a concise, operator-trustworthy mission so every agent workflow starts from the same intent.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-4 py-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Mission check
              </div>
              <div className="mt-3 rounded-lg border border-[var(--panel-line)] bg-[color:var(--shell-panel-strong)] px-4 py-4">
                <div className="text-sm font-semibold text-foreground">Would I ship a screen under this mission?</div>
                <div className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Every new task, screen, and routing decision should still feel aligned with this statement. If not, the UI is drifting.
                </div>
              </div>
            </div>
          </div>

          {brief && (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-3.5 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {brief.stageEyebrow}
                </div>
                <div className="mt-1 text-sm font-semibold text-foreground">{brief.stageLabel}</div>
              </div>
              <div className="rounded-xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-3.5 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Next artifact
                </div>
                <div className="mt-1 text-sm font-semibold text-foreground">{brief.artifact}</div>
              </div>
              <div className="rounded-xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-3.5 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Operating rule
                </div>
                <div className="mt-1 text-sm leading-relaxed text-foreground/88">{brief.rule}</div>
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {hasMission && (
              <Button
                variant="neon-cyan"
                size="sm"
                onClick={onReversePromptClick}
                className="gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
                Reverse prompt
              </Button>
            )}
            <Button
              variant={hasMission ? "outline" : "default"}
              size="sm"
              onClick={onEditClick}
              className="gap-1.5"
              title={hasMission ? "Edit mission statement" : "Set mission statement"}
            >
              <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
              {hasMission ? "Edit mission" : "Set mission"}
            </Button>
            {hasMission && (
              <div className="ml-auto hidden items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground lg:flex">
                Edit mission controls
                <ArrowUpRight className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
