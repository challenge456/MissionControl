import { Bot, Braces, UserRound } from "lucide-react";
import { cn } from "../lib/utils";
import type { FactoryPhaseKind } from "./recipeCatalog";
import type { FactoryPhaseProjection } from "./phaseProjection";

const LANES: Array<{
  id: FactoryPhaseKind;
  label: string;
  icon: typeof UserRound;
}> = [
  { id: "human", label: "Human", icon: UserRound },
  { id: "agent", label: "Agent", icon: Bot },
  { id: "code", label: "Code", icon: Braces },
];

const LANE_STYLE: Record<FactoryPhaseKind, string> = {
  human: "border-warn/30 bg-warn-soft text-ink",
  agent: "border-info-accent/30 bg-info-soft text-ink",
  code: "border-ok/30 bg-ok-soft text-ink",
};

export function FactoryRunSwimlane({
  phases,
  selectedPhaseId,
  onSelectPhase,
  compactCounts,
}: {
  phases?: FactoryPhaseProjection[];
  selectedPhaseId?: string | null;
  onSelectPhase?: (phaseId: string) => void;
  compactCounts?: Partial<Record<FactoryPhaseKind, number | undefined>>;
}) {
  if (!phases) {
    return (
      <div
        className="grid grid-cols-3 gap-2"
        role="group"
        aria-label="Recorded run activity"
      >
        {LANES.map(({ id, label, icon: Icon }) => (
          <div
            key={id}
            className="rounded-lg border border-line bg-surface-2 px-2.5 py-2"
          >
            <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.07em] text-ink-muted">
              <Icon size={11} />
              {label}
            </div>
            <div className="mt-1.5 font-mono text-[13px] font-semibold text-ink">
              {compactCounts?.[id] ?? "—"}
            </div>
            <div className="mt-0.5 text-[9.5px] text-ink-muted">
              {id === "human"
                ? "touches"
                : id === "agent"
                  ? "generations"
                  : "tool calls"}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="overflow-x-auto rounded-xl border border-line bg-surface-2 p-3"
      role="group"
      aria-label="Run phase swimlane"
    >
      <div className="min-w-[680px] space-y-2">
        {LANES.map(({ id, label, icon: Icon }) => {
          const lanePhases = phases.filter((phase) => phase.kind === id);
          return (
            <div
              key={id}
              className="grid grid-cols-[90px_minmax(0,1fr)] items-stretch gap-2"
            >
              <div className="flex items-center gap-2 rounded-lg border border-line bg-surface-1 px-2.5 text-[11px] font-medium text-ink-secondary">
                <Icon size={13} />
                {label}
              </div>
              <div className="flex min-h-12 items-center gap-2 rounded-lg border border-line bg-surface-1 p-2">
                {lanePhases.length ? (
                  lanePhases.map((phase) => (
                    <button
                      key={phase._id}
                      type="button"
                      onClick={() => onSelectPhase?.(phase._id)}
                      aria-pressed={selectedPhaseId === phase._id}
                      className={cn(
                        "min-w-[118px] max-w-[220px] flex-1 rounded-md border px-2.5 py-2 text-left transition-shadow focus:outline-none focus:ring-2 focus:ring-info-accent/30",
                        LANE_STYLE[id],
                        selectedPhaseId === phase._id &&
                          "ring-2 ring-info-accent/45",
                      )}
                    >
                      <div className="truncate text-[11px] font-medium">
                        {phase.name}
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2 text-[9.5px] text-ink-muted">
                        <span>{phase.owner}</span>
                        <span>{formatDuration(phase.durationMs)}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <span className="px-2 text-[10.5px] text-ink-muted">
                    No recorded observations
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatDuration(value?: number) {
  if (value === undefined) return "Not recorded";
  if (value < 1_000) return `${Math.round(value)}ms`;
  if (value < 60_000) return `${(value / 1_000).toFixed(1)}s`;
  return `${(value / 60_000).toFixed(1)}m`;
}
