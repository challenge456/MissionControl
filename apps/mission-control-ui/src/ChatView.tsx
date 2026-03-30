import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id, Doc } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { PageHeader } from "./components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send, Sparkles, X, Bot, User, Wrench, Reply, Loader2, Paperclip } from "lucide-react";

interface ChatViewProps {
  projectId: Id<"projects"> | null;
}

export function ChatView({ projectId }: ChatViewProps) {
  const tasks = useQuery(api.tasks.list, { projectId: projectId ?? undefined });
  const [selectedTaskId, setSelectedTaskId] = useState<Id<"tasks"> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const availableTasks = tasks ?? [];
  const selectedTask = availableTasks.find((task) => task._id === selectedTaskId) ?? null;
  const activeThreads = availableTasks.filter((task) =>
    ["IN_PROGRESS", "REVIEW", "NEEDS_APPROVAL"].includes(task.status)
  ).length;
  const blockedThreads = availableTasks.filter((task) => task.status === "BLOCKED").length;
  const inboxThreads = availableTasks.filter((task) => task.status === "INBOX").length;

  const filteredTasks = searchQuery
    ? availableTasks.filter((task) =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : availableTasks;

  useEffect(() => {
    if (!selectedTaskId && tasks && tasks.length > 0) {
      setSelectedTaskId(tasks[0]._id);
    }
  }, [selectedTaskId, tasks]);

  if (!tasks) {
    return (
      <main className="mc-page">
        <div className="mc-page-body">
          <div className="h-[620px] rounded-2xl border border-[var(--panel-line)] skeleton-shimmer" />
        </div>
      </main>
    );
  }

  if (availableTasks.length === 0) {
    return (
      <main className="mc-page">
        <PageHeader
          title="Chat"
          description="Task threads and agent conversations. Create a task from the Mission Queue to start."
          icon={<MessageSquare className="h-4.5 w-4.5" strokeWidth={1.7} />}
        />
        <div className="mc-page-body">
          <Card className="flex min-h-[560px] flex-col items-center justify-center p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-100 shadow-[var(--glow-cyan)]">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="mt-5 text-2xl font-semibold text-foreground">No task threads yet</div>
            <div className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Create a task from the Mission Queue in Operations to start a thread and collaborate with agents in a traceable, reviewable way.
            </div>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="mc-page flex flex-col">
      <PageHeader
        title="Chat"
        description={`${availableTasks.length} task threads · Pick one to view or continue the conversation`}
        icon={<MessageSquare className="h-4.5 w-4.5" strokeWidth={1.7} />}
        status={
          <Badge variant="outline" className="border-cyan-300/20 text-cyan-100">
            {availableTasks.length} threads
          </Badge>
        }
      />
      <div className="mc-page-body mc-page-stack flex flex-1 min-h-0">
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4">
            <div className="mc-kicker">Open threads</div>
            <div className="mt-2 text-3xl font-semibold text-foreground">{availableTasks.length}</div>
            <div className="mt-1 text-xs text-muted-foreground">Operator-visible conversations across the mission queue</div>
          </Card>
          <Card className="p-4">
            <div className="mc-kicker">Active lanes</div>
            <div className="mt-2 text-3xl font-semibold text-cyan-100">{activeThreads}</div>
            <div className="mt-1 text-xs text-muted-foreground">Threads tied to active work or review states</div>
          </Card>
          <Card className="p-4">
            <div className="mc-kicker">Inbox pressure</div>
            <div className="mt-2 text-3xl font-semibold text-amber-100">{inboxThreads}</div>
            <div className="mt-1 text-xs text-muted-foreground">New work still waiting for assignment or first response</div>
          </Card>
          <Card className="p-4">
            <div className="mc-kicker">Blocked threads</div>
            <div className="mt-2 text-3xl font-semibold text-rose-200">{blockedThreads}</div>
            <div className="mt-1 text-xs text-muted-foreground">Conversations attached to work that cannot move forward yet</div>
          </Card>
        </div>

        <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[340px_minmax(0,1fr)_300px]">
          <Card className="flex min-h-0 flex-col overflow-hidden">
            <div className="border-b border-[var(--panel-line)] px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="mc-kicker">Thread registry</div>
                  <div className="mt-1 text-sm font-semibold text-foreground">Open task conversations</div>
                </div>
                <Badge variant="outline" className="border-cyan-300/20 text-cyan-100">
                  {availableTasks.length}
                </Badge>
              </div>
            </div>
            <div className="relative border-b border-[var(--panel-line)] p-3">
              <input
                type="text"
                placeholder="Search task threads..."
                className="w-full rounded-lg border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-3 py-2.5 pr-9 text-sm text-foreground"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-5 top-1/2 -translate-y-1/2 border-none bg-transparent p-1 text-base text-muted-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
              )}
            </div>
            <div className="flex-1 overflow-auto p-3">
              {filteredTasks.map((task) => (
                <ThreadItem
                  key={task._id}
                  task={task}
                  isSelected={task._id === selectedTaskId}
                  onSelect={() => setSelectedTaskId(task._id)}
                />
              ))}
              {filteredTasks.length === 0 && searchQuery && (
                <div className="rounded-lg border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-4 py-8 text-center">
                  <div className="mb-1 text-sm text-muted-foreground">No tasks found</div>
                  <div className="text-xs text-muted-foreground/70">Try a different search</div>
                </div>
              )}
            </div>
          </Card>

          <Card className="flex min-h-0 flex-col overflow-hidden">
            {selectedTaskId ? (
              <ThreadView taskId={selectedTaskId} />
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center p-12 text-center">
                <div className="mb-4 text-6xl">💬</div>
                <div className="mb-2 text-2xl font-semibold text-foreground">Select a thread</div>
                <div className="text-base text-muted-foreground">
                  Choose a task from the registry to view its conversation.
                </div>
              </div>
            )}
          </Card>

          <Card className="flex min-h-0 flex-col overflow-hidden">
            <div className="border-b border-[var(--panel-line)] px-5 py-4">
              <div className="mc-kicker">Operator cues</div>
              <div className="mt-1 text-sm font-semibold text-foreground">
                {selectedTask ? "Selected thread posture" : "How to use this surface well"}
              </div>
            </div>
            <div className="flex-1 space-y-3 overflow-auto px-4 py-4">
              {selectedTask ? (
                <>
                  <div className="rounded-lg border border-[var(--panel-line)] bg-[color:var(--shell-panel)] p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/70">Thread context</div>
                    <div className="mt-2 text-sm font-semibold text-foreground">{selectedTask.title}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="outline" className="border-cyan-300/20 text-cyan-100">{selectedTask.status}</Badge>
                      <Badge variant="outline" className="border-[var(--panel-line)] text-muted-foreground">
                        Priority {selectedTask.priority}
                      </Badge>
                      <Badge variant="outline" className="border-[var(--panel-line)] text-muted-foreground">
                        {selectedTask.type}
                      </Badge>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                      {selectedTask.description?.trim() || "No task description is attached yet. Add operator framing so agents know what matters and what is out of scope."}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[var(--panel-line)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--shell-panel)_92%,transparent),color-mix(in_srgb,var(--background)_88%,transparent))] p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-200/70">Response discipline</div>
                    <div className="mt-2 space-y-2 text-xs leading-relaxed text-muted-foreground">
                      <p>Lead with the decision or blocker first. Agents should not have to infer the action from a paragraph.</p>
                      <p>Use mentions only when routing matters. Thread noise makes later review harder.</p>
                      <p>Keep approval asks explicit: what changed, what is blocked, what decision is needed.</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-200/70">Start with the queue</div>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      Use this page for ongoing task dialogue, not brainstorming. Every thread should map back to real work that can be reviewed later.
                    </p>
                  </div>
                  <div className="rounded-xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-200/70">Good thread hygiene</div>
                    <ul className="mt-2 space-y-2 text-xs leading-relaxed text-muted-foreground">
                      <li>State the desired outcome before asking for implementation.</li>
                      <li>Move blockers into approvals or operations instead of letting them linger in chat.</li>
                      <li>Keep one conversation per task so audit trails stay trustworthy.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}

interface ThreadItemProps {
  task: Doc<"tasks">;
  isSelected: boolean;
  onSelect: () => void;
}

function ThreadItem({ task, isSelected, onSelect }: ThreadItemProps) {
  const messages = useQuery(api.messages.listByTask, { taskId: task._id });
  const messageCount = messages?.length ?? 0;
  const hasMessages = messageCount > 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "mb-2 w-full cursor-pointer rounded-xl border p-3.5 text-left transition-all",
        isSelected
          ? "border-cyan-300/20 bg-cyan-400/10 shadow-[var(--glow-cyan)]"
          : "border-[var(--panel-line)] bg-[color:var(--shell-panel)] hover:border-[var(--panel-line-strong)] hover:bg-cyan-400/6"
      )}
      aria-label={`Thread: ${task.title}`}
    >
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex-1 truncate text-sm font-semibold text-foreground">
          {task.title}
        </div>
        <div className="flex items-center gap-1.5">
          {hasMessages && (
            <div className="min-w-4.5 rounded-xl bg-primary px-1.5 py-0.5 text-center text-[0.7rem] font-semibold text-white">
              {messageCount}
            </div>
          )}
          <div className="rounded-full border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {task.status}
          </div>
        </div>
      </div>
      {task.description && (
        <div className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {task.description}
        </div>
      )}
    </button>
  );
}

interface ThreadViewProps {
  taskId: Id<"tasks">;
}

function ThreadView({ taskId }: ThreadViewProps) {
  const messages = useQuery(api.messages.listByTask, { taskId });
  const task = useQuery(api.tasks.get, { taskId });
  const agents = useQuery(api.agents.list, { projectId: task?.projectId });
  const postMessage = useMutation(api.messages.post);

  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [replyTo, setReplyTo] = useState<Doc<"messages"> | null>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages?.length]);

  useEffect(() => {
    const lastAtIndex = messageText.lastIndexOf("@");
    if (lastAtIndex !== -1 && lastAtIndex === messageText.length - 1) {
      setShowMentions(true);
      setMentionQuery("");
    } else if (lastAtIndex !== -1) {
      const afterAt = messageText.slice(lastAtIndex + 1);
      if (!afterAt.includes(" ")) {
        setShowMentions(true);
        setMentionQuery(afterAt);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  }, [messageText]);

  if (!messages || !task) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        Loading messages...
      </div>
    );
  }

  const handleSendMessage = async () => {
    if (!messageText.trim() || isSending) return;

    const mentionMatches = messageText.match(/@(\w+)/g);
    const mentions = mentionMatches ? mentionMatches.map(m => m.slice(1)) : undefined;

    setIsSending(true);
    try {
      await postMessage({
        taskId,
        type: "COMMENT",
        content: messageText.trim(),
        authorType: "HUMAN",
        authorUserId: "operator",
        mentions,
        replyToId: replyTo?._id,
      });
      setMessageText("");
      setReplyTo(null);
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleMentionSelect = (agentName: string) => {
    const lastAtIndex = messageText.lastIndexOf("@");
    const newText = messageText.slice(0, lastAtIndex + 1) + agentName + " ";
    setMessageText(newText);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const filteredAgents = agents?.filter(a =>
    a.name.toLowerCase().includes(mentionQuery.toLowerCase())
  ) ?? [];

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-[var(--panel-line)] px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mc-kicker">Thread detail</div>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">{task.title}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline" className="border-cyan-300/20 text-cyan-100">
                {task.status}
              </Badge>
              <Badge variant="outline" className="border-[var(--panel-line)] text-muted-foreground">
                {task.type}
              </Badge>
            </div>
          </div>
          <Button variant="outline" size="sm">
            <Sparkles className="h-3.5 w-3.5" />
            Prompt assist
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-auto p-6" ref={messageListRef}>
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] p-12 text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-xl border border-cyan-300/16 bg-cyan-400/8 text-cyan-100 shadow-[var(--glow-cyan)]">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div className="mb-1 text-lg font-semibold text-foreground">No messages yet</div>
            <div className="text-sm text-muted-foreground">Start the conversation with a clear operator instruction.</div>
          </div>
        ) : (
          messages.map((message) => (
            <Message
              key={message._id}
              message={message}
              onReply={() => setReplyTo(message)}
            />
          ))
        )}
      </div>

      <div className="relative border-t border-[var(--panel-line)]">
        {replyTo && (
          <div className="flex items-center justify-between border-b border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-4 py-2">
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-xs font-semibold text-primary">
                Replying to {replyTo.authorType}:
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {replyTo.content.length > 50
                  ? replyTo.content.slice(0, 50) + "..."
                  : replyTo.content}
              </span>
            </div>
            <button
              onClick={() => setReplyTo(null)}
              className="border-none bg-transparent p-1 text-base text-muted-foreground"
              aria-label="Cancel reply"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {showMentions && filteredAgents.length > 0 && (
          <div className="absolute bottom-full left-6 right-6 z-10 max-h-[200px] overflow-auto rounded-xl border border-[var(--panel-line)] bg-[color:var(--panel-elevated-bg)] shadow-[var(--card-shadow)]">
            {filteredAgents.slice(0, 5).map((agent) => (
              <button
                key={agent._id}
                onClick={() => handleMentionSelect(agent.name)}
                className="flex w-full items-center gap-2 border-b border-[var(--panel-line)] bg-transparent px-3 py-2.5 text-left transition-colors hover:bg-cyan-400/6"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-300/16 bg-cyan-400/8 text-cyan-100">
                  <Bot className="h-4 w-4" />
                </span>
                <span className="flex-1 text-sm font-semibold text-foreground">{agent.name}</span>
                <span className="text-xs text-muted-foreground">{agent.role}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex items-end gap-3 px-6 py-4">
          <textarea
            ref={inputRef}
            placeholder="Type a message... (Press Enter to send, Shift+Enter for new line, @ to mention)"
            className="min-h-[48px] max-h-[120px] flex-1 resize-none rounded-lg border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-4 py-3 font-[inherit] text-sm text-foreground"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isSending}
            rows={1}
          />
          <Button
            variant="neon-cyan"
            size="lg"
            className={cn("min-w-[52px] px-4", (isSending || !messageText.trim()) && "cursor-not-allowed opacity-50")}
            onClick={handleSendMessage}
            disabled={isSending || !messageText.trim()}
            aria-label="Send message"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface MessageProps {
  message: Doc<"messages">;
  onReply: () => void;
}

function Message({ message, onReply }: MessageProps) {
  const isAgent = message.authorType === "AGENT";
  const isSystem = message.authorType === "SYSTEM";
  const [showActions, setShowActions] = useState(false);
  const AuthorIcon = isAgent ? Bot : isSystem ? Wrench : User;

  const formatContent = (content: string) => {
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        return (
          <span key={i} className="rounded-sm bg-primary/20 px-1 py-0.5 font-semibold text-primary">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3.5",
        isAgent && "border-cyan-300/20 bg-cyan-400/6",
        isSystem && "border-emerald-300/20 bg-emerald-400/6",
        !isAgent && !isSystem && "border-[var(--panel-line)] bg-[color:var(--shell-panel)]"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1 text-sm font-semibold text-foreground">
          <AuthorIcon className="h-4 w-4 text-cyan-100" /> {message.authorType}
          {message.authorUserId && (
            <span className="text-xs font-normal text-muted-foreground/70">
              {" "}({message.authorUserId})
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground/70">
            {new Date(message._creationTime).toLocaleTimeString()}
          </div>
          {showActions && (
            <button
              onClick={onReply}
              className="border-none bg-transparent p-1 text-base opacity-70 transition-opacity hover:opacity-100"
              aria-label="Reply to message"
            >
              <Reply className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {message.replyToId && (
        <div className="mb-1.5 text-xs italic text-primary">
          <span className="inline-flex items-center gap-1">
            <Reply className="h-3.5 w-3.5" />
            Reply to previous message
          </span>
        </div>
      )}

      <div className="mb-1.5 text-sm leading-relaxed text-foreground">
        {formatContent(message.content)}
      </div>

      {message.type && (
        <div className="text-xs italic text-muted-foreground">{message.type}</div>
      )}

      {message.artifacts && message.artifacts.length > 0 && (
        <div className="mt-2 flex flex-col gap-1">
          {message.artifacts.map((artifact, i) => (
            <div key={i} className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Paperclip className="h-3.5 w-3.5" />
                {artifact.name} ({artifact.type})
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
