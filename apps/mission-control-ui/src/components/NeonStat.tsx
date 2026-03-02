import * as React from "react";
import { cn } from "@/lib/utils";

export interface NeonStatProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  subtitle?: string;
  /** Visual accent: green (primary), cyan, or muted */
  accent?: "green" | "cyan" | "muted";
}

const NeonStat = React.forwardRef<HTMLDivElement, NeonStatProps>(
  ({ className, label, value, subtitle, accent = "green", ...props }, ref) => {
    const valueClass =
      accent === "green"
        ? "text-[var(--neon-green)]"
        : accent === "cyan"
          ? "text-[var(--neon-cyan)]"
          : "text-muted-foreground";
    return (
      <div
        ref={ref}
        className={cn("flex flex-col gap-0.5", className)}
        {...props}
      >
        <span
          className={cn(
            "text-2xl font-semibold tracking-tight neon-stat-value",
            valueClass
          )}
        >
          {value}
        </span>
        <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {subtitle && (
          <span className="text-[0.65rem] text-muted-foreground/70 mt-0.5">
            {subtitle}
          </span>
        )}
      </div>
    );
  }
);
NeonStat.displayName = "NeonStat";

export { NeonStat };
