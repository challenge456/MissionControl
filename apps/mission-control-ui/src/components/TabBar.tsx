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
        "flex items-center gap-1 px-4 py-2.5",
        "border-b border-[var(--glass-border)] bg-[var(--glass-bg)]/90 backdrop-blur-[var(--blur-panel)]",
        className
      )}
      role="tablist"
    >
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
              "relative rounded-lg px-3.5 py-1.5",
              "text-[11.5px] font-semibold tracking-wide",
              "transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
              isActive
                ? "text-[var(--neon-green)]"
                : "text-muted-foreground hover:text-foreground hover:bg-[var(--neon-cyan-dim)]"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="tab-bar-pill"
                className="absolute inset-0 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border-green)] shadow-[var(--glow-green)]"
                transition={{
                  type: "spring",
                  stiffness: 450,
                  damping: 32,
                }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={cn(
                    "min-w-[18px] h-[17px] flex items-center justify-center",
                    "rounded-full text-[9px] font-bold px-1",
                    isActive
                      ? "bg-primary/15 text-primary"
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
  );
}
