import type { Id } from "../../../convex/_generated/dataModel";
import type { MainView } from "./TopNav";
import { cn } from "@/lib/utils";
import {
  Bot,
  Cloud,
  Wrench,
  Search,
  PenLine,
  Palette,
  Megaphone,
  Code2,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

interface TeamViewProps {
  projectId: Id<"projects"> | null;
  onNavigate?: (view: MainView) => void;
}

interface RoleCardData {
  name: string;
  role: string;
  description: string;
  skills: string[];
  icon: LucideIcon;
  tagColor: string;
}

const SOFIE: RoleCardData = {
  name: "Sofie",
  role: "Chief of Staff",
  description: "Coordinates, delegates, keeps the ship tight. The first point of contact between boss and machine.",
  skills: ["Orchestration", "Clarity", "Delegation"],
  icon: Bot,
  tagColor: "bg-primary/20 text-primary border-primary/40",
};

const OPERATIONS: RoleCardData[] = [
  {
    name: "Charlie",
    role: "Infrastructure Engineer",
    description: "Infrastructure and automation specialist",
    skills: ["coding", "infrastructure", "automation"],
    icon: Cloud,
    tagColor: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  },
  {
    name: "Ralph",
    role: "Foreman / QA Manager",
    description: "Checks the work, signs off or sends it back. No-nonsense quality control.",
    skills: ["Quality Assurance", "Monitoring", "Demo Recording"],
    icon: Wrench,
    tagColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  },
];

const INPUT_OUTPUT: RoleCardData[] = [
  {
    name: "Scout",
    role: "Trend Analyst",
    description: "Finds leads, tracks signals, scouts…",
    skills: ["Speed", "Radar", "Intuition"],
    icon: Search,
    tagColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  },
  {
    name: "Quill The Artisan",
    role: "Content Writer",
    description: "Writes copy, designs content…",
    skills: ["Voice", "Quality", "Design"],
    icon: PenLine,
    tagColor: "bg-violet-500/20 text-violet-300 border-violet-500/40",
  },
  {
    name: "Pixel",
    role: "Thumbnail Designer",
    description: "Designs thumbnails, crafts visuals,…",
    skills: ["Visual", "Attention", "Style"],
    icon: Palette,
    tagColor: "bg-pink-500/20 text-pink-300 border-pink-500/40",
  },
  {
    name: "Echo",
    role: "Social Media Manager",
    description: "Posts, engages, grows the audience…",
    skills: ["Viral", "Speed", "Reach"],
    icon: Megaphone,
    tagColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
  },
];

const META_LAYER: RoleCardData[] = [
  {
    name: "Codex",
    role: "Lead Engineer",
    description: "Builds, fixes, automates. The quiet one who makes everything actually work.",
    skills: ["Code", "Systems", "Reliability"],
    icon: Code2,
    tagColor: "bg-orange-500/20 text-orange-300 border-orange-500/40",
  },
  {
    name: "Violet",
    role: "Research Analyst",
    description: "Deep research and analysis specialist",
    skills: ["research", "analysis", "trends"],
    icon: Sparkles,
    tagColor: "bg-purple-400/20 text-purple-200 border-purple-400/40",
  },
];

function RoleCard({
  data,
  onNavigate,
}: {
  data: RoleCardData;
  onNavigate?: (view: MainView) => void;
}) {
  const Icon = data.icon;
  const goToAgents = () => onNavigate?.("agents");
  const goToHiring = () => onNavigate?.("hiring");
  const goToOrg = () => onNavigate?.("org");
  return (
    <div
      role={onNavigate ? "button" : undefined}
      tabIndex={onNavigate ? 0 : undefined}
      onClick={onNavigate ? goToAgents : undefined}
      onKeyDown={
        onNavigate
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                goToAgents();
              }
            }
          : undefined
      }
      className={cn(
        "rounded-xl border border-border bg-card/80 p-4 flex gap-4 min-w-[260px] max-w-[320px]",
        "shadow-sm transition-all",
        onNavigate && "cursor-pointer hover:border-primary/30 hover:shadow-md"
      )}
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-foreground">{data.name}</div>
        <div className="text-sm text-muted-foreground">{data.role}</div>
        <p className="text-sm text-muted-foreground/90 mt-1 line-clamp-2">{data.description}</p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {data.skills.map((s) => (
            <span
              key={s}
              className={cn(
                "text-xs px-2 py-0.5 rounded-full border",
                data.tagColor
              )}
            >
              {s}
            </span>
          ))}
        </div>
        <div className="text-xs text-muted-foreground mt-2 flex items-center justify-between">
          <span>ROLE CARD</span>
          {onNavigate && (
            <span className="flex gap-1">
              <button
                type="button"
                className="text-primary hover:underline text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  goToOrg();
                }}
              >
                Org
              </button>
              <span className="text-muted-foreground">·</span>
              <button
                type="button"
                className="text-primary hover:underline text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  goToHiring();
                }}
              >
                Hiring
              </button>
              <span>→</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function LayerLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-2">
      {children}
    </div>
  );
}

export function TeamView({ projectId: _projectId, onNavigate }: TeamViewProps) {
  return (
    <main className="flex-1 overflow-auto bg-background">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Quote banner */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-6 py-4 mb-8">
          <p className="text-foreground text-lg font-medium">
            &ldquo;An autonomous organization of AI agents that does work for me and produces value 24/7&rdquo;
          </p>
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-4">Meet the Team</h1>
        <p className="text-muted-foreground mb-2">
          9 AI agents across 3 machines, each with a real role and a real personality.
        </p>
        <p className="text-muted-foreground mb-10 max-w-2xl">
          We wanted to see what happens when AI doesn&apos;t just answer questions — but actually runs a company.
          Research markets. Write content. Post on social media. Ship products. All without being told what to do.
        </p>

        {/* Sofie — top center */}
        <div className="flex justify-center mb-6">
          <RoleCard data={SOFIE} onNavigate={onNavigate} />
        </div>

        {/* Connector: vertical then horizontal */}
        <div className="flex justify-center mb-2">
          <div className="w-px h-6 bg-border" />
        </div>
        <div className="flex justify-center mb-2">
          <div className="w-48 h-px bg-border" />
        </div>

        {/* OPERATIONS (Mac Studio 2) */}
        <LayerLabel>OPERATIONS (Mac Studio 2)</LayerLabel>
        <div className="flex flex-wrap gap-4 justify-center mb-10">
          {OPERATIONS.map((data) => (
            <RoleCard key={data.name} data={data} onNavigate={onNavigate} />
          ))}
        </div>

        {/* INPUT SIGNAL / OUTPUT ACTION */}
        <div className="flex items-center justify-center gap-4 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            INPUT SIGNAL
          </span>
          <div className="w-px h-4 bg-border" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            OUTPUT ACTION
          </span>
        </div>
        <div className="flex flex-wrap gap-4 justify-center mb-10">
          {INPUT_OUTPUT.map((data) => (
            <RoleCard key={data.name} data={data} onNavigate={onNavigate} />
          ))}
        </div>

        {/* META LAYER */}
        <LayerLabel>META LAYER</LayerLabel>
        <div className="flex flex-wrap gap-4 justify-center">
          {META_LAYER.map((data) => (
            <RoleCard key={data.name} data={data} onNavigate={onNavigate} />
          ))}
        </div>
      </div>
    </main>
  );
}
