import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  status?: ReactNode;
  icon?: ReactNode;
}

export function PageHeader({ title, description, actions, status, icon }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--glass-border)] bg-[var(--glass-bg)]/80 backdrop-blur-[var(--blur-panel)] shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--neon-green)]/15 text-[var(--neon-green)] border border-[var(--glass-border-green)]">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="text-sm font-semibold text-foreground leading-none">{title}</h1>
            {status}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1 leading-snug">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
