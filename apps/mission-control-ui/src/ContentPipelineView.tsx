import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id, Doc } from "../../../convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import {
  Filter, LayoutGrid, Package, FileText, CheckCircle2, XCircle,
  Eye, X, Plus, Sparkles, BarChart3, Tag, Clock, User,
  TrendingUp, Loader2, Send, ChevronDown,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { PageHeader } from "./components/PageHeader";
import { cn } from "@/lib/utils";

interface ContentPipelineViewProps {
  projectId: Id<"projects"> | null;
}

type TabMode = "drops" | "pipeline" | "metrics";

// ---------------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------------

const PIPELINE_COLUMNS = [
  { id: "idea",      label: "Ideas",      color: "border-t-zinc-400",   bg: "bg-zinc-500/10"    },
  { id: "drafting",  label: "Drafting",   color: "border-t-sky-500",    bg: "bg-sky-500/10"     },
  { id: "review",    label: "Review",     color: "border-t-amber-500",  bg: "bg-amber-500/10"   },
  { id: "published", label: "Published",  color: "border-t-primary",bg: "bg-primary/10" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  DRAFT:     { label: "Draft",     color: "text-zinc-400",     bg: "bg-zinc-500/10",    dot: "bg-zinc-500"    },
  SUBMITTED: { label: "Submitted", color: "text-sky-400",      bg: "bg-sky-500/10",     dot: "bg-sky-500"     },
  APPROVED:  { label: "Approved",  color: "text-primary",  bg: "bg-primary/10", dot: "bg-primary" },
  REJECTED:  { label: "Rejected",  color: "text-destructive",  bg: "bg-destructive/10", dot: "bg-destructive" },
  PUBLISHED: { label: "Published", color: "text-primary",      bg: "bg-primary/10",     dot: "bg-primary"     },
};

const TYPE_ICONS: Record<string, string> = {
  BLOG_POST:    "📝",
  SOCIAL_POST:  "📱",
  EMAIL_DRAFT:  "✉️",
  SCRIPT:       "🎬",
  REPORT:       "📊",
  CODE_SNIPPET: "💻",
  DESIGN:       "🎨",
  OTHER:        "📄",
};

const CONTENT_TYPES = ["BLOG_POST", "SOCIAL_POST", "EMAIL_DRAFT", "SCRIPT", "REPORT", "CODE_SNIPPET", "DESIGN", "OTHER"];
const STATUSES = ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "PUBLISHED"];

// ---------------------------------------------------------------------------
// STATUS BADGE
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT;
  return (
    <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide", cfg.color, cfg.bg)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// STAT CARD
// ---------------------------------------------------------------------------

function StatCard({ label, value, icon, sub }: { label: string; value: number | string; icon: string; sub?: string }) {
  return (
    <Card className="p-4 flex items-start gap-3">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-lg font-bold text-foreground leading-none">{value}</p>
        <p className="text-xs font-medium text-foreground mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// CONTENT DROP CARD
// ---------------------------------------------------------------------------

function ContentDropCard({
  drop, agents, onSelect,
}: {
  drop: Doc<"contentDrops">;
  agents: Doc<"agents">[];
  onSelect: (id: Id<"contentDrops">) => void;
}) {
  const agent = drop.agentId ? agents.find((a) => a._id === drop.agentId) : null;
  const typeIcon = TYPE_ICONS[drop.contentType] ?? "📄";

  return (
    <Card
      className="p-4 cursor-pointer hover:shadow-md hover:border-primary/25 transition-all group flex flex-col gap-3"
      onClick={() => onSelect(drop._id)}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <span className="text-lg shrink-0 mt-0.5">{typeIcon}</span>
          <p className="text-xs font-semibold text-foreground leading-relaxed line-clamp-2 flex-1">{drop.title}</p>
        </div>
        <StatusBadge status={drop.status} />
      </div>

      {/* Summary */}
      {drop.summary && (
        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{drop.summary}</p>
      )}

      {/* Tags */}
      {drop.tags && drop.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {drop.tags.map((tag) => (
            <span key={tag} className="text-[9px] uppercase tracking-wide font-semibold bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t border-border/50 pt-2">
        <div className="flex items-center gap-2">
          <span className="uppercase tracking-wide">{drop.contentType.replace(/_/g, " ")}</span>
          {agent && (
            <>
              <span>·</span>
              <span>{agent.emoji ?? "🤖"} {agent.name}</span>
            </>
          )}
        </div>
        <span>{new Date(drop._creationTime).toLocaleDateString()}</span>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// DETAIL MODAL
// ---------------------------------------------------------------------------

function ContentDropDetail({
  dropId, agents, onClose,
}: {
  dropId: Id<"contentDrops">;
  agents: Doc<"agents">[];
  onClose: () => void;
}) {
  const drop = useQuery(api.contentDrops.get, { id: dropId });
  const updateStatus = useMutation(api.contentDrops.updateStatus);
  const [loading, setLoading] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");

  if (!drop) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <Card className="w-full max-w-2xl p-6"><SkeletonCard lines={4} /></Card>
      </div>
    );
  }

  const agent = drop.agentId ? agents.find((a) => a._id === drop.agentId) : null;

  const handleAction = async (status: "APPROVED" | "REJECTED" | "PUBLISHED") => {
    setLoading(status);
    try {
      await updateStatus({ id: dropId, status, reviewedBy: "operator", reviewNote: reviewNote || undefined });
    } finally {
      setLoading(null);
    }
  };

  const canReview = drop.status === "SUBMITTED" || drop.status === "DRAFT";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{TYPE_ICONS[drop.contentType] ?? "📄"}</span>
                <h2 className="text-sm font-semibold text-foreground leading-snug">{drop.title}</h2>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-wrap">
                <span className="uppercase tracking-wide">{drop.contentType.replace(/_/g, " ")}</span>
                {agent && <><span>·</span><span>{agent.emoji ?? "🤖"} {agent.name}</span></>}
                <span>·</span>
                <StatusBadge status={drop.status} />
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors shrink-0">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Summary */}
          {drop.summary && (
            <p className="text-xs text-muted-foreground border-l-2 border-border pl-3">{drop.summary}</p>
          )}

          {/* Content */}
          <div className="bg-muted/40 rounded-xl p-4 max-h-[320px] overflow-y-auto border border-border">
            <pre className="text-xs text-foreground/80 whitespace-pre-wrap font-mono leading-relaxed">{drop.content}</pre>
          </div>

          {/* Tags */}
          {drop.tags && drop.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {drop.tags.map((tag) => (
                <span key={tag} className="text-[10px] uppercase tracking-wide font-semibold bg-muted px-2 py-0.5 rounded-full text-muted-foreground border border-border">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Review note display */}
          {drop.reviewNote && (
            <div className="text-xs text-muted-foreground border-l-2 border-amber-500/50 pl-3 py-1 bg-amber-500/5 rounded-r">
              <span className="font-semibold text-amber-500">Review note:</span> {drop.reviewNote}
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3 text-[10px] text-muted-foreground border-t border-border pt-3">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              Created {new Date(drop._creationTime).toLocaleString()}
            </div>
            {drop.reviewedAt && (
              <div className="flex items-center gap-1.5">
                <User className="h-3 w-3" />
                Reviewed by {drop.reviewedBy} · {new Date(drop.reviewedAt).toLocaleDateString()}
              </div>
            )}
          </div>

          {/* Review actions */}
          {canReview && (
            <div className="border-t border-border pt-4 space-y-3">
              <input
                type="text"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Optional review note…"
                className="w-full px-3 py-2 rounded-lg border border-border bg-muted/40 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAction("APPROVED")}
                  disabled={loading !== null}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-primary hover:bg-primary/85 transition-colors disabled:opacity-50"
                >
                  {loading === "APPROVED" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  Approve
                </button>
                <button
                  onClick={() => handleAction("REJECTED")}
                  disabled={loading !== null}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {loading === "REJECTED" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                  Reject
                </button>
                <button
                  onClick={() => handleAction("PUBLISHED")}
                  disabled={loading !== null}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground bg-muted hover:bg-muted/80 border border-border transition-colors disabled:opacity-50"
                >
                  {loading === "PUBLISHED" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
                  Publish
                </button>
              </div>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CREATE FORM
// ---------------------------------------------------------------------------

function CreateDropForm({
  projectId, agents, onClose,
}: {
  projectId: Id<"projects"> | null;
  agents: Doc<"agents">[];
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [contentType, setContentType] = useState("BLOG_POST");
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [agentId, setAgentId] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = useMutation(api.contentDrops.submit);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || loading) return;
    setLoading(true);
    try {
      await submit({
        projectId: projectId ?? undefined,
        agentId: agentId ? agentId as Id<"agents"> : undefined,
        title: title.trim(),
        contentType: contentType as any,
        content: content.trim(),
        summary: summary.trim() || undefined,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-xl rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">New Content Drop</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="h-4 w-4 text-muted-foreground" /></button>
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full px-3 py-2 rounded-lg border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <input
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Summary (optional)"
            className="w-full px-3 py-2 rounded-lg border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <div className="flex gap-3">
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-muted/40 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {CONTENT_TYPES.map((t) => <option key={t} value={t}>{TYPE_ICONS[t]} {t.replace(/_/g, " ")}</option>)}
            </select>
            <select
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-muted/40 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">No agent</option>
              {agents.map((a) => <option key={a._id} value={a._id}>{a.emoji ?? "🤖"} {a.name}</option>)}
            </select>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Content body…"
            rows={6}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-muted/40 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none font-mono"
          />
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 border border-border transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!title.trim() || !content.trim() || loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-all"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Submit Drop
            </button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// METRICS TAB
// ---------------------------------------------------------------------------

function MetricsTab({ projectId }: { projectId: Id<"projects"> | null }) {
  const stats = useQuery(api.contentDrops.getStats, projectId ? { projectId } : {});
  const drops = useQuery(api.contentDrops.list, projectId ? { projectId } : {});

  if (!stats || !drops) return <div className="flex items-center justify-center py-12 text-muted-foreground text-xs">Loading metrics…</div>;

  const approvalRate = stats.byStatus.SUBMITTED
    ? Math.round(((stats.byStatus.APPROVED ?? 0) / ((stats.byStatus.APPROVED ?? 0) + (stats.byStatus.REJECTED ?? 0) || 1)) * 100)
    : 0;

  const typeEntries = Object.entries(stats.byType ?? {}).sort((a, b) => b[1] - a[1]);
  const statusEntries = STATUSES.map((s) => [s, stats.byStatus[s] ?? 0] as [string, number]);
  const maxCount = Math.max(...typeEntries.map((e) => e[1]), 1);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Drops"    value={stats.total}    icon="📦" sub="All time" />
        <StatCard label="Published"      value={stats.byStatus.PUBLISHED ?? 0} icon="🚀" sub="Live content" />
        <StatCard label="Approval Rate"  value={`${approvalRate}%`} icon="✅" sub="Approved / reviewed" />
        <StatCard label="Pending Review" value={stats.byStatus.SUBMITTED ?? 0} icon="⏳" sub="Awaiting decision" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status breakdown */}
        <Card className="p-5">
          <h3 className="text-xs font-semibold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" /> Status Breakdown
          </h3>
          <div className="space-y-2.5">
            {statusEntries.map(([status, count]) => {
              const cfg = STATUS_CONFIG[status];
              const pct = Math.round((count / (stats.total || 1)) * 100);
              return (
                <div key={status} className="flex items-center gap-3">
                  <span className={cn("text-[10px] font-semibold w-20 shrink-0", cfg?.color ?? "text-muted-foreground")}>
                    {status}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", cfg?.dot ?? "bg-muted-foreground")}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-foreground w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Content type breakdown */}
        <Card className="p-5">
          <h3 className="text-xs font-semibold text-foreground mb-4 flex items-center gap-2">
            <Tag className="h-3.5 w-3.5 text-muted-foreground" /> Content Types
          </h3>
          <div className="space-y-2.5">
            {typeEntries.map(([type, count]) => (
              <div key={type} className="flex items-center gap-3">
                <span className="text-sm w-6 text-center shrink-0">{TYPE_ICONS[type] ?? "📄"}</span>
                <span className="text-[10px] text-muted-foreground flex-1 truncate">{type.replace(/_/g, " ")}</span>
                <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.round((count / maxCount) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-foreground w-4 text-right">{count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent published */}
      <Card className="p-5">
        <h3 className="text-xs font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" /> Recent Published
        </h3>
        <div className="space-y-2">
          {drops.filter((d) => d.status === "PUBLISHED").slice(0, 5).map((d) => (
            <div key={d._id} className="flex items-center gap-3 text-xs py-2 border-b border-border/40 last:border-0">
              <span className="text-base">{TYPE_ICONS[d.contentType] ?? "📄"}</span>
              <p className="flex-1 text-foreground truncate">{d.title}</p>
              <span className="text-[10px] text-muted-foreground shrink-0">{new Date(d._creationTime).toLocaleDateString()}</span>
            </div>
          ))}
          {drops.filter((d) => d.status === "PUBLISHED").length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No published content yet</p>
          )}
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MAIN VIEW
// ---------------------------------------------------------------------------

export function ContentPipelineView({ projectId }: ContentPipelineViewProps) {
  const [tab, setTab] = useState<TabMode>("drops");
  const [selectedDrop, setSelectedDrop] = useState<Id<"contentDrops"> | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [seeding, setSeeding] = useState(false);

  const captures    = useQuery(api.tasks.listAll, projectId ? { projectId } : {});
  const contentDrops = useQuery(api.contentDrops.list, projectId ? { projectId } : {});
  const agents      = useQuery(api.agents.listAll, projectId ? { projectId } : {});
  const stats       = useQuery(api.contentDrops.getStats, projectId ? { projectId } : {});

  const seedDrops = useMutation(api.contentDrops.seedContentDrops);

  const isLoading = !captures || !contentDrops || !agents;

  if (isLoading) {
    return (
      <main className="mc-page">
        <div className="mc-page-body grid grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} lines={3} />)}
        </div>
      </main>
    );
  }

  const handleSeed = async () => {
    setSeeding(true);
    try { await seedDrops({ projectId: projectId ?? undefined }); }
    finally { setSeeding(false); }
  };

  const filteredDrops = contentDrops.filter((d) => {
    if (statusFilter !== "ALL" && d.status !== statusFilter) return false;
    if (typeFilter !== "ALL" && d.contentType !== typeFilter) return false;
    return true;
  });

  const columnItems: Record<string, typeof captures> = {
    idea:      captures.filter((t) => t.status === "INBOX"),
    drafting:  captures.filter((t) => ["ASSIGNED", "IN_PROGRESS"].includes(t.status)),
    review:    captures.filter((t) => ["REVIEW", "NEEDS_APPROVAL"].includes(t.status)),
    published: captures.filter((t) => t.status === "DONE"),
  };

  return (
    <main className="mc-page flex flex-col overflow-hidden">
      <PageHeader
        title="Content Pipeline"
        description={
          stats
            ? `${stats.total} drops · ${stats.byStatus.PUBLISHED ?? 0} published · ${stats.byStatus.SUBMITTED ?? 0} pending review`
            : "Track content from idea to publication. Ideas → Drafting → Review → Published."
        }
        eyebrow="Content"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
          {contentDrops.length === 0 && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors"
            >
              {seeding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              Seed Sample Data
            </button>
          )}

          {/* Create button */}
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-3 w-3" /> New Drop
          </button>

          {/* Tab switcher */}
          <div className="flex rounded-md border border-border overflow-hidden">
            {([
              { id: "drops",   label: "Drops",   icon: Package },
              { id: "pipeline",label: "Pipeline", icon: LayoutGrid },
              { id: "metrics", label: "Metrics",  icon: BarChart3 },
            ] as { id: TabMode; label: string; icon: React.ComponentType<{ className?: string }> }[]).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
                  tab === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-3 w-3" />
                {label}
                {id === "drops" && contentDrops.length > 0 && (
                  <span className={cn("text-[9px] font-bold px-1 rounded-full", tab === id ? "bg-white/20" : "bg-muted-foreground/20")}>{contentDrops.length}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      }
      />

      <div className="mc-page-body mc-page-stack">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="mc-kicker">Drops</div>
          <div className="mt-2 text-3xl font-semibold text-foreground">{contentDrops.length}</div>
          <div className="mt-1 text-xs text-muted-foreground">Content units tracked end to end</div>
        </Card>
        <Card className="p-4">
          <div className="mc-kicker">Published</div>
          <div className="mt-2 text-3xl font-semibold text-emerald-100">{stats?.byStatus.PUBLISHED ?? 0}</div>
          <div className="mt-1 text-xs text-muted-foreground">Drops that already cleared the pipeline</div>
        </Card>
        <Card className="p-4">
          <div className="mc-kicker">Pending review</div>
          <div className="mt-2 text-3xl font-semibold text-amber-100">{stats?.byStatus.SUBMITTED ?? 0}</div>
          <div className="mt-1 text-xs text-muted-foreground">Items still waiting on editorial or operator review</div>
        </Card>
        <Card className="p-4">
          <div className="mc-kicker">Pipeline tasks</div>
          <div className="mt-2 text-3xl font-semibold text-cyan-100">{captures.length}</div>
          <div className="mt-1 text-xs text-muted-foreground">Upstream work shaping the publishing queue</div>
        </Card>
      </div>

      {/* Filters (Drops tab only) */}
      {tab === "drops" && contentDrops.length > 0 && (
        <div className="flex items-center gap-2 px-6 py-2.5 border-b border-border/30 bg-muted/20 flex-wrap">
          <Filter className="h-3 w-3 text-muted-foreground shrink-0" />
          <div className="flex gap-1.5 flex-wrap">
            {["ALL", ...STATUSES].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors",
                  statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {s === "ALL" ? "All" : s}
                {s !== "ALL" && (stats?.byStatus[s] ?? 0) > 0 && (
                  <span className="ml-1 opacity-60">{stats?.byStatus[s]}</span>
                )}
              </button>
            ))}
          </div>
          <div className="w-px h-4 bg-border mx-1" />
          <div className="flex gap-1.5 flex-wrap">
            {["ALL", ...CONTENT_TYPES].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={cn(
                  "text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors",
                  typeFilter === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {t === "ALL" ? "All Types" : `${TYPE_ICONS[t]} ${t.replace(/_/g, " ")}`}
              </button>
            ))}
          </div>
          {filteredDrops.length !== contentDrops.length && (
            <span className="text-[10px] text-muted-foreground ml-auto">
              Showing {filteredDrops.length} of {contentDrops.length}
            </span>
          )}
        </div>
      )}

      {/* Tab Content */}
      {tab === "drops" && (
        <div className="flex-1 overflow-y-auto">
          {filteredDrops.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Package className="h-12 w-12 text-muted-foreground/20 mb-4" />
              <p className="text-sm font-semibold text-foreground mb-1">
                {contentDrops.length === 0 ? "No content drops yet" : "No drops match your filters"}
              </p>
              <p className="text-xs text-muted-foreground mb-6 max-w-xs">
                {contentDrops.length === 0
                  ? "Seed sample data to get started, or create your first content drop."
                  : "Try adjusting the status or type filter."}
              </p>
              {contentDrops.length === 0 && (
                <div className="flex gap-3">
                  <button
                    onClick={handleSeed}
                    disabled={seeding}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors"
                  >
                    {seeding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    Seed Sample Data
                  </button>
                  <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" /> Create First Drop
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {filteredDrops.map((drop, i) => (
                  <motion.div
                    key={drop._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <ContentDropCard drop={drop} agents={agents} onSelect={setSelectedDrop} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {tab === "pipeline" && (
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-4 px-6 py-6 min-w-max h-full">
            {PIPELINE_COLUMNS.map((col, colIdx) => (
              <motion.div
                key={col.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: colIdx * 0.08 }}
                className="w-72 flex flex-col"
              >
                <div className={cn("flex items-center justify-between px-3 py-2 mb-3 rounded-lg border border-border border-t-2", col.color, col.bg)}>
                  <span className="text-xs font-semibold uppercase tracking-wider text-foreground">{col.label}</span>
                  <span className="text-[10px] font-bold text-muted-foreground bg-background/60 px-1.5 py-0.5 rounded">
                    {columnItems[col.id]?.length ?? 0}
                  </span>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto">
                  {(columnItems[col.id] ?? []).slice(0, 12).map((item) => (
                    <Card key={item._id} className="p-3 hover:border-primary/20 transition-colors">
                      <p className="text-xs font-medium text-foreground/90 leading-relaxed line-clamp-2 mb-2">{item.title}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{item.type}</span>
                        {item.priority > 0 && (
                          <span className={cn("text-[9px] font-bold", item.priority === 3 ? "text-destructive" : item.priority === 2 ? "text-amber-500" : "text-primary")}>
                            P{item.priority}
                          </span>
                        )}
                      </div>
                    </Card>
                  ))}
                  {(columnItems[col.id]?.length ?? 0) === 0 && (
                    <div className="py-10 text-center text-[10px] text-muted-foreground/40 uppercase tracking-widest">Empty</div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {tab === "metrics" && <MetricsTab projectId={projectId} />}

      {/* Modals */}
      <AnimatePresence>
        {selectedDrop && (
          <ContentDropDetail dropId={selectedDrop} agents={agents} onClose={() => setSelectedDrop(null)} />
        )}
        {showCreate && (
          <CreateDropForm projectId={projectId} agents={agents} onClose={() => setShowCreate(false)} />
        )}
      </AnimatePresence>
      </div>
    </main>
  );
}
