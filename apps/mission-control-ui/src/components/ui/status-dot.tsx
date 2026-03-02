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
  healthy: "bg-primary",
  warning: "bg-amber-500",
  error: "bg-red-500",
  offline: "bg-zinc-500",
  active: "bg-primary",
  paused: "bg-amber-500",
  live: "bg-primary",
};

export interface StatusDotProps {
  variant?: StatusDotVariant;
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
  pulse = false,
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
          variantStyles[variant],
          pulse && "status-dot-pulse"
        )}
        aria-hidden="true"
      />
      {label && (
        <span className="text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      )}
    </span>
  );
}
