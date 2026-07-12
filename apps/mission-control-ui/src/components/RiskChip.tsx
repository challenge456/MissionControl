import { cn } from "@/lib/utils";
import { StatusBadge, type StatusBadgeProps } from "@/components/factory/badges";

type RiskLevel = "GREEN" | "YELLOW" | "RED";

const RISK_CONFIG: Record<RiskLevel, { label: string; tone: StatusBadgeProps["tone"] }> = {
  GREEN: { label: "Low Risk", tone: "success" },
  YELLOW: { label: "Medium Risk", tone: "warning" },
  RED: { label: "High Risk", tone: "error" },
};

interface RiskChipProps {
  level: string;
  size?: "sm" | "md";
  className?: string;
}

export function RiskChip({ level, size = "sm", className }: RiskChipProps): JSX.Element {
  const config = RISK_CONFIG[level as RiskLevel];
  const sizeClass = size === "md" ? "text-[12.5px]" : undefined;

  if (!config) {
    return (
      <StatusBadge tone="neutral" className={cn(sizeClass, className)}>
        {level}
      </StatusBadge>
    );
  }

  return (
    <StatusBadge tone={config.tone} className={cn(sizeClass, className)}>
      {config.label}
    </StatusBadge>
  );
}
