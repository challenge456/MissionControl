import type { CSSProperties } from "react";

/**
 * Software Factory v2 chart constants (recharts). Source of truth is
 * docs/software-factory/UI_STYLE_GUIDE.md — Charts section.
 */

/** Grid and axis line color. */
export const CHART_GRID_COLOR = "#272A2F";

/** Tick label style: 11px muted. */
export const CHART_TICK_STYLE: { fill: string; fontSize: number } = {
  fill: "#717680",
  fontSize: 11,
};

/** Series palette in order. Max 4 series per chart. */
export const CHART_SERIES: readonly string[] = [
  "#32E875",
  "#5E8BFF",
  "#F3C744",
  "#A7ABB4",
];

/** Stroke width for line/area series. */
export const CHART_STROKE_WIDTH = 1.5;

/** Recharts Tooltip `contentStyle`: surface-3 panel, hairline border. */
export const CHART_TOOLTIP_CONTENT_STYLE: CSSProperties = {
  backgroundColor: "var(--surface-elevated)",
  border: "1px solid var(--border-subtle)",
  borderRadius: 8,
  padding: "8px 12px",
  fontSize: "12.5px",
  color: "var(--text-primary)",
};

/** Class for chart card containers. */
export const CHART_CONTAINER_CLASS =
  "rounded-xl border border-line bg-surface-1 p-4";
