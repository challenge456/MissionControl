import { cn } from "@/lib/utils";

export type StatusDotVariant =
  | "healthy"
  | "warning"
  | "error"
  | "offline"
  | "active"
  | "paused"
  | "live";

const variantStyles: Record<StatusDotVariant, string> = {
  healthy: "bg-ok",
  warning: "bg-warn",
  error: "bg-err",
  offline: "bg-ink-muted",
  active: "bg-ok",
  paused: "bg-warn",
  live: "bg-ok",
};

export interface StatusDotProps {
  variant?: StatusDotVariant;
  /** Legacy prop, ignored — v2 status dots are flat (no pulse/halo). */
  pulse?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

const sizeMap = {
  sm: "h-1.5 w-1.5",
  md: "h-2 w-2",
  lg: "h-2.5 w-2.5",
};

export function StatusDot({
  variant = "healthy",
  pulse: _pulse = false,
  size = "md",
  className,
  label,
}: StatusDotProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        className={cn(
          "rounded-full shrink-0",
          sizeMap[size],
          variantStyles[variant]
        )}
        aria-hidden="true"
      />
      {label && (
        <span className="text-[12px] font-medium text-ink-secondary">
          {label}
        </span>
      )}
    </span>
  );
}
