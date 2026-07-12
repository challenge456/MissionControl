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
        "flex flex-col items-center justify-center rounded-xl border border-line bg-surface-1 px-6 py-12 text-center",
        className
      )}
    >
      {Icon && (
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl border border-line bg-surface-2 text-ink-muted">
          <Icon className="h-7 w-7" strokeWidth={1.5} />
        </div>
      )}
      <h3 className="mb-2 text-[15px] font-semibold text-ink">{title}</h3>
      {description && (
        <p className="mb-6 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
