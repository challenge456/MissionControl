import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--shell-panel)_98%,transparent),color-mix(in_srgb,var(--background)_92%,transparent))] px-6 py-12 text-center shadow-[var(--card-shadow)]",
        className
      )}
    >
      {Icon && (
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--neon-cyan)_12%,transparent)] text-[var(--neon-cyan)]">
          <Icon className="h-7 w-7" strokeWidth={1.5} />
        </div>
      )}
      <h3 className="mb-2 font-display text-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mb-6 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
