import { useState, useRef, useEffect, useCallback } from "react";
import { ExternalLink, FileText, ChevronRight, Search, MessageSquare, BookOpen, Loader2, Zap, RotateCcw, Send, X } from "lucide-react";
import { useAction, useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card } from "@/components/ui/card";
import { PageHeader } from "./components/PageHeader";
import { TabBar } from "./components/TabBar";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// DATA
// ---------------------------------------------------------------------------

const DOC_LINKS = [
  { title: "PRD V2",               path: "docs/PRD_V2.md",                         icon: "📋", description: "Product requirements" },
  { title: "App Flow",             path: "docs/APP_FLOW.md",                        icon: "🔄", description: "Application architecture" },
  { title: "Backend Structure",    path: "docs/BACKEND_STRUCTURE.md",              icon: "🏗️", description: "Backend overview" },
  { title: "Frontend Guidelines",  path: "docs/FRONTEND_GUIDELINES.md",            icon: "🎨", description: "UI/UX standards" },
  { title: "Tech Stack",           path: "docs/TECH_STACK.md",                     icon: "⚙️", description: "Technologies used" },
  { title: "Quick Start",          path: "docs/guides/QUICK_START_NOW.md",         icon: "🚀", description: "Get up and running" },
  { title: "Runbook",              path: "docs/runbook/RUNBOOK.md",                 icon: "📖", description: "Operations runbook" },
  { title: "Implementation Plan",  path: "docs/planning/IMPLEMENTATION_PLAN.md",  icon: "📝", description: "Implementation roadmap" },
  { title: "Architecture",         path: "docs/ARCHITECTURE.md",                   icon: "🏛️", description: "System architecture" },
  { title: "Agent Guide",          path: "docs/AGENT_GUIDE.md",                    icon: "🤖", description: "Working with agents" },
  { title: "Security Audit",       path: "docs/SECURITY_AUDIT.md",                 icon: "🔒", description: "Security review" },
  { title: "Decisions",            path: "docs/DECISIONS.md",                      icon: "⚖️", description: "Architecture decisions" },
];

interface QuickLinkItem {
  label: string;
  href: string;
  icon: string;
  category: string;
}

const QUICK_LINKS: QuickLinkItem[] = [
  // Project
  { label: "GitHub Repository",         href: "https://github.com/jaydubya818/MissionControl",                                    icon: "🐙", category: "Project" },
  { label: "Vercel Dashboard",          href: "https://vercel.com/jaydubya818/mission-control-mission-control-ui",                icon: "▲",  category: "Project" },
  { label: "Convex Dashboard",          href: "https://dashboard.convex.dev",                                                     icon: "⚡", category: "Project" },
  { label: "Taskmaster Tasks",          href: "https://github.com/jaydubya818/MissionControl/blob/main/.taskmaster/tasks/tasks.json", icon: "✅", category: "Project" },

  // AI Tools
  { label: "Claude (claude.ai)",        href: "https://claude.ai",                                                                icon: "🟠", category: "AI Tools" },
  { label: "Claude API Docs",           href: "https://docs.anthropic.com/en/api/getting-started",                               icon: "🟠", category: "AI Tools" },
  { label: "Claude Model Reference",    href: "https://docs.anthropic.com/en/docs/about-claude/models/overview",                 icon: "🟠", category: "AI Tools" },
  { label: "Codex (OpenAI)",            href: "https://platform.openai.com/docs/guides/code",                                    icon: "🟢", category: "AI Tools" },
  { label: "OpenAI Platform",           href: "https://platform.openai.com",                                                     icon: "🟢", category: "AI Tools" },
  { label: "OpenAI API Docs",           href: "https://platform.openai.com/docs/api-reference",                                  icon: "🟢", category: "AI Tools" },
  { label: "Cursor IDE",                href: "cursor://",                                                                       icon: "🖱️", category: "AI Tools" },
  { label: "Cursor Docs",               href: "https://docs.cursor.com",                                                         icon: "🖱️", category: "AI Tools" },

  // Workspace
  { label: "Notion Workspace",          href: "https://notion.so",                                                               icon: "📓", category: "Workspace" },
  { label: "Obsidian Vault",            href: "obsidian://open",                                                                 icon: "🪨", category: "Workspace" },

  // Infra & Services
  { label: "Convex Docs",               href: "https://docs.convex.dev",                                                         icon: "📚", category: "Infra" },
  { label: "Convex Vector Search",      href: "https://docs.convex.dev/search/vector-search",                                    icon: "🔍", category: "Infra" },
  { label: "Tailwind CSS Docs",         href: "https://tailwindcss.com/docs",                                                    icon: "💨", category: "Infra" },
  { label: "shadcn/ui Components",      href: "https://ui.shadcn.com/docs/components",                                           icon: "🎨", category: "Infra" },
  { label: "Lucide Icons",              href: "https://lucide.dev/icons",                                                        icon: "✨", category: "Infra" },
  { label: "Telegram Bot API",          href: "https://core.telegram.org/bots/api",                                              icon: "✈️", category: "Infra" },
];

// ---------------------------------------------------------------------------
// TABS
// ---------------------------------------------------------------------------

const TABS = [
  { id: "knowledge", label: "Knowledge" },
  { id: "search",    label: "Search" },
  { id: "chat",      label: "Chat with Repo" },
];

// ---------------------------------------------------------------------------
// KNOWLEDGE TAB
// ---------------------------------------------------------------------------

function KnowledgeTab() {
  const categories = Array.from(new Set(QUICK_LINKS.map((l) => l.category)));

  return (
    <div className="px-6 pb-6 space-y-8">
      {/* Project docs grid */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Project Docs</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {DOC_LINKS.map((doc) => (
            <a
              key={doc.path}
              href={`/${doc.path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <Card className="p-4 h-full flex items-center gap-3 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group-hover:bg-muted/30">
                <div className="h-10 w-10 rounded-xl bg-muted border border-border flex items-center justify-center text-xl shrink-0">
                  {doc.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{doc.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{doc.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
              </Card>
            </a>
          ))}
        </div>
      </div>

      {/* Quick links grouped by category */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <FileText className="h-3.5 w-3.5" />
          Quick Links
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {categories.map((cat) => (
            <div key={cat}>
              <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-widest mb-2 px-1">{cat}</p>
              <Card className="divide-y divide-border">
                {QUICK_LINKS.filter((l) => l.category === cat).map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target={link.href.startsWith("obsidian://") || link.href.startsWith("cursor://") ? "_self" : "_blank"}
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/50 transition-colors group"
                  >
                    <span className="flex items-center gap-3 text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                      <span className="text-base w-5 text-center">{link.icon}</span>
                      {link.label}
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
                  </a>
                ))}
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SEARCH TAB
// ---------------------------------------------------------------------------

interface SearchResult {
  _id: string;
  source: string;
  title: string;
  content: string;
  chunkIndex: number;
  score: number;
}

function SearchTab() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [indexing, setIndexing] = useState(false);
  const [indexStatus, setIndexStatus] = useState<string | null>(null);

  const totalChunks = useQuery(api.knowledge.getTotalChunks);
  const indexedSources = useQuery(api.knowledge.getIndexedSources);

  const semanticSearch = useAction(api.knowledge.semanticSearch);
  const indexAllDocs = useAction(api.knowledge.indexAllDocs);

  const isIndexed = (totalChunks ?? 0) > 0;

  const handleSearch = useCallback(async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await semanticSearch({ query: query.trim(), limit: 8 });
      setResults((res as SearchResult[]) ?? []);
      setSearched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }, [query, loading, semanticSearch]);

  const handleIndex = async () => {
    setIndexing(true);
    setIndexStatus("Indexing docs…");
    try {
      const results = await indexAllDocs({});
      const succeeded = (results as { chunks: number; error?: string }[]).filter((r) => !r.error).length;
      setIndexStatus(`Indexed ${succeeded} documents successfully.`);
    } catch (e) {
      setIndexStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIndexing(false);
    }
  };

  function highlight(text: string, q: string) {
    if (!q.trim()) return text;
    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    return text.replace(regex, '<mark class="bg-primary/20 text-primary rounded px-0.5">$1</mark>');
  }

  return (
    <div className="px-6 pb-6 space-y-5">
      {/* Index status */}
      <Card className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn("h-2 w-2 rounded-full", isIndexed ? "bg-green-500" : "bg-yellow-500")} />
            <div>
              <p className="text-sm font-medium text-foreground">
                {isIndexed
                  ? `${totalChunks} chunks indexed across ${indexedSources?.length ?? 0} documents`
                  : "Knowledge base not indexed yet"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isIndexed ? "Semantic search is ready" : "Index docs to enable semantic search"}
              </p>
            </div>
          </div>
          <button
            onClick={handleIndex}
            disabled={indexing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {indexing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
            {indexing ? "Indexing…" : isIndexed ? "Re-index" : "Index Docs"}
          </button>
        </div>
        {indexStatus && (
          <p className="mt-2 text-xs text-muted-foreground border-t border-border pt-2">{indexStatus}</p>
        )}
      </Card>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Ask anything about the codebase… (semantic search)"
          className="w-full pl-10 pr-24 py-2.5 rounded-xl border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
        />
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim() || !isIndexed}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-40 transition-all"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Search"}
        </button>
      </div>

      {!isIndexed && (
        <p className="text-xs text-center text-muted-foreground">Index docs first to enable semantic search</p>
      )}

      {error && (
        <Card className="p-4 border-destructive/30 bg-destructive/10">
          <p className="text-sm text-destructive">{error}</p>
        </Card>
      )}

      {/* Results */}
      {searched && results.length === 0 && !loading && (
        <p className="text-sm text-muted-foreground text-center py-8">No results found for "{query}"</p>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground font-medium">
            {results.length} result{results.length !== 1 ? "s" : ""} — ranked by semantic similarity
          </p>
          {results.map((r) => (
            <Card key={r._id} className="p-4 hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">{r.title}</p>
                  <p className="text-xs text-muted-foreground">{r.source} · chunk {r.chunkIndex + 1}</p>
                </div>
                <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
                  {(r.score * 100).toFixed(0)}% match
                </span>
              </div>
              <p
                className="text-xs text-muted-foreground leading-relaxed line-clamp-4"
                dangerouslySetInnerHTML={{ __html: highlight(r.content.slice(0, 400), query) }}
              />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CHAT TAB
// ---------------------------------------------------------------------------

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: { title: string; source: string; excerpt: string }[];
}

const SESSION_ID = `session_${Math.random().toString(36).slice(2)}`;

function ChatTab() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const chatWithRepo = useAction(api.knowledge.chatWithRepo);
  const clearHistory = useMutation(api.knowledge.clearChatHistory);
  const totalChunks = useQuery(api.knowledge.getTotalChunks);

  const isIndexed = (totalChunks ?? 0) > 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setError(null);

    const userMsg: ChatMessage = { role: "user", content: q };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages.slice(-6).map((m) => ({ role: m.role, content: m.content }));
      const res = await chatWithRepo({ question: q, sessionId: SESSION_ID, history });
      const { answer, sources } = res as { answer: string; sources: ChatMessage["sources"] };
      setMessages((prev) => [...prev, { role: "assistant", content: answer, sources }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chat failed");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleClear = async () => {
    setMessages([]);
    await clearHistory({ sessionId: SESSION_ID });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const STARTERS = [
    "What is the task state machine?",
    "How do agents claim tasks?",
    "Explain the policy engine risk levels",
    "What tables are in the database?",
    "How does the Telegram bot work?",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] px-6 pb-6">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Chat with Repo</span>
          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", isIndexed ? "bg-primary/15 text-primary" : "bg-yellow-500/15 text-yellow-500")}>
            {isIndexed ? "Ready" : "Not indexed"}
          </span>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      {!isIndexed && (
        <Card className="p-4 mb-4 border-yellow-500/20 bg-yellow-500/5">
          <p className="text-sm text-yellow-500/80">
            The knowledge base isn't indexed yet. Go to the <strong>Search</strong> tab and click <strong>Index Docs</strong> first.
          </p>
        </Card>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-auto space-y-4 mb-4 pr-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
            <div className="space-y-2">
              <BookOpen className="h-10 w-10 text-muted-foreground/30 mx-auto" />
              <p className="text-sm font-medium text-foreground">Ask anything about Mission Control</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Powered by RAG — I search the indexed docs and answer using GPT-4o-mini with source citations.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => { setInput(s); inputRef.current?.focus(); }}
                  className="text-xs px-3 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cn("max-w-[80%] space-y-2")}>
              <div
                className={cn(
                  "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted border border-border text-foreground rounded-bl-sm"
                )}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>

              {msg.sources && msg.sources.length > 0 && (
                <div className="space-y-1 pl-1">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Sources</p>
                  {msg.sources.map((src, j) => (
                    <div key={j} className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2 border border-border/50">
                      <FileText className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">{src.title}</p>
                        <p className="line-clamp-2 mt-0.5">{src.excerpt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted border border-border rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Thinking…</span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-start">
            <div className="bg-destructive/10 border border-destructive/30 rounded-2xl px-4 py-3 text-sm text-destructive max-w-[80%]">
              {error}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="relative">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isIndexed ? "Ask a question… (Enter to send, Shift+Enter for newline)" : "Index docs first to enable chat"}
          disabled={!isIndexed || loading}
          rows={2}
          className="w-full pl-4 pr-14 py-3 rounded-xl border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all resize-none disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading || !isIndexed}
          className="absolute right-2 bottom-2.5 p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-all"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ROOT
// ---------------------------------------------------------------------------

export function DocsView() {
  const [activeTab, setActiveTab] = useState("knowledge");

  return (
    <main className="flex-1 overflow-auto">
      <PageHeader title="Documentation" description="Project guides and technical references" />
      <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} className="px-6" />

      {activeTab === "knowledge" && <KnowledgeTab />}
      {activeTab === "search"    && <SearchTab />}
      {activeTab === "chat"      && <ChatTab />}
    </main>
  );
}
