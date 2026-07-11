import * as React from "react";
import { cn } from "@/lib/utils";
import {
  CHART_CONTAINER_CLASS,
  CHART_GRID_COLOR,
  CHART_SERIES,
  CHART_TICK_STYLE,
} from "@/components/factory/chartTheme";

/**
 * Legacy alias surface over factory/chartTheme. Export names are kept so
 * existing call sites (DashboardOverview) compile; values map to the v2
 * style-guide chart constants. New code should import factory/chartTheme.
 */
export const NeonChartTheme = {
  /** CSS class for the chart container */
  containerClass: CHART_CONTAINER_CLASS,
  /** Recharts-compatible style object for axes and text */
  styles: {
    stroke: CHART_GRID_COLOR,
    fill: CHART_TICK_STYLE.fill,
    fontSize: CHART_TICK_STYLE.fontSize,
    tickStroke: CHART_GRID_COLOR,
    gridStroke: CHART_GRID_COLOR,
    gridStrokeOpacity: 1,
  },
  /** Series colors in order (style-guide palette, max 4 series) */
  gradientColors: [...CHART_SERIES],
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
