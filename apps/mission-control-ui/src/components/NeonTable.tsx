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

/** Legacy alias: table inside a v2 surface (hairline border, no glass). */
const NeonTable = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="overflow-hidden rounded-xl border border-line bg-surface-1">
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
