import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 font-[family:var(--font-display)] text-[0.66rem] font-semibold tracking-[0.14em] uppercase transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/85",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border-border",
        success:
          "bg-primary/15 text-primary border-primary/30 hover:bg-primary/20",
        warning:
          "bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/20",
        error:
          "bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/20",
        muted:
          "bg-muted text-muted-foreground border-border hover:bg-muted/80",
        "neon-success":
          "bg-[var(--neon-green)]/15 text-[var(--neon-green)] border-[var(--glass-border-green)]",
        "neon-cyan":
          "bg-[var(--neon-cyan)]/15 text-[var(--neon-cyan)] border-[var(--glass-border)]",
        "neon-error":
          "bg-[var(--neon-magenta)]/15 text-[var(--neon-magenta)] border-[var(--neon-magenta)]/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

type BadgeElementProps = React.ComponentPropsWithoutRef<"div">

export interface BadgeProps
  extends BadgeElementProps,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
)
Badge.displayName = "Badge"

export { Badge, badgeVariants }
