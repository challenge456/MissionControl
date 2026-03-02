import * as React from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/** Wrapper that renders a table inside a glass panel with consistent neon styling */
const NeonTable = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)]/50 overflow-hidden">
    <Table ref={ref} className={cn(className)} {...props} />
  </div>
));
NeonTable.displayName = "NeonTable";

export {
  NeonTable,
  TableHeader as NeonTableHeader,
  TableBody as NeonTableBody,
  TableFooter as NeonTableFooter,
  TableRow as NeonTableRow,
  TableHead as NeonTableHead,
  TableCell as NeonTableCell,
  TableCaption as NeonTableCaption,
};
