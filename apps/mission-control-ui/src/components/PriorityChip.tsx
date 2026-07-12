import { cn } from "@/lib/utils";
import { StatusBadge, type StatusBadgeProps } from "@/components/factory/badges";

const PRIORITY_CONFIG: Record<number, { label: string; tone: StatusBadgeProps["tone"] }> = {
  1: { label: "Critical", tone: "error" },
  2: { label: "High", tone: "warning" },
  3: { label: "Normal", tone: "info" },
  4: { label: "Low", tone: "neutral" },
};

interface PriorityChipProps {
  priority: number;
  size?: "sm" | "md";
  className?: string;
}

export function PriorityChip({ priority, size = "sm", className }: PriorityChipProps): JSX.Element {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG[3];
  const sizeClass = size === "md" ? "text-[12.5px]" : undefined;

  return (
    <StatusBadge tone={config.tone} className={cn(sizeClass, className)}>
      {config.label}
    </StatusBadge>
  );
}
