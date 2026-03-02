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
 * Renders curved SVG paths between connection endpoints with optional glow and animation.
 * Coordinates are in 0–100 percent space (viewBox 0 0 100 100); e.g. (50,50) = center.
 */
function NetworkConnections({
  connections,
  className,
  stroke = "var(--neon-cyan)",
  animated = true,
}: NetworkConnectionsProps) {
  return (
    <svg
      className={cn("absolute inset-0 w-full h-full pointer-events-none", className)}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <filter id="neon-glow-connections" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="connection-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--neon-green)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--neon-cyan)" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <g filter="url(#neon-glow-connections)">
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
