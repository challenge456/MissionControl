import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getOrchestrationBaseUrl } from "@/lib/orchestrationUrl";
import { PageHeader } from "./components/PageHeader";
import {
  Bot,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  Copy,
  FileCode2,
  FileText,
  Folder,
  Loader2,
  PencilLine,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  WandSparkles,
} from "lucide-react";

type SkillSource = "repo" | "codex" | "openclaw";

interface SkillSummary {
  id: string;
  name: string;
  source: SkillSource;
  sourceLabel: string;
  relativePath: string;
  updatedAt: number;
  fileCount: number;
  description: string | null;
}

interface SkillFile {
  path: string;
  name: string;
  extension: string;
  size: number;
  updatedAt: number;
}

interface SkillFileResponse {
  path: string;
  content: string;
  updatedAt: number;
  size: number;
}

interface SkillFilesResponse {
  skill: SkillSummary;
  files: SkillFile[];
}

interface TreeNode {
  kind: "folder" | "file";
  name: string;
  path: string;
  extension?: string;
  children?: TreeNode[];
}

const SOURCE_STYLES: Record<SkillSource, string> = {
  repo: "border-cyan-300/30 bg-cyan-400/10 text-cyan-100",
  codex: "border-emerald-300/30 bg-emerald-400/10 text-emerald-100",
  openclaw: "border-amber-300/30 bg-amber-400/10 text-amber-100",
};

const SOURCE_FILTERS: Array<{ id: SkillSource | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "repo", label: "Repo" },
  { id: "codex", label: "Codex" },
  { id: "openclaw", label: "OpenClaw" },
];

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(extension: string) {
  if (["md", "txt"].includes(extension)) return FileText;
  return FileCode2;
}

function buildFileTree(files: SkillFile[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const file of files) {
    const segments = file.path.split("/").filter(Boolean);
    let level = root;
    let currentPath = "";

    segments.forEach((segment, index) => {
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;
      const isFile = index === segments.length - 1;
      let existing = level.find((node) => node.path === currentPath);

      if (!existing) {
        existing = isFile
          ? { kind: "file", name: segment, path: currentPath, extension: file.extension }
          : { kind: "folder", name: segment, path: currentPath, children: [] };
        level.push(existing);
      }

      if (existing.kind === "folder") {
        level = existing.children ?? [];
      }
    });
  }

  const sortNodes = (nodes: TreeNode[]): TreeNode[] =>
    [...nodes]
      .sort((left, right) => {
        if (left.kind !== right.kind) return left.kind === "folder" ? -1 : 1;
        return left.name.localeCompare(right.name);
      })
      .map((node) =>
        node.kind === "folder"
          ? { ...node, children: sortNodes(node.children ?? []) }
          : node
      );

  return sortNodes(root);
}

function buildLineNumbers(content: string): string {
  return Array.from({ length: Math.max(content.split("\n").length, 1) }, (_, index) => `${index + 1}`).join("\n");
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getOrchestrationBaseUrl();
  const response = await fetch(base ? `${base}${path}` : path, init);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Request failed");
  }
  return data as T;
}

export function SkillsView() {
  const [skills, setSkills] = useState<SkillSummary[]>([]);
  const [search, setSearch] = useState("");
  const [fileSearch, setFileSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SkillSource | "all">("all");
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [files, setFiles] = useState<SkillFile[]>([]);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [savedContent, setSavedContent] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [copiedState, setCopiedState] = useState<"skill" | "file" | null>(null);

  const selectedSkill = useMemo(
    () => skills.find((skill) => skill.id === selectedSkillId) ?? null,
    [skills, selectedSkillId]
  );

  const filteredSkills = useMemo(() => {
    const query = search.trim().toLowerCase();
    return skills.filter((skill) => {
      if (sourceFilter !== "all" && skill.source !== sourceFilter) return false;
      if (!query) return true;
      return (
        skill.name.toLowerCase().includes(query) ||
        skill.relativePath.toLowerCase().includes(query) ||
        (skill.description ?? "").toLowerCase().includes(query)
      );
    });
  }, [search, skills, sourceFilter]);

  const selectedFile = useMemo(
    () => files.find((file) => file.path === selectedFilePath) ?? null,
    [files, selectedFilePath]
  );
  const dirty = draftContent !== savedContent;
  const visibleFiles = useMemo(() => {
    const query = fileSearch.trim().toLowerCase();
    if (!query) return files;
    return files.filter((file) => file.path.toLowerCase().includes(query));
  }, [fileSearch, files]);
  const fileTree = useMemo(() => buildFileTree(visibleFiles), [visibleFiles]);
  const totalSkills = skills.length;
  const repoSkills = skills.filter((skill) => skill.source === "repo").length;
  const recentlyUpdatedSkills = skills.filter((skill) => Date.now() - skill.updatedAt < 7 * 86_400_000).length;
  const skillsNeedingAttention = skills.filter(
    (skill) =>
      !skill.description ||
      skill.fileCount <= 1 ||
      Date.now() - skill.updatedAt > 30 * 86_400_000
  ).length;
  const selectedSkillRecommendations = useMemo(() => {
    if (!selectedSkill) return [];

    const recommendations: Array<{ title: string; detail: string; tone: "neutral" | "warning" | "positive" }> = [];

    if (!selectedSkill.description) {
      recommendations.push({
        title: "Sharpen the skill contract",
        detail: "Add a frontmatter description or a clearer opening paragraph so operators and future agents can trust what this skill does.",
        tone: "warning",
      });
    }

    if (selectedSkill.fileCount <= 1) {
      recommendations.push({
        title: "Add supporting references",
        detail: "Single-file skills are fast to author, but they age poorly. Add examples, references, or scripts for repeatable execution.",
        tone: "neutral",
      });
    }

    if (Date.now() - selectedSkill.updatedAt > 30 * 86_400_000) {
      recommendations.push({
        title: "Review for drift",
        detail: "This skill hasn’t been updated recently. Re-check assumptions, commands, and links before using it in important work.",
        tone: "warning",
      });
    }

    if (selectedSkill.source !== "repo") {
      recommendations.push({
        title: "Promote stable skills into the repo",
        detail: "If this workflow matters to Mission Control, move it into a repo plugin skill so it can be versioned and reviewed intentionally.",
        tone: "positive",
      });
    }

    if (selectedFilePath && selectedFilePath !== "SKILL.md") {
      recommendations.push({
        title: "Verify the top-level skill definition",
        detail: "Before editing support files, make sure the main SKILL.md still describes the behavior accurately.",
        tone: "neutral",
      });
    }

    return recommendations.slice(0, 4);
  }, [selectedFilePath, selectedSkill]);

  useEffect(() => {
    void loadSkills();
  }, []);

  useEffect(() => {
    if (!copiedState) return;
    const timeout = window.setTimeout(() => setCopiedState(null), 1800);
    return () => window.clearTimeout(timeout);
  }, [copiedState]);

  useEffect(() => {
    if (filteredSkills.length === 0) {
      setSelectedSkillId(null);
      return;
    }
    if (!selectedSkillId || !filteredSkills.some((skill) => skill.id === selectedSkillId)) {
      setSelectedSkillId(filteredSkills[0].id);
    }
  }, [filteredSkills, selectedSkillId]);

  useEffect(() => {
    if (!selectedSkillId) {
      setFiles([]);
      setSelectedFilePath(null);
      return;
    }
    void loadSkillFiles(selectedSkillId);
  }, [selectedSkillId]);

  useEffect(() => {
    if (!selectedFilePath) {
      setSavedContent("");
      setDraftContent("");
      return;
    }
    if (!selectedSkillId) return;
    void loadFileContent(selectedSkillId, selectedFilePath);
  }, [selectedSkillId, selectedFilePath]);

  useEffect(() => {
    if (!selectedFilePath) return;
    const folders = selectedFilePath.split("/").slice(0, -1);
    if (folders.length === 0) return;
    let currentPath = "";
    setOpenFolders((current) => {
      const next = { ...current };
      folders.forEach((segment) => {
        currentPath = currentPath ? `${currentPath}/${segment}` : segment;
        next[currentPath] = true;
      });
      return next;
    });
  }, [selectedFilePath]);

  async function loadSkills() {
    setLoadingSkills(true);
    setError(null);
    try {
      const response = await requestJson<{ skills: SkillSummary[] }>("/gateway/skills");
      setSkills(response.skills);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load skills");
    } finally {
      setLoadingSkills(false);
    }
  }

  async function loadSkillFiles(skillId: string) {
    setLoadingFiles(true);
    setError(null);
    try {
      const response = await requestJson<SkillFilesResponse>(
        `/gateway/skills/files?skillId=${encodeURIComponent(skillId)}`
      );
      setFiles(response.files);
      const defaultFile = response.files.find((file) => file.path === "SKILL.md") ?? response.files[0] ?? null;
      setSelectedFilePath((current) =>
        current && response.files.some((file) => file.path === current) ? current : defaultFile?.path ?? null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load skill files");
      setFiles([]);
      setSelectedFilePath(null);
    } finally {
      setLoadingFiles(false);
    }
  }

  async function loadFileContent(skillId: string, filePath: string) {
    setLoadingContent(true);
    setError(null);
    try {
      const response = await requestJson<SkillFileResponse>(
        `/gateway/skills/file?skillId=${encodeURIComponent(skillId)}&path=${encodeURIComponent(filePath)}`
      );
      setSavedContent(response.content);
      setDraftContent(response.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to read file");
      setSavedContent("");
      setDraftContent("");
    } finally {
      setLoadingContent(false);
    }
  }

  async function saveCurrentFile() {
    if (!selectedSkillId || !selectedFilePath || !dirty) return;
    setSaving(true);
    setError(null);
    try {
      await requestJson(
        `/gateway/skills/file?skillId=${encodeURIComponent(selectedSkillId)}&path=${encodeURIComponent(selectedFilePath)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: draftContent }),
        }
      );
      setSavedContent(draftContent);
      setFiles((current) =>
        current.map((file) =>
          file.path === selectedFilePath
            ? {
                ...file,
                size: new Blob([draftContent]).size,
                updatedAt: Date.now(),
              }
            : file
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save file");
    } finally {
      setSaving(false);
    }
  }

  function canSwitchAway(): boolean {
    return !dirty || window.confirm("Discard unsaved changes to the current skill file?");
  }

  function handleSelectSkill(skillId: string) {
    if (skillId === selectedSkillId) return;
    if (!canSwitchAway()) return;
    setEditMode(false);
    setSelectedSkillId(skillId);
  }

  function handleSelectFile(filePath: string) {
    if (filePath === selectedFilePath) return;
    if (!canSwitchAway()) return;
    setEditMode(false);
    setSelectedFilePath(filePath);
  }

  function toggleFolder(folderPath: string) {
    setOpenFolders((current) => ({
      ...current,
      [folderPath]: !current[folderPath],
    }));
  }

  async function copyValue(kind: "skill" | "file", value: string | null) {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedState(kind);
    } catch {
      setError("Clipboard access was blocked in this browser session.");
    }
  }

  function resetDraft() {
    setDraftContent(savedContent);
  }

  function openSkillDefinition() {
    const skillDefinition = files.find((file) => file.path === "SKILL.md");
    if (!skillDefinition) return;
    handleSelectFile(skillDefinition.path);
  }

  const recommendationToneClass = {
    neutral: "border-cyan-300/18 bg-cyan-400/8 text-cyan-50",
    warning: "border-amber-300/25 bg-amber-400/10 text-amber-50",
    positive: "border-emerald-300/20 bg-emerald-400/10 text-emerald-50",
  } as const;

  function renderTree(nodes: TreeNode[], depth = 0): ReactNode {
    return nodes.map((node) => {
      if (node.kind === "folder") {
        const isOpen = openFolders[node.path] ?? depth < 1;
        return (
          <div key={node.path}>
            <button
              type="button"
              onClick={() => toggleFolder(node.path)}
              className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-cyan-400/8 hover:text-foreground"
              style={{ paddingLeft: `${depth * 16 + 8}px` }}
            >
              {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              <Folder className="h-3.5 w-3.5 text-cyan-200" />
              <span className="truncate">{node.name}</span>
            </button>
            {isOpen && node.children ? renderTree(node.children, depth + 1) : null}
          </div>
        );
      }

      const FileIcon = getFileIcon(node.extension ?? "");
      const active = node.path === selectedFilePath;
      return (
        <button
          key={node.path}
          type="button"
          onClick={() => handleSelectFile(node.path)}
          className={cn(
            "flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-xs transition-colors",
            active
              ? "bg-cyan-400/12 text-foreground shadow-[inset_0_0_0_1px_rgba(34,211,238,0.18)]"
              : "text-muted-foreground hover:bg-cyan-400/8 hover:text-foreground"
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          <FileIcon className="h-3.5 w-3.5 shrink-0 text-cyan-100/80" />
          <span className="truncate">{node.name}</span>
        </button>
      );
    });
  }

  const sourceUnavailable = !loadingSkills && skills.length === 0 && Boolean(error);

  return (
    <main className="relative flex-1 overflow-auto bg-app">
      <div className="flex min-w-0 flex-1 flex-col">
        <PageHeader
          title="Skills Browser"
          description="Review the actual skills Codex and OpenClaw can use, inspect their file trees, and edit them without leaving Mission Control."
          icon={<Sparkles className="h-4.5 w-4.5" strokeWidth={1.6} />}
          actions={
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => void loadSkills()} disabled={loadingSkills}>
                {loadingSkills ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Refresh
              </Button>
            </div>
          }
          status={
            <Badge variant="outline" className="border-cyan-300/30 bg-cyan-400/8 text-cyan-100">
              {loadingSkills ? "Scanning sources" : `${skills.length} discovered`}
            </Badge>
          }
        />

        <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-6 py-6">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Total skills</div>
              <div className="mt-2 text-2xl font-semibold text-foreground">{totalSkills}</div>
              <div className="mt-1 text-xs text-muted-foreground">Across repo, Codex, and OpenClaw</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Repo managed</div>
              <div className="mt-2 text-2xl font-semibold text-foreground">{repoSkills}</div>
              <div className="mt-1 text-xs text-muted-foreground">Versioned inside Mission Control</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Fresh this week</div>
              <div className="mt-2 text-2xl font-semibold text-foreground">{recentlyUpdatedSkills}</div>
              <div className="mt-1 text-xs text-muted-foreground">Recently updated capabilities</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Needs review</div>
              <div className="mt-2 text-2xl font-semibold text-foreground">{skillsNeedingAttention}</div>
              <div className="mt-1 text-xs text-muted-foreground">Stale, underspecified, or too thin</div>
            </CardContent>
          </Card>
        </div>

        {sourceUnavailable ? (
          <Card className="p-5">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="rounded-2xl border border-[var(--panel-line)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--shell-panel)_96%,transparent),color-mix(in_srgb,var(--background)_88%,transparent))] p-5">
                <div className="text-[12.5px] font-medium text-ink-secondary">Skill sources unavailable</div>
                <div className="mt-2 text-2xl font-semibold text-foreground">Mission Control cannot reach the configured skill roots right now.</div>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                  That is why this view currently shows zero skills and the editor rail falls back into a request error. This should degrade into setup guidance, not a broken workspace.
                </p>
                <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                  {error}
                </div>
              </div>
              <div className="rounded-2xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] p-5">
                <div className="text-[12.5px] font-medium text-ink-secondary">What to check</div>
                <ul className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
                  <li>Confirm the orchestration server is running and reachable from the UI.</li>
                  <li>Verify the repo plugin skills and local Codex skill paths still exist on disk.</li>
                  <li>Use Refresh after the server is healthy instead of editing around a broken source.</li>
                </ul>
              </div>
            </div>
          </Card>
        ) : null}

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
          <Card className="min-h-0 overflow-hidden">
            <CardContent className="flex h-full flex-col gap-4 p-4">
              <div className="rounded-xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] p-3">
                <div className="flex items-center gap-2 rounded-2xl border border-[var(--panel-line)] bg-background/60 px-3 py-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search skills"
                    className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {SOURCE_FILTERS.map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setSourceFilter(filter.id)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors",
                        sourceFilter === filter.id
                          ? "border-cyan-300/35 bg-cyan-400/12 text-cyan-100"
                          : "border-[var(--panel-line)] bg-transparent text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-[var(--panel-line)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--shell-panel)_92%,transparent),color-mix(in_srgb,var(--background)_88%,transparent))] p-4">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200/70">
                  <WandSparkles className="h-3.5 w-3.5" />
                  Operator guidance
                </div>
                <div className="mt-2 text-sm font-semibold text-foreground">
                  {selectedSkill ? "What to improve next" : "Pick a skill to review"}
                </div>
                <div className="mt-2 space-y-2">
                  {(selectedSkillRecommendations.length > 0
                    ? selectedSkillRecommendations
                    : [
                        {
                          title: "Start with SKILL.md",
                          detail: "The top-level skill file is still the fastest way to understand what an agent will actually do.",
                          tone: "neutral" as const,
                        },
                      ]).map((recommendation) => (
                    <div
                      key={recommendation.title}
                      className={cn(
                        "rounded-2xl border px-3 py-3",
                        recommendationToneClass[recommendation.tone]
                      )}
                    >
                      <div className="text-xs font-semibold text-foreground">{recommendation.title}</div>
                      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                        {recommendation.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-auto space-y-3 pr-1">
                {loadingSkills ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="rounded-xl border border-[var(--panel-line)] p-4">
                      <div className="h-4 w-32 rounded animate-pulse bg-surface-2" />
                      <div className="mt-3 h-3 w-full rounded animate-pulse bg-surface-2" />
                      <div className="mt-2 h-3 w-4/5 rounded animate-pulse bg-surface-2" />
                    </div>
                  ))
                ) : filteredSkills.length === 0 ? (
                  <EmptyState
                    icon={Bot}
                    title="No matching skills"
                    description="Adjust the source filter or search query to find the capability you want to inspect."
                  />
                ) : (
                  filteredSkills.map((skill) => {
                    const selected = skill.id === selectedSkillId;
                    return (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() => handleSelectSkill(skill.id)}
                        className={cn(
                          "w-full rounded-xl border p-4 text-left transition-all duration-200",
                          selected
                            ? "border-cyan-300/30 bg-cyan-400/10 shadow-[0_0_0_1px_rgba(34,211,238,0.16),0_18px_40px_rgba(8,47,73,0.28)]"
                            : "border-[var(--panel-line)] bg-[color:var(--shell-panel)] hover:border-[var(--panel-line-strong)]"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-foreground">{skill.name}</div>
                            <div className="mt-1 truncate text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                              {skill.relativePath}
                            </div>
                          </div>
                          <Badge variant="outline" className={SOURCE_STYLES[skill.source]}>
                            {skill.sourceLabel}
                          </Badge>
                        </div>
                        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {skill.description ?? "No description found in SKILL.md frontmatter."}
                        </p>
                        <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>{skill.fileCount} files</span>
                          <span>{formatRelativeTime(skill.updatedAt)}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid min-h-0 grid-cols-1 gap-4 2xl:grid-cols-[280px_minmax(0,1fr)]">
            <Card className="min-h-0 overflow-hidden">
              <CardContent className="flex h-full flex-col p-4">
                <div className="mb-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200/65">
                    File tree
                  </div>
                  <div className="mt-1 text-sm font-semibold text-foreground">
                    {selectedSkill?.name ?? "Select a skill"}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {selectedSkill?.description ?? "Choose a skill to inspect its file layout."}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pb-4">
                  <div className="rounded-2xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-3 py-2">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Source</div>
                    <div className="mt-1 text-xs font-semibold text-foreground">{selectedSkill?.sourceLabel ?? "N/A"}</div>
                  </div>
                  <div className="rounded-2xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-3 py-2">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Files</div>
                    <div className="mt-1 text-xs font-semibold text-foreground">{selectedSkill?.fileCount ?? 0}</div>
                  </div>
                </div>

                <div className="mb-4 rounded-xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] p-3">
                  <div className="flex items-center gap-2 rounded-2xl border border-[var(--panel-line)] bg-background/60 px-3 py-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <input
                      value={fileSearch}
                      onChange={(event) => setFileSearch(event.target.value)}
                      placeholder="Filter files"
                      className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={openSkillDefinition} disabled={!files.some((file) => file.path === "SKILL.md")}>
                      <FileText className="h-3.5 w-3.5" />
                      Open SKILL.md
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => void copyValue("skill", selectedSkill?.id ?? null)} disabled={!selectedSkill}>
                      {copiedState === "skill" ? <CheckCheck className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedState === "skill" ? "Copied skill id" : "Copy skill id"}
                    </Button>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-auto pr-1">
                  {loadingFiles ? (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading files...
                    </div>
                  ) : files.length === 0 ? (
                    <EmptyState
                      icon={Folder}
                      title="No files loaded"
                      description="Select a skill from the left rail to inspect its source files."
                    />
                  ) : visibleFiles.length === 0 ? (
                    <EmptyState
                      icon={Search}
                      title="No matching files"
                      description="Try a broader file search or clear the current filter."
                    />
                  ) : (
                    <div className="space-y-1">{renderTree(fileTree)}</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="min-h-0 overflow-hidden">
              <CardContent className="flex h-full flex-col p-0">
                <div className="flex items-center justify-between border-b border-[var(--panel-line)] px-4 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-foreground">
                      {selectedFile?.path ?? "Select a file"}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span>{selectedFile ? formatFileSize(selectedFile.size) : "0 B"}</span>
                      <span>{selectedFile ? formatRelativeTime(selectedFile.updatedAt) : "No file selected"}</span>
                      {dirty ? <span className="text-amber-200">Unsaved changes</span> : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditMode((current) => !current)}
                      disabled={!selectedFilePath || loadingContent}
                    >
                      <PencilLine className="h-3.5 w-3.5" />
                      {editMode ? "Preview" : "Edit"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void copyValue("file", selectedFile?.path ?? null)}
                      disabled={!selectedFile}
                    >
                      {copiedState === "file" ? <CheckCheck className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedState === "file" ? "Copied file" : "Copy path"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={resetDraft} disabled={!dirty}>
                      <RotateCcw className="h-3.5 w-3.5" />
                      Revert
                    </Button>
                    <Button
                      size="sm"
                      variant="neon-cyan"
                      onClick={() => void saveCurrentFile()}
                      disabled={!selectedFilePath || !dirty || saving}
                    >
                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      Save
                    </Button>
                  </div>
                </div>

                {error && selectedFilePath ? (
                  <div className="border-b border-red-400/20 bg-red-400/10 px-4 py-2 text-xs text-red-100">
                    {error}
                  </div>
                ) : null}

                {selectedSkillRecommendations.length > 0 && (
                  <div className="border-b border-[var(--panel-line)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--shell-panel)_88%,transparent),transparent)] px-4 py-3">
                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/70">
                      Suggested improvements
                    </div>
                    <div className="grid gap-2 xl:grid-cols-2">
                      {selectedSkillRecommendations.slice(0, 2).map((recommendation) => (
                        <div
                          key={recommendation.title}
                          className={cn(
                            "rounded-2xl border px-3 py-2.5",
                            recommendationToneClass[recommendation.tone]
                          )}
                        >
                          <div className="text-xs font-semibold text-foreground">{recommendation.title}</div>
                          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                            {recommendation.detail}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="min-h-0 flex-1">
                  {!selectedFilePath ? (
                    <EmptyState
                      icon={FileCode2}
                      title="Choose a skill file"
                      description="Select a file from the tree to inspect the skill definition and supporting assets."
                      className="h-full"
                    />
                  ) : loadingContent ? (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading file contents...
                    </div>
                  ) : editMode ? (
                    <div className="grid h-full min-h-0 grid-cols-[56px_minmax(0,1fr)] bg-[linear-gradient(180deg,rgba(3,7,18,0.94),rgba(10,15,30,0.94))]">
                      <pre className="overflow-hidden border-r border-[var(--panel-line)] px-3 py-4 text-right font-mono text-[11px] leading-6 text-muted-foreground">
                        {buildLineNumbers(draftContent)}
                      </pre>
                      <Textarea
                        value={draftContent}
                        onChange={(event) => setDraftContent(event.target.value)}
                        spellCheck={false}
                        className="h-full min-h-0 resize-none border-0 bg-transparent px-4 py-4 font-mono text-[12px] leading-6 text-slate-100 shadow-none focus-visible:ring-0"
                      />
                    </div>
                  ) : (
                    <div className="grid h-full min-h-0 grid-cols-[56px_minmax(0,1fr)] bg-[linear-gradient(180deg,rgba(3,7,18,0.94),rgba(10,15,30,0.94))]">
                      <pre className="overflow-hidden border-r border-[var(--panel-line)] px-3 py-4 text-right font-mono text-[11px] leading-6 text-muted-foreground">
                        {buildLineNumbers(savedContent)}
                      </pre>
                      <pre className="overflow-auto px-4 py-4 font-mono text-[12px] leading-6 text-slate-100">
                        <code>{savedContent}</code>
                      </pre>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </div>
    </main>
  );
}
