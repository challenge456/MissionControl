import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface NeonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Legacy prop, ignored in v2 — cards carry no decorative accent bar. */
  accent?: "green" | "cyan" | "none";
}

/** Legacy alias over the v2 card surface (bg-surface-1, hairline border). */
const NeonCard = React.forwardRef<HTMLDivElement, NeonCardProps>(
  ({ className, accent: _accent = "none", children, ...props }, ref) => (
    <Card ref={ref} className={cn(className)} {...props}>
      {children}
    </Card>
  )
);
NeonCard.displayName = "NeonCard";

export {
  NeonCard,
  CardHeader as NeonCardHeader,
  CardTitle as NeonCardTitle,
  CardDescription as NeonCardDescription,
  CardContent as NeonCardContent,
  CardFooter as NeonCardFooter,
};
