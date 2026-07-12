import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Keyboard } from "lucide-react";

interface KeyboardShortcutsProps {
  onNewTask: () => void;
  onSearch: () => void;
  onApprovals: () => void;
  onAgents: () => void;
  onCostAnalytics?: () => void;
  onGoToBoard?: () => void;
  onShowHelp?: () => void;
  onMission?: () => void;
}

export function useKeyboardShortcuts({
  onNewTask,
  onSearch,
  onApprovals,
  onAgents,
  onCostAnalytics,
  onGoToBoard,
  onShowHelp,
  onMission,
}: KeyboardShortcutsProps) {
  const pendingGRef = useRef(false);
  const gTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      const isMod = e.metaKey || e.ctrlKey;

      // Mod shortcuts
      if (isMod) {
        switch (e.key.toLowerCase()) {
          case "n":
            e.preventDefault();
            onNewTask();
            return;
          case "k":
            e.preventDefault();
            onSearch();
            return;
          case "a":
            if (!e.shiftKey) return;
            e.preventDefault();
            onApprovals();
            return;
          case "i":
            if (!e.shiftKey) return;
            e.preventDefault();
            onCostAnalytics?.();
            return;
          case "e":
            e.preventDefault();
            onAgents();
            return;
          case "m":
            e.preventDefault();
            onMission?.();
            return;
        }
        return;
      }

      // Non-mod shortcuts
      switch (e.key) {
        case "/":
          e.preventDefault();
          onSearch();
          return;
        case "?":
          e.preventDefault();
          onShowHelp?.();
          return;
        case "g":
          // Start "g then ..." sequence
          pendingGRef.current = true;
          if (gTimerRef.current) clearTimeout(gTimerRef.current);
          gTimerRef.current = setTimeout(() => {
            pendingGRef.current = false;
          }, 500);
          return;
        case "b":
          if (pendingGRef.current) {
            e.preventDefault();
            pendingGRef.current = false;
            if (gTimerRef.current) clearTimeout(gTimerRef.current);
            onGoToBoard?.();
          }
          return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (gTimerRef.current) clearTimeout(gTimerRef.current);
    };
  }, [onNewTask, onSearch, onApprovals, onAgents, onCostAnalytics, onGoToBoard, onShowHelp, onMission]);
}

const shortcutGroups = [
  {
    title: "Navigation",
    shortcuts: [
      { keys: ["/"], description: "Focus search / command palette" },
      { keys: ["g", "b"], description: "Go to board" },
      { keys: ["?"], description: "Show keyboard shortcuts" },
    ],
  },
  {
    title: "Actions",
    shortcuts: [
      { keys: ["⌘", "N"], description: "Create new task" },
      { keys: ["⌘", "K"], description: "Open command palette" },
      { keys: ["⇧", "⌘", "A"], description: "View approvals" },
      { keys: ["⇧", "⌘", "I"], description: "Open cost analytics" },
      { keys: ["⌘", "E"], description: "View agents" },
      { keys: ["⌘", "M"], description: "Edit mission statement" },
      { keys: ["Insights"], description: "Top bar → Cost Analytics, Health, Monitoring" },
    ],
  },
  {
    title: "General",
    shortcuts: [
      { keys: ["Esc"], description: "Close modal / drawer" },
    ],
  },
];

export function KeyboardShortcutsHelp({ onClose }: { onClose: () => void }) {
  const [, setMounted] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
    closeRef.current?.focus();

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      <div
        className="bg-surface-3 border border-line rounded-xl p-6 max-w-[480px] w-full shadow-[var(--shadow-elevation-2)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-5">
          <Keyboard className="h-5 w-5 text-ink-muted" strokeWidth={1.75} />
          <h2 className="text-[15px] font-semibold text-ink">Keyboard Shortcuts</h2>
        </div>

        <div className="flex flex-col gap-4">
          {shortcutGroups.map((group, gi) => (
            <div key={group.title}>
              {gi > 0 && <Separator className="mb-3" />}
              <p className="text-[11.5px] font-semibold text-ink-muted uppercase tracking-wider mb-2">
                {group.title}
              </p>
              <div className="flex flex-col gap-1.5">
                {group.shortcuts.map((shortcut, si) => (
                  <div
                    key={si}
                    className="flex items-center justify-between py-1.5"
                  >
                    <span className="text-[13.5px] text-ink">{shortcut.description}</span>
                    <div className="flex gap-1">
                      {shortcut.keys.map((key, ki) => (
                        <kbd
                          key={ki}
                          className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 bg-surface-2 border border-line rounded text-[11px] font-mono text-ink-muted"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Button
          ref={closeRef}
          onClick={onClose}
          className="w-full mt-5"
          size="sm"
        >
          Got it
        </Button>
      </div>
    </div>
  );
}
