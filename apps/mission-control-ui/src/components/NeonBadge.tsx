import * as React from "react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type NeonBadgeVariant = "neon-success" | "neon-cyan" | "neon-error";

export interface NeonBadgeProps extends Omit<BadgeProps, "variant"> {
  variant?: NeonBadgeVariant;
}

function NeonBadge({ className, variant = "neon-success", ...props }: NeonBadgeProps) {
  return (
    <Badge
      className={cn("border", className)}
      variant={variant as BadgeProps["variant"]}
      {...props}
    />
  );
}

export { NeonBadge };
