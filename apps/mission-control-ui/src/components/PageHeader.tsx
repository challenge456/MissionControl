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
    <div className="relative shrink-0 overflow-hidden border-b border-[var(--panel-line)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--shell-panel-strong)_97%,transparent),color-mix(in_srgb,var(--background)_90%,transparent))] backdrop-blur-[var(--blur-panel)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(103,232,249,0.12),transparent_32%),radial-gradient(circle_at_85%_0%,rgba(16,185,129,0.08),transparent_22%)]" />
      <div className="relative px-5 py-5">
        <div className="absolute inset-x-5 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(103,232,249,0.24),transparent)]" />
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <div className="flex min-w-0 items-start gap-3">
              {icon && (
                <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-cyan-400/16 bg-cyan-400/8 text-cyan-200 shadow-[var(--glow-cyan)]">
                  {icon}
                </div>
              )}
              <div className="min-w-0">
                <div className="mc-kicker">{eyebrow}</div>
                <div className="mt-2 flex flex-wrap items-center gap-2.5">
                  <h1 className="font-[family:var(--font-display)] text-lg font-semibold tracking-[0.08em] text-foreground leading-none md:text-xl">
                    {title}
                  </h1>
                  {status}
                </div>
                {description && (
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                )}
              </div>
            </div>
          </div>
          {actions && (
            <div
              className={cn(
                "flex flex-wrap items-center gap-2 rounded-xl border border-[var(--panel-line)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--shell-panel)_98%,transparent),color-mix(in_srgb,var(--background)_88%,transparent))] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] xl:max-w-[48%] xl:justify-end",
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
