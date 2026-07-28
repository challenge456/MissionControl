import { SchematicSectionTitle } from "./SchematicSectionTitle";

interface DispatchGateBarProps {
  pendingApprovals: number;
  blockedTasks: number;
  emptyCaption?: string;
}

function GateSegment({
  className,
  widthPct,
  count,
  label,
}: {
  className: string;
  widthPct: number;
  count: number;
  label: string;
}): JSX.Element | null {
  if (widthPct <= 0) return null;
  const showLabel = widthPct >= 14;
  return (
    <div
      className={className}
      style={{ width: `${widthPct}%` }}
      title={`${count} ${label}`}
    >
      {showLabel ? `${count} ${label}` : null}
    </div>
  );
}

/**
 * Measured work-state bar. It intentionally avoids inferring routing decisions
 * from run and task totals.
 */
export function DispatchGateBar({
  pendingApprovals,
  blockedTasks,
  emptyCaption = "no approvals or blocked work",
}: DispatchGateBarProps): JSX.Element {
  const total = pendingApprovals + blockedTasks;
  const approvalPct = total > 0 ? Math.round((pendingApprovals / total) * 100) : 0;
  const blockedPct = total > 0 ? 100 - approvalPct : 0;

  return (
    <section aria-label="Dispatch gate">
      <SchematicSectionTitle>Work state</SchematicSectionTitle>
      <div className="flex h-[26px] overflow-hidden rounded-md border border-line">
        {total === 0 ? (
          <div className="w-full bg-surface-2" />
        ) : (
          <>
            <GateSegment
              className="flex min-w-0 items-center justify-center overflow-hidden whitespace-nowrap bg-schematic-accent text-[11px] font-semibold text-white"
              widthPct={approvalPct}
              count={pendingApprovals}
              label="awaiting approval"
            />
            <GateSegment
              className="flex min-w-0 items-center justify-center overflow-hidden whitespace-nowrap bg-schematic-gate-retrieve text-[11px] font-semibold text-white"
              widthPct={blockedPct}
              count={blockedTasks}
              label="blocked"
            />
          </>
        )}
      </div>
      <p className="mt-1.5 text-[11.5px] tabular-nums text-ink-muted">
        {total === 0
          ? emptyCaption
          : `${pendingApprovals} awaiting approval · ${blockedTasks} blocked`}
      </p>
    </section>
  );
}
