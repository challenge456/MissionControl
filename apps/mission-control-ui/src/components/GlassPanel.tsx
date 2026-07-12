import * as React from "react";
import { cn } from "@/lib/utils";

export interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Legacy prop — v2 maps it to a hairline border emphasis on hover. */
  glow?: boolean;
}

/** Legacy alias: v2 card surface. No blur, no glow, no glass. */
const GlassPanel = React.forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, glow, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-line bg-surface-1 transition-colors duration-150",
        glow && "hover:border-line-strong",
        className
      )}
      {...props}
    />
  )
);
GlassPanel.displayName = "GlassPanel";

export { GlassPanel };
