import type { KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

interface TabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
}

export function TabBar({ tabs, activeTab, onTabChange, className }: TabBarProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    if (tabs.length === 0) return;

    if (event.key === "Home") {
      onTabChange(tabs[0].id);
      return;
    }
    if (event.key === "End") {
      onTabChange(tabs[tabs.length - 1].id);
      return;
    }

    const delta = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (index + delta + tabs.length) % tabs.length;
    onTabChange(tabs[nextIndex].id);
  };

  return (
    <div
      className={cn(
        "border-b border-line bg-app px-4 py-2.5",
        className
      )}
      role="tablist"
    >
      <div className="flex items-center gap-1.5 overflow-x-auto rounded-lg border border-line p-0.5">
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={cn(
                "relative rounded-md px-4 py-2",
                "text-[12.5px] font-medium",
                "transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                isActive
                  ? "bg-surface-2 text-ink"
                  : "text-ink-secondary hover:text-ink"
              )}
            >
              <span className="relative z-10 flex items-center gap-1.5 whitespace-nowrap">
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={cn(
                      "flex h-[17px] min-w-4.5 items-center justify-center rounded-full px-1 text-[10px] font-medium",
                      isActive
                        ? "bg-surface-3 text-ink"
                        : "bg-surface-2 text-ink-muted"
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
