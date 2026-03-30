import type { KeyboardEvent } from "react";
import { motion } from "framer-motion";
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
        "border-b border-[var(--panel-line)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--shell-panel)_95%,transparent),color-mix(in_srgb,var(--background)_90%,transparent))] px-4 py-2.5 backdrop-blur-[var(--blur-panel)]",
        className
      )}
      role="tablist"
    >
      <div className="flex items-center gap-1.5 overflow-x-auto rounded-xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
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
                "relative rounded-lg px-4 py-2",
                "text-[11px] font-semibold uppercase tracking-[0.16em]",
                "transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                isActive
                  ? "text-cyan-100"
                  : "text-muted-foreground hover:text-foreground hover:bg-cyan-400/8"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="tab-bar-pill"
                  className="absolute inset-0 rounded-lg border border-cyan-400/16 bg-[linear-gradient(135deg,rgba(103,232,249,0.12),rgba(15,23,42,0.34))] shadow-[var(--glow-cyan)]"
                  transition={{
                    type: "spring",
                    stiffness: 450,
                    damping: 32,
                  }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5 whitespace-nowrap">
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={cn(
                      "flex h-[17px] min-w-4.5 items-center justify-center rounded-full px-1 text-[9px] font-bold",
                      isActive
                        ? "bg-cyan-300/15 text-cyan-100"
                        : "bg-muted/80 text-muted-foreground"
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
