import * as React from "react";
import { cn } from "@/lib/utils";

export interface NeonStatProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  subtitle?: string;
  /** Legacy prop, ignored in v2 — metric values render in text-ink. */
  accent?: "green" | "cyan" | "muted";
}

/** Legacy alias styled like factory MetricBlock: label / value / detail. */
const NeonStat = React.forwardRef<HTMLDivElement, NeonStatProps>(
  ({ className, label, value, subtitle, accent: _accent = "green", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex min-w-0 flex-col gap-1.5", className)}
        {...props}
      >
        <span className="text-[12.5px] font-medium text-ink-secondary">{label}</span>
        <span className="text-[20px] font-semibold leading-none text-ink">{value}</span>
        {subtitle && (
          <span className="text-[12px] text-ink-muted">{subtitle}</span>
        )}
      </div>
    );
  }
);
NeonStat.displayName = "NeonStat";

export { NeonStat };
