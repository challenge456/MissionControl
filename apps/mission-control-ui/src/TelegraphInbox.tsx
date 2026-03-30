import { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Send, MessageSquare, Radio } from "lucide-react";
import { PageHeader } from "./components/PageHeader";

type Thread = {
  _id: Id<"telegraphThreads">;
  title: string;
  channel: string;
  participants?: string[];
  messageCount: number;
  lastMessageAt?: number;
  linkedTaskId?: string;
  messages?: Message[];
};

type Message = {
  _id: string;
  senderId: string;
  senderType: string;
  content: string;
  _creationTime: number;
};

const CHANNEL_BADGE: Record<string, string> = {
  TELEGRAM: "border-amber-300/20 bg-amber-400/10 text-amber-100",
  INTERNAL: "border-cyan-300/20 bg-cyan-400/10 text-cyan-100",
};

export function TelegraphInbox({ projectId }: { projectId: Id<"projects"> | null }) {
  const [selectedThreadId, setSelectedThreadId] = useState<Id<"telegraphThreads"> | null>(null);
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [composing, setComposing] = useState(false);
  const [messageText, setMessageText] = useState("");

  const threads = useQuery(api.telegraph.listThreads, projectId ? { projectId } : {});
  const selectedThread = useQuery(
    api.telegraph.getThread,
    selectedThreadId ? { threadId: selectedThreadId } : "skip"
  ) as Thread | null | undefined;
  const createThread = useMutation(api.telegraph.createThread);
  const sendMessage = useMutation(api.telegraph.sendMessage);

  const threadList = threads ?? [];
  const internalCount = threadList.filter((thread) => thread.channel === "INTERNAL").length;
  const telegramCount = threadList.filter((thread) => thread.channel === "TELEGRAM").length;
  const linkedCount = threadList.filter((thread) => Boolean(thread.linkedTaskId)).length;
  const mostRecentLabel = useMemo(() => {
    const latest = [...threadList]
      .map((thread) => thread.lastMessageAt ?? 0)
      .sort((left, right) => right - left)[0];
    return latest ? new Date(latest).toLocaleDateString() : "No activity";
  }, [threadList]);

  const handleCreateThread = async () => {
    if (!newThreadTitle.trim()) return;
    const threadId = await createThread({
      projectId: projectId ?? undefined,
      title: newThreadTitle.trim(),
      participants: [],
      channel: "INTERNAL",
    });
    setNewThreadTitle("");
    setComposing(false);
    setSelectedThreadId(threadId);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedThreadId) return;
    await sendMessage({
      threadId: selectedThreadId,
      senderId: "OPERATOR",
      senderType: "HUMAN",
      content: messageText.trim(),
      channel: "INTERNAL",
      projectId: projectId ?? undefined,
    });
    setMessageText("");
  };

  if (selectedThreadId && selectedThread) {
    const messages = selectedThread.messages ?? [];
    return (
      <main className="mc-page">
        <PageHeader
          title={selectedThread.title}
          description="Message history, operator notes, and linked work for this thread."
          eyebrow="Comms"
          icon={<MessageSquare className="h-4.5 w-4.5" strokeWidth={1.7} />}
          status={
            <Badge variant="outline" className={CHANNEL_BADGE[selectedThread.channel] ?? CHANNEL_BADGE.INTERNAL}>
              {selectedThread.channel}
            </Badge>
          }
          actions={
            <Button size="sm" variant="outline" onClick={() => setSelectedThreadId(null)}>
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to inbox
            </Button>
          }
        />
        <div className="mc-page-body mc-page-stack">
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard label="Messages" value={selectedThread.messageCount} tone="default" />
            <StatCard label="Participants" value={selectedThread.participants?.length ?? 0} tone="default" />
            <StatCard label="Linked task" value={selectedThread.linkedTaskId ? 1 : 0} tone="cyan" />
            <StatCard label="Last activity" value={selectedThread.lastMessageAt ? new Date(selectedThread.lastMessageAt).toLocaleDateString() : "—"} tone="amber" />
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
            <Card className="flex min-h-[540px] flex-col overflow-hidden">
              <div className="border-b border-[var(--panel-line)] px-5 py-4">
                <div className="mc-kicker">Thread log</div>
                <div className="mt-1 text-sm font-semibold text-foreground">Conversation history</div>
              </div>
              <div className="flex-1 space-y-3 overflow-auto px-4 py-4">
                {messages.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[var(--panel-line)] px-4 py-10 text-center text-sm text-muted-foreground">
                    No messages yet.
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message._id}
                      className={cn(
                        "rounded-lg border px-4 py-3",
                        message.senderType === "HUMAN"
                          ? "ml-10 border-cyan-300/20 bg-cyan-400/10"
                          : "border-[var(--panel-line)] bg-[color:var(--shell-panel)]"
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-xs font-semibold text-foreground">{message.senderId}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {new Date(message._creationTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                      <div className="mt-2 text-sm leading-relaxed text-muted-foreground">{message.content}</div>
                    </div>
                  ))
                )}
              </div>
              <div className="border-t border-[var(--panel-line)] px-4 py-3">
                <div className="flex gap-2">
                  <input
                    value={messageText}
                    onChange={(event) => setMessageText(event.target.value)}
                    onKeyDown={(event) => event.key === "Enter" && !event.shiftKey && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 rounded-lg border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-3 py-2.5 text-sm text-foreground outline-none"
                  />
                  <Button size="sm" variant="neon-cyan" onClick={handleSendMessage} disabled={!messageText.trim()}>
                    <Send className="h-3.5 w-3.5" />
                    Send
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="mc-kicker">Thread posture</div>
              <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted-foreground">
                <p>Use Telegraph for lightweight coordination and external channels. Push anything durable or approval-sensitive back into tasks.</p>
                <p>
                  {selectedThread.linkedTaskId
                    ? "This thread is already tied to work, which is good. Keep decisions crisp so the task record stays trustworthy."
                    : "This thread is not linked to a task yet. If it affects delivery, route it into Operations before it becomes orphaned context."}
                </p>
              </div>
            </Card>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mc-page">
      <PageHeader
        title="Telegraph"
        description={
          threadList.length > 0
            ? `${threadList.length} threads · Internal and Telegram channels`
            : "Agent and operator messaging. Create a thread to coordinate without leaving Mission Control."
        }
        eyebrow="Comms"
        icon={<Radio className="h-4.5 w-4.5" strokeWidth={1.7} />}
        actions={
          <Button size="sm" variant="neon-cyan" onClick={() => setComposing(true)}>
            <Plus className="h-3.5 w-3.5" />
            New thread
          </Button>
        }
      />
      <div className="mc-page-body mc-page-stack">
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Threads" value={threadList.length} tone="default" />
          <StatCard label="Internal" value={internalCount} tone="cyan" />
          <StatCard label="Telegram" value={telegramCount} tone="amber" />
          <StatCard label="Linked work" value={linkedCount} detail={mostRecentLabel} tone="default" />
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Card className="p-5">
            {composing ? (
              <div className="mb-4 rounded-xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] p-4">
                <div className="mc-kicker">Create thread</div>
                <div className="mt-1 text-sm font-semibold text-foreground">Open a new coordination lane</div>
                <div className="mt-3 flex gap-2">
                  <input
                    value={newThreadTitle}
                    onChange={(event) => setNewThreadTitle(event.target.value)}
                    onKeyDown={(event) => event.key === "Enter" && handleCreateThread()}
                    placeholder="Thread title..."
                    className="flex-1 rounded-lg border border-[var(--panel-line)] bg-background/60 px-3 py-2.5 text-sm text-foreground outline-none"
                  />
                  <Button size="sm" variant="neon-cyan" onClick={handleCreateThread}>Create</Button>
                  <Button size="sm" variant="outline" onClick={() => { setComposing(false); setNewThreadTitle(""); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="mc-kicker">Inbox</div>
            <div className="mt-1 text-sm font-semibold text-foreground">Open communication threads</div>
            {threadList.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-[var(--panel-line)] px-4 py-12 text-center">
                <div className="text-sm font-semibold text-foreground">No threads yet</div>
                <div className="mt-1 text-xs text-muted-foreground">Start a thread for operator-to-agent coordination or channel updates.</div>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {threadList.map((thread) => (
                  <button
                    key={thread._id}
                    type="button"
                    onClick={() => setSelectedThreadId(thread._id)}
                    className="w-full rounded-xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-4 py-4 text-left transition-colors hover:border-[var(--panel-line-strong)]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={CHANNEL_BADGE[thread.channel] ?? CHANNEL_BADGE.INTERNAL}>
                            {thread.channel}
                          </Badge>
                          <span className="truncate text-sm font-semibold text-foreground">{thread.title}</span>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          {thread.participants?.length ?? 0} participants
                          {thread.linkedTaskId ? " · Linked to task" : ""}
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <div>{thread.messageCount} msgs</div>
                        <div className="mt-1">{thread.lastMessageAt ? new Date(thread.lastMessageAt).toLocaleDateString() : "—"}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="mc-kicker">Channel guidance</div>
            <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>Telegraph should stay lightweight. If a conversation changes scope, cost, or approvals, move it into a task immediately.</p>
              <p>Use internal threads for operator coordination and Telegram threads for channel-adjacent updates that still need reviewable context.</p>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: number | string;
  detail?: string;
  tone: "default" | "cyan" | "amber";
}) {
  const valueClass =
    tone === "cyan" ? "text-cyan-100" : tone === "amber" ? "text-amber-100" : "text-foreground";

  return (
    <Card className="p-4">
      <div className="mc-kicker">{label}</div>
      <div className={cn("mt-2 text-3xl font-semibold", valueClass)}>{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{detail ?? "Current operator-facing messaging posture"}</div>
    </Card>
  );
}
