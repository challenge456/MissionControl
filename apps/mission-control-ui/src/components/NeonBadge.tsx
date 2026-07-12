import * as React from "react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type NeonBadgeVariant = "neon-success" | "neon-cyan" | "neon-error";

type BaseBadgeProps = React.ComponentProps<typeof Badge>;

export type NeonBadgeProps = Omit<BaseBadgeProps, "variant"> & {
  variant?: NeonBadgeVariant;
};

/**
 * Legacy alias. Variant values map to v2 status tones via the restyled
 * ui/badge variants (neon-success → ok-soft, neon-cyan → info-soft,
 * neon-error → err-soft). New code should use factory/badges StatusBadge.
 */
function NeonBadge({ className, variant = "neon-success", ...props }: NeonBadgeProps): JSX.Element {
  return (
    <Badge
      className={cn(className)}
      variant={variant as BadgeProps["variant"]}
      {...props}
    />
  );
}

export { NeonBadge };
