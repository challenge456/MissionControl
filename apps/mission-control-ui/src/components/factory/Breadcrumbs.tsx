import { Fragment } from "react";
import { cn } from "../../lib/utils";

export interface Crumb {
  label: string;
  onClick?: () => void;
  current?: boolean;
}

export function Breadcrumbs({ items }: { items: Crumb[] }): JSX.Element | null {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[12.5px]">
      {items.map((crumb, i) => (
        <Fragment key={`${crumb.label}-${i}`}>
          {i > 0 && (
            <span aria-hidden className="text-ink-muted">
              /
            </span>
          )}
          {crumb.onClick && !crumb.current ? (
            <button
              type="button"
              onClick={crumb.onClick}
              className="rounded text-ink-muted transition-colors duration-150 hover:text-ink-secondary"
            >
              {crumb.label}
            </button>
          ) : (
            <span
              aria-current={crumb.current ? "page" : undefined}
              className={cn(crumb.current ? "text-ink" : "text-ink-muted")}
            >
              {crumb.label}
            </span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
