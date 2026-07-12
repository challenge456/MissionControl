import * as React from "react";
import { cn } from "@/lib/utils";

export interface ConnectionEnd {
  x: number;
  y: number;
}

export interface NetworkConnection {
  id: string;
  from: ConnectionEnd;
  to: ConnectionEnd;
  /** Optional: curve direction / control offset */
  curvature?: number;
}

export interface NetworkConnectionsProps {
  connections: NetworkConnection[];
  className?: string;
  /** Stroke color (default neon-cyan) */
  stroke?: string;
  /** Animate stroke dash offset */
  animated?: boolean;
}

/**
 * Renders curved SVG paths between connection endpoints. Flat hairline
 * strokes per the v2 style guide (no glow filters, no gradient strokes).
 * Coordinates are in 0–100 percent space (viewBox 0 0 100 100); e.g. (50,50) = center.
 */
function NetworkConnections({
  connections,
  className,
  stroke = "var(--border-emphasized)",
  animated = true,
}: NetworkConnectionsProps) {
  return (
    <svg
      className={cn("absolute inset-0 w-full h-full pointer-events-none", className)}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <g>
        {connections.map(({ id, from, to, curvature = 0.3 }) => {
          const dx = to.x - from.x;
          const cpx = from.x + dx * (0.5 + curvature * 0.2);
          const cpy = from.y;
          const cpx2 = to.x - dx * (0.5 + curvature * 0.2);
          const cpy2 = to.y;
          const d = `M ${from.x} ${from.y} C ${cpx} ${cpy}, ${cpx2} ${cpy2}, ${to.x} ${to.y}`;
          return (
            <path
              key={id}
              d={d}
              fill="none"
              stroke={stroke}
              strokeWidth="0.8"
              strokeOpacity="0.6"
              strokeLinecap="round"
              className={animated ? "network-connection-path" : ""}
            />
          );
        })}
      </g>
    </svg>
  );
}

export { NetworkConnections };
