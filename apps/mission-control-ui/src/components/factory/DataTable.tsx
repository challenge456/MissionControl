import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export interface Column<Row> {
  id: string;
  header: ReactNode;
  cell: (row: Row) => ReactNode;
  /** Right-align numeric/score columns */
  align?: "left" | "right";
  width?: string;
}

export interface DataTableProps<Row> {
  columns: Column<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  onRowClick?: (row: Row) => void;
  emptyState?: ReactNode;
  loading?: boolean;
  className?: string;
}

/**
 * Dense registry-style table: uppercase muted headers, hairline separators,
 * surface-2 row hover, built-in loading and empty states.
 */
export function DataTable<Row>({
  columns,
  rows,
  rowKey,
  onRowClick,
  emptyState,
  loading,
  className,
}: DataTableProps<Row>): JSX.Element {
  return (
    <div className={cn("overflow-x-auto rounded-xl border border-line", className)}>
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-line">
            {columns.map((col) => (
              <th
                key={col.id}
                scope="col"
                style={col.width ? { width: col.width } : undefined}
                className={cn(
                  "px-4 py-2.5 text-[11.5px] font-medium uppercase tracking-[0.06em] text-ink-muted",
                  col.align === "right" ? "text-right" : "text-left"
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading &&
            Array.from({ length: 4 }, (_, i) => (
              <tr key={`skeleton-${i}`} className="border-b border-line last:border-b-0">
                {columns.map((col) => (
                  <td key={col.id} className="px-4 py-4">
                    <div className="h-3.5 animate-pulse rounded bg-surface-2" />
                  </td>
                ))}
              </tr>
            ))}
          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-ink-muted">
                {emptyState ?? "No results"}
              </td>
            </tr>
          )}
          {!loading &&
            rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "border-b border-line transition-colors duration-150 last:border-b-0",
                  onRowClick && "cursor-pointer hover:bg-surface-2"
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.id}
                    className={cn(
                      "px-4 py-3.5 align-middle text-ink-secondary",
                      col.align === "right" && "text-right"
                    )}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
