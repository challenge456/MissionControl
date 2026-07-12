import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-[13px] font-medium ring-offset-background transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border border-transparent bg-act text-act-ink hover:opacity-90",
        destructive:
          "border border-transparent bg-err-soft text-err hover:opacity-90",
        outline:
          "border border-line bg-surface-1 text-ink-secondary hover:border-line-strong hover:text-ink",
        secondary:
          "border border-line bg-surface-2 text-ink-secondary hover:text-ink hover:border-line-strong",
        ghost: "text-ink-secondary hover:bg-surface-2 hover:text-ink",
        link: "text-ink underline-offset-4 hover:underline p-0 h-auto",
        success:
          "border border-transparent bg-ok-soft text-ok hover:opacity-90",
        neon:
          "border border-transparent bg-ok-soft text-ok hover:opacity-90",
        warning:
          "border border-transparent bg-warn-soft text-warn hover:opacity-90",
        "neon-cyan":
          "border border-transparent bg-info-soft text-info-accent hover:opacity-90",
      },
      size: {
        default: "h-9 px-3",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-10 rounded-lg px-5",
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
