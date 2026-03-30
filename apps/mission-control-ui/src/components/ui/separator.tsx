import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => {
    const resolvedOrientation: "horizontal" | "vertical" =
      orientation === "vertical" ? "vertical" : "horizontal"

    return (
      <SeparatorPrimitive.Root
        ref={ref}
        decorative={decorative}
        orientation={resolvedOrientation}
        className={cn(
          "shrink-0 bg-border",
          resolvedOrientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
          className
        )}
        {...props}
      />
    )
  }
)
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }
