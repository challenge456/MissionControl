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
        "neon-empty-state py-16 px-6",
        className
      )}
    >
      {Icon && (
        <div className="neon-empty-state-icon mb-4 p-4">
          <Icon className="h-6 w-6" strokeWidth={1.5} />
        </div>
      )}
      <h3 className="neon-empty-state-title mb-1">{title}</h3>
      {description && (
        <p className="neon-empty-state-desc leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
