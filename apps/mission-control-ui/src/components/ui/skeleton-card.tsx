import { cn } from "@/lib/utils";

export interface SkeletonCardProps {
  className?: string;
  lines?: number;
}

export function SkeletonCard({ className, lines = 3 }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5",
        className
      )}
    >
      <div className="skeleton-shimmer mb-4 h-3 w-24 rounded-lg" />
      <div className="skeleton-shimmer mb-6 h-7 w-16 rounded-lg" />
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="skeleton-shimmer h-2 rounded-md"
            style={{ width: `${90 - i * 10}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export interface SkeletonLineProps {
  className?: string;
  width?: string;
}

export function SkeletonLine({ className, width = "100%" }: SkeletonLineProps) {
  return (
    <div
      className={cn("skeleton-shimmer h-3 rounded", className)}
      style={{ width }}
    />
  );
}
