import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  status?: ReactNode;
  icon?: ReactNode;
  eyebrow?: string;
}

export function PageHeader({ title, description, actions, status, icon, eyebrow = "Operator surface" }: PageHeaderProps) {
  return (
    <div className="relative shrink-0 border-b border-line bg-app">
      <div className="relative px-5 py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <div className="flex min-w-0 items-start gap-3">
              {icon && (
                <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-2 text-ink-secondary">
                  {icon}
                </div>
              )}
              <div className="min-w-0">
                <div className="mt-2 flex flex-wrap items-center gap-2.5">
                  <h1 className="text-[26px] font-semibold text-ink leading-none">
                    {title}
                  </h1>
                  {status}
                </div>
                {description && (
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-secondary">
                    {description}
                  </p>
                )}
              </div>
            </div>
          </div>
          {actions && (
            <div
              className={cn(
                "flex flex-wrap items-center gap-2 xl:max-w-[48%] xl:justify-end",
                !description && "xl:self-center"
              )}
            >
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
