import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Search, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SearchBarProps {
  projectId: string | undefined;
  onResultClick: (taskId: string) => void;
}

type SearchHit =
  | { type: "task"; id: string; title: string; subtitle: string; taskId: string }
  | { type: "approval"; id: string; title: string; subtitle: string; taskId?: string };

export function SearchBar({ projectId, onResultClick }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [nonActionableFeedback, setNonActionableFeedback] = useState(false);

  const results = useQuery(
    api.search.searchAll,
    query.length >= 2 && projectId
      ? { projectId: projectId as any, query, limit: 10 }
      : "skip"
  );

  const taskResults = results?.tasks ?? [];
  const approvalResults = results?.approvals ?? [];
  const agentResults = results?.agents ?? [];
  const messageResults = results?.messages ?? [];

  const flatResults = useMemo<SearchHit[]>(() => {
    const taskHits: SearchHit[] = taskResults.map((task) => ({
      type: "task",
      id: `task-${task._id}`,
      title: task.title,
      subtitle: `${task.status} · ${task.type} · P${task.priority}`,
      taskId: task._id,
    }));
    const approvalHits: SearchHit[] = approvalResults.map((approval) => ({
      type: "approval",
      id: `approval-${approval._id}`,
      title: approval.actionSummary,
      subtitle: `${approval.status} · ${approval.riskLevel} · ${approval.actionType}`,
      taskId: approval.taskId ?? undefined,
    }));
    return [...taskHits, ...approvalHits];
  }, [taskResults, approvalResults]);

  useEffect(() => {
    const hasAny =
      taskResults.length > 0 ||
      approvalResults.length > 0 ||
      agentResults.length > 0 ||
      messageResults.length > 0;
    setIsOpen(query.length >= 2 && hasAny);
    setSelectedIndex(0);
  }, [query, taskResults.length, approvalResults.length, agentResults.length, messageResults.length]);

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!flatResults.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, flatResults.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const selected = flatResults[selectedIndex];
      if (!selected) return;

      if (selected.type === "task") {
        onResultClick(selected.taskId);
        setQuery("");
        setIsOpen(false);
      } else if (selected.type === "approval") {
        if (selected.taskId) {
          onResultClick(selected.taskId);
          setQuery("");
          setIsOpen(false);
        } else {
          setNonActionableFeedback(true);
          setTimeout(() => setNonActionableFeedback(false), 1200);
        }
      }
      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
    }
  }

  const noResults = query.length >= 2 && !!results && !results.totalResults;

  return (
    <div className="relative w-full max-w-[460px]">
      <div className="relative">
        <Search size={15} strokeWidth={1.7} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden />
        <Input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder="Search tasks, approvals, agents..."
          className="h-9 rounded-lg border-line bg-surface-1 pl-9 text-[13.5px] placeholder:text-ink-muted"
          aria-label="Search tasks, approvals, and agents"
        />
      </div>

      {isOpen && (
        <div className="absolute z-[1000] mt-2 w-full overflow-hidden rounded-xl border border-line bg-surface-3 shadow-[var(--shadow-elevation-2)]">
          <div className="border-b border-line px-4 py-3 text-[11.5px] font-medium text-ink-muted">
            {nonActionableFeedback ? (
              <span className="text-warn">This item has no linked task</span>
            ) : (
              <>{results?.totalResults ?? 0} result(s)</>
            )}
          </div>
          <ScrollArea className="max-h-[420px]">
            <SearchSection
              title="Tasks"
              rows={taskResults.map((task) => ({
                key: `task-${task._id}`,
                title: task.title,
                subtitle: `${task.status} · ${task.type} · P${task.priority}`,
                onClick: () => {
                  onResultClick(task._id);
                  setQuery("");
                  setIsOpen(false);
                },
                isSelected: flatResults[selectedIndex]?.id === `task-${task._id}`,
              }))}
            />

            <SearchSection
              title="Approvals"
              rows={approvalResults.map((approval) => ({
                key: `approval-${approval._id}`,
                title: approval.actionSummary,
                subtitle: `${approval.status} · ${approval.riskLevel} · ${approval.actionType}`,
                onClick: approval.taskId
                  ? () => {
                      onResultClick(approval.taskId as string);
                      setQuery("");
                      setIsOpen(false);
                    }
                  : undefined,
                isSelected: flatResults[selectedIndex]?.id === `approval-${approval._id}`,
              }))}
            />

            <SearchSection
              title="Agents"
              rows={agentResults.map((agent) => ({
                key: `agent-${agent._id}`,
                title: agent.name,
                subtitle: `${agent.role} · ${agent.status}`,
                onClick: undefined,
                isSelected: false,
              }))}
            />

            <SearchSection
              title="Messages"
              rows={messageResults.slice(0, 4).map((message) => ({
                key: `message-${message._id}`,
                title: message.content.slice(0, 80),
                subtitle: message.type,
                onClick: message.taskId
                  ? () => {
                      onResultClick(message.taskId as string);
                      setQuery("");
                      setIsOpen(false);
                    }
                  : undefined,
                isSelected: false,
              }))}
            />
          </ScrollArea>
        </div>
      )}

      {noResults && (
        <div className="absolute z-[1000] mt-2 w-full rounded-xl border border-line bg-surface-3 px-4 py-3 text-center text-[13.5px] text-ink-muted shadow-[var(--shadow-elevation-2)]">
          No results for "{query}"
        </div>
      )}
    </div>
  );
}

function SearchSection({
  title,
  rows,
}: {
  title: string;
  rows: Array<{
    key: string;
    title: string;
    subtitle: string;
    onClick?: () => void;
    isSelected: boolean;
  }>;
}) {
  if (!rows.length) return null;

  return (
    <div className="border-b border-line p-2 last:border-b-0">
      <p className="mb-1 px-2 text-[11.5px] font-medium uppercase tracking-[0.06em] text-ink-muted">
        {title}
      </p>
      {rows.map((row) => (
        <button
          key={row.key}
          type="button"
          onClick={row.onClick}
          disabled={!row.onClick}
          className={cn(
            "w-full rounded-lg px-3 py-2.5 text-left transition-colors duration-150",
            row.isSelected && "bg-surface-2",
            row.onClick
              ? "cursor-pointer text-ink hover:bg-surface-2"
              : "cursor-default text-ink-secondary"
          )}
        >
          <span className="flex items-center gap-2 truncate text-[13.5px] font-medium">
            {title === "Agents" && <Bot size={14} strokeWidth={1.7} aria-hidden />}
            <span className="truncate">{row.title}</span>
          </span>
          <span className="block truncate text-[12.5px] text-ink-muted">{row.subtitle}</span>
        </button>
      ))}
    </div>
  );
}
