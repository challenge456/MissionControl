import { cva, type VariantProps } from "class-variance-authority";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * Consolidated Software Factory badge system (supersedes StatusChip /
 * PriorityChip / RiskChip / Neon badges for v2 surfaces).
 */

const statusBadge = cva(
  "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11.5px] font-medium leading-none",
  {
    variants: {
      tone: {
        neutral: "border-line bg-surface-2 text-ink-secondary",
        success: "border-transparent bg-ok-soft text-ok",
        warning: "border-transparent bg-warn-soft text-warn",
        error: "border-transparent bg-err-soft text-err",
        info: "border-transparent bg-info-soft text-info-accent",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
);

export interface StatusBadgeProps extends VariantProps<typeof statusBadge> {
  children: React.ReactNode;
  className?: string;
}

export function StatusBadge({ tone, children, className }: StatusBadgeProps): JSX.Element {
  return <span className={cn(statusBadge({ tone }), className)}>{children}</span>;
}

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "GREEN" | "YELLOW" | "RED";

const RISK_TONE: Record<RiskLevel, StatusBadgeProps["tone"]> = {
  LOW: "success",
  GREEN: "success",
  MEDIUM: "warning",
  YELLOW: "warning",
  HIGH: "error",
  RED: "error",
  CRITICAL: "error",
};

export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }): JSX.Element {
  return (
    <StatusBadge tone={RISK_TONE[level]} className={className}>
      {level}
    </StatusBadge>
  );
}

export interface ScoreBadgeProps {
  /** 0–100 */
  score: number;
  size?: "sm" | "lg";
  className?: string;
}

function scoreTone(score: number): string {
  if (score >= 90) return "bg-ok-soft text-ok border-transparent";
  if (score >= 70) return "bg-warn-soft text-warn border-transparent";
  return "bg-err-soft text-err border-transparent";
}

/** Numeric quality/impact score chip. 90+ green, 70–89 yellow, <70 red. */
export function ScoreBadge({ score, size = "sm", className }: ScoreBadgeProps): JSX.Element {
  return (
    <span
      role="img"
      aria-label={`Score ${score} out of 100`}
      className={cn(
        "inline-flex items-center justify-center rounded-lg border font-mono font-semibold",
        size === "lg" ? "h-12 min-w-12 px-2 text-[20px]" : "h-6 min-w-8 px-1.5 text-[12.5px]",
        scoreTone(score),
        className
      )}
    >
      {Math.round(score)}
    </span>
  );
}

export interface TrendBadgeProps {
  /** Multiplier or delta, e.g. 1.33 renders "↑ 1.33x"; below 1 renders down. */
  multiplier: number;
  className?: string;
}

export function TrendBadge({ multiplier, className }: TrendBadgeProps): JSX.Element {
  const up = multiplier >= 1;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11.5px] font-medium leading-none",
        up ? "bg-ok-soft text-ok" : "bg-err-soft text-err",
        className
      )}
    >
      {up ? (
        <ArrowUpRight size={11} aria-hidden />
      ) : (
        <ArrowDownRight size={11} aria-hidden />
      )}
      {multiplier.toFixed(2)}x
    </span>
  );
}
