import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Wrapper for chart containers. Applies neon grid/axis-friendly background and spacing.
 * When using Recharts, wrap chart in this and pass NeonChartTheme.styles to axis/tooltip/legend.
 */
export const NeonChartTheme = {
  /** CSS class for the chart container */
  containerClass:
    "rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)]/50 p-4",
  /** Recharts-compatible style object for axes and text (use when integrating Recharts) */
  styles: {
    stroke: "var(--glass-border)",
    fill: "var(--muted-foreground)",
    fontSize: 11,
    tickStroke: "var(--glass-border)",
    gridStroke: "var(--glass-border)",
    gridStrokeOpacity: 0.4,
  },
  /** Colors for gradient fills in order */
  gradientColors: ["var(--neon-green)", "var(--neon-cyan)", "var(--neon-magenta)"],
};

export interface NeonChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {}

const NeonChartContainer = React.forwardRef<HTMLDivElement, NeonChartContainerProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(NeonChartTheme.containerClass, className)}
      {...props}
    />
  )
);
NeonChartContainer.displayName = "NeonChartContainer";

export { NeonChartContainer };
