import * as React from "react";
import { cn } from "@/lib/utils";

export interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Slightly stronger glow on hover */
  glow?: boolean;
}

const GlassPanel = React.forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, glow, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-[var(--blur-panel)] shadow-[0_4px_24px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-200",
        glow &&
          "hover:border-[var(--glass-border-green)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.35),var(--glow-green)]",
        className
      )}
      {...props}
    />
  )
);
GlassPanel.displayName = "GlassPanel";

export { GlassPanel };
