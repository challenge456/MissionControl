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
  /** Optional top accent bar (neon green or cyan) */
  accent?: "green" | "cyan" | "none";
}

const NeonCard = React.forwardRef<HTMLDivElement, NeonCardProps>(
  ({ className, accent = "none", children, ...props }, ref) => (
    <Card
      ref={ref}
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      {accent !== "none" && (
        <div
          className={cn(
            "absolute top-0 left-0 right-0 h-[2px]",
            accent === "green" && "bg-[var(--neon-green)]/60",
            accent === "cyan" && "bg-[var(--neon-cyan)]/60"
          )}
        />
      )}
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
