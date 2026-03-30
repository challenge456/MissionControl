import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold tracking-[0.02em] ring-offset-background transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border border-emerald-300/20 bg-[linear-gradient(135deg,rgba(31,171,110,0.2),rgba(22,163,74,0.82))] text-primary-foreground shadow-[0_10px_24px_rgba(22,163,74,0.16)] hover:brightness-[1.03] hover:shadow-[0_14px_30px_rgba(22,163,74,0.22)]",
        destructive:
          "border border-red-400/20 bg-[linear-gradient(135deg,rgba(248,113,113,0.18),rgba(220,38,38,0.78))] text-destructive-foreground hover:brightness-[1.03]",
        outline:
          "border border-[var(--panel-line-strong)] bg-[color:var(--shell-panel)] text-foreground hover:border-cyan-400/22 hover:bg-cyan-400/6 hover:shadow-[var(--glow-cyan)]",
        secondary:
          "border border-[var(--panel-line)] bg-secondary/85 text-secondary-foreground hover:bg-secondary",
        ghost: "hover:bg-cyan-400/10 hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline p-0 h-auto",
        success:
          "border border-emerald-400/25 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/16 hover:shadow-[var(--glow-green)]",
        neon:
          "border border-emerald-400/25 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/16 hover:shadow-[var(--glow-green)]",
        warning:
          "border border-amber-400/25 bg-amber-400/10 text-amber-200 hover:bg-amber-400/16 hover:shadow-[0_0_14px_rgba(245,158,11,0.12)]",
        "neon-cyan":
          "border border-cyan-300/18 bg-[linear-gradient(135deg,rgba(34,211,238,0.12),rgba(8,47,73,0.78))] text-cyan-50 hover:border-cyan-300/26 hover:shadow-[var(--glow-cyan)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-xl px-6",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
