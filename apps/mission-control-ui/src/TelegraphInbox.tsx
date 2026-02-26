/**
 * Telegraph Inbox — theme-aware rewrite
 */

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Send, MessageSquare } from "lucide-react";

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
  TELEGRAM: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  INTERNAL: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
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
  const createThread  = useMutation(api.telegraph.createThread);
  const sendMessage   = useMutation(api.telegraph.sendMessage);

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

  /* ── Thread detail view ── */
  if (selectedThreadId && selectedThread) {
    return (
      <main className="flex-1 overflow-auto p-6">
        <button
          onClick={() => setSelectedThreadId(null)}
          className="flex items-center gap-1.5 text-sm text-primary hover:underline mb-5"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Inbox
        </button>

        <Card className="max-w-2xl overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-foreground">{selectedThread.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedThread.channel} · {selectedThread.participants?.length ?? 0} participants · {selectedThread.messageCount} messages
              </p>
            </div>
            {selectedThread.linkedTaskId && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
                Linked to Task
              </Badge>
            )}
          </div>

          {/* Messages */}
          <div className="p-4 max-h-[500px] overflow-auto flex flex-col gap-3">
            {(selectedThread.messages ?? []).map((msg: Message) => (
              <div
                key={msg._id}
                className={cn(
                  "rounded-lg p-3 border",
                  msg.senderType === "HUMAN"
                    ? "bg-primary/8 border-primary/20 ml-8"
                    : "bg-muted/50 border-border"
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-primary">
                    {msg.senderId} <span className="text-muted-foreground font-normal">({msg.senderType})</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(msg._creationTime).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-foreground">{msg.content}</p>
              </div>
            ))}
            {(selectedThread.messages ?? []).length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">No messages yet.</div>
            )}
          </div>

          {/* Compose */}
          <div className="px-4 py-3 border-t border-border flex gap-2">
            <input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button size="sm" onClick={handleSendMessage} disabled={!messageText.trim()}>
              <Send className="h-3.5 w-3.5 mr-1.5" /> Send
            </Button>
          </div>
        </Card>
      </main>
    );
  }

  /* ── Inbox list view ── */
  return (
    <main className="flex-1 overflow-auto p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-foreground">Telegraph Inbox</h2>
          <p className="text-xs text-muted-foreground">{(threads ?? []).length} threads</p>
        </div>
        <Button size="sm" onClick={() => setComposing(true)}>
          <Plus className="h-3.5 w-3.5 mr-1.5" /> New Thread
        </Button>
      </div>

      {/* Compose row */}
      {composing && (
        <Card className="p-4 mb-4 flex gap-2">
          <input
            value={newThreadTitle}
            onChange={(e) => setNewThreadTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateThread()}
            placeholder="Thread title..."
            autoFocus
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleCreateThread}>
            Create
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setComposing(false); setNewThreadTitle(""); }}>
            Cancel
          </Button>
        </Card>
      )}

      {/* Thread list */}
      <div className="flex flex-col gap-2">
        {(threads ?? []).map((thread: Thread) => (
          <Card
            key={thread._id}
            onClick={() => setSelectedThreadId(thread._id)}
            className="px-5 py-4 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <Badge
                  variant="outline"
                  className={cn("text-[10px] font-bold px-2 py-0.5 shrink-0", CHANNEL_BADGE[thread.channel] ?? CHANNEL_BADGE.INTERNAL)}
                >
                  {thread.channel}
                </Badge>
                <p className="text-sm font-semibold text-foreground truncate">{thread.title}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MessageSquare className="h-3 w-3" />
                  {thread.messageCount}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {thread.lastMessageAt ? new Date(thread.lastMessageAt).toLocaleDateString() : "—"}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 pl-0">
              {thread.participants?.length ?? 0} participants
              {thread.linkedTaskId && " · Linked to task"}
            </p>
          </Card>
        ))}

        {(threads ?? []).length === 0 && (
          <Card className="py-16 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No threads yet.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Create one to start communicating.</p>
          </Card>
        )}
      </div>
    </main>
  );
}
