import type { Id } from "../../../convex/_generated/dataModel";
import type { MainView } from "./TopNav";
import { cn } from "@/lib/utils";
import { PageHeader } from "./components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Bot,
  Cloud,
  Code2,
  Megaphone,
  Palette,
  PenLine,
  Search,
  ShieldCheck,
  Sparkles,
  Wrench,
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
  accentClass: string;
}

interface TeamSection {
  id: string;
  label: string;
  description: string;
  members: RoleCardData[];
}

const SOFIE: RoleCardData = {
  name: "Sofie",
  role: "Chief of Staff",
  description: "Coordinates delegation, keeps execution tidy, and turns rough intent into accountable motion across the fleet.",
  skills: ["Orchestration", "Clarity", "Delegation"],
  icon: ShieldCheck,
  accentClass: "border-cyan-300/20 bg-cyan-400/8 text-cyan-100",
};

const TEAM_SECTIONS: TeamSection[] = [
  {
    id: "operations",
    label: "Operations layer",
    description: "Infrastructure, QA, and the control paths that keep the system stable under load.",
    members: [
      {
        name: "Charlie",
        role: "Infrastructure Engineer",
        description: "Owns automation, runtime reliability, and the machinery underneath day-to-day execution.",
        skills: ["Infrastructure", "Automation", "Reliability"],
        icon: Cloud,
        accentClass: "border-blue-300/18 bg-blue-400/8 text-blue-100",
      },
      {
        name: "Ralph",
        role: "Foreman / QA Manager",
        description: "Checks output quality, closes loops, and sends weak work back before it creates trust debt.",
        skills: ["Quality", "Monitoring", "Review"],
        icon: Wrench,
        accentClass: "border-amber-300/18 bg-amber-400/8 text-amber-100",
      },
    ],
  },
  {
    id: "signals",
    label: "Signal and output",
    description: "The layer that senses demand, shapes narrative, and turns signals into outward motion.",
    members: [
      {
        name: "Scout",
        role: "Trend Analyst",
        description: "Looks for leading indicators, opportunities, and changes in demand before they become obvious.",
        skills: ["Radar", "Research", "Signal quality"],
        icon: Search,
        accentClass: "border-emerald-300/18 bg-emerald-400/8 text-emerald-100",
      },
      {
        name: "Quill The Artisan",
        role: "Content Writer",
        description: "Translates intent into clear, on-brand writing that feels deliberate instead of automated.",
        skills: ["Voice", "Narrative", "Editing"],
        icon: PenLine,
        accentClass: "border-violet-300/18 bg-violet-400/8 text-violet-100",
      },
      {
        name: "Pixel",
        role: "Thumbnail Designer",
        description: "Owns visual framing, promotional assets, and attention-shaping design work.",
        skills: ["Design", "Visual taste", "Brand consistency"],
        icon: Palette,
        accentClass: "border-pink-300/18 bg-pink-400/8 text-pink-100",
      },
      {
        name: "Echo",
        role: "Social Media Manager",
        description: "Pushes distribution, keeps channels active, and turns finished work into visible reach.",
        skills: ["Distribution", "Speed", "Audience"],
        icon: Megaphone,
        accentClass: "border-cyan-300/18 bg-cyan-400/8 text-cyan-100",
      },
    ],
  },
  {
    id: "meta",
    label: "Meta layer",
    description: "Build, research, and product intelligence used to improve the system itself.",
    members: [
      {
        name: "Codex",
        role: "Lead Engineer",
        description: "Builds, fixes, and keeps the product moving toward something we would actually ship.",
        skills: ["Code", "Systems", "Launchability"],
        icon: Code2,
        accentClass: "border-orange-300/18 bg-orange-400/8 text-orange-100",
      },
      {
        name: "Violet",
        role: "Research Analyst",
        description: "Handles deep analysis, research synthesis, and the work needed before decisions become irreversible.",
        skills: ["Research", "Analysis", "Context"],
        icon: Sparkles,
        accentClass: "border-fuchsia-300/18 bg-fuchsia-400/8 text-fuchsia-100",
      },
    ],
  },
];

function TeamMemberCard({ member, onNavigate }: { member: RoleCardData; onNavigate?: (view: MainView) => void }) {
  const Icon = member.icon;

  return (
    <Card className="p-5">
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border shadow-[var(--glow-cyan)]",
            member.accentClass
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={1.7} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-foreground">{member.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">{member.role}</div>
            </div>
            <Badge variant="outline" className="border-[var(--panel-line)] text-muted-foreground">
              role card
            </Badge>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{member.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {member.skills.map((skill) => (
              <Badge key={skill} variant="outline" className="border-[var(--panel-line)] text-muted-foreground">
                {skill}
              </Badge>
            ))}
          </div>
          {onNavigate ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => onNavigate("agents")}>
                Open agents
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onNavigate("org")}>
                Org chart
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

export function TeamView({ projectId: _projectId, onNavigate }: TeamViewProps) {
  const totalAgents = TEAM_SECTIONS.reduce((sum, section) => sum + section.members.length, 1);

  return (
    <main className="mc-page">
      <PageHeader
        title="Team"
        description="A readable map of who does what inside Mission Control so operators can understand ownership before they delegate work."
        eyebrow="Comms"
        icon={<Bot className="h-4.5 w-4.5" strokeWidth={1.7} />}
        status={
          <Badge variant="outline" className="border-cyan-300/20 text-cyan-100">
            {totalAgents} active roles
          </Badge>
        }
        actions={
          <div className="flex gap-2">
            {onNavigate ? (
              <>
                <Button variant="outline" size="sm" onClick={() => onNavigate("org")}>
                  Org chart
                </Button>
                <Button variant="neon-cyan" size="sm" onClick={() => onNavigate("agents")}>
                  Open agents
                </Button>
              </>
            ) : null}
          </div>
        }
      />

      <div className="mc-page-body mc-page-stack">
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4">
            <div className="mc-kicker">Roles mapped</div>
            <div className="mt-2 text-3xl font-semibold text-foreground">{totalAgents}</div>
            <div className="mt-1 text-xs text-muted-foreground">Named responsibilities represented in the operating model</div>
          </Card>
          <Card className="p-4">
            <div className="mc-kicker">Leadership</div>
            <div className="mt-2 text-3xl font-semibold text-cyan-100">1</div>
            <div className="mt-1 text-xs text-muted-foreground">Sofie remains the primary coordination layer for operator intent</div>
          </Card>
          <Card className="p-4">
            <div className="mc-kicker">Execution bands</div>
            <div className="mt-2 text-3xl font-semibold text-foreground">{TEAM_SECTIONS.length}</div>
            <div className="mt-1 text-xs text-muted-foreground">Operations, signal/output, and meta-system work</div>
          </Card>
          <Card className="p-4">
            <div className="mc-kicker">Design rule</div>
            <div className="mt-2 text-3xl font-semibold text-emerald-200">Clear</div>
            <div className="mt-1 text-xs text-muted-foreground">Every role needs an obvious reason to exist and a clear handoff boundary</div>
          </Card>
        </div>

        <Card className="p-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_320px]">
            <div>
              <div className="mc-kicker">Operator brief</div>
              <h2 className="mt-2 font-[family:var(--font-display)] text-2xl font-semibold tracking-[0.04em] text-foreground">
                An autonomous organization of AI agents that does real work with real accountability.
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                This page should help an operator understand responsibilities quickly. It is not a vanity gallery. If a role or
                section feels ornamental, it should be merged, renamed, or removed.
              </p>
            </div>
            <div className="space-y-3">
              <div className="rounded-xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-4 py-4 text-sm leading-relaxed text-muted-foreground">
                Use Team to orient new operators, then move to Org Chart when you need direct reporting structure.
              </div>
              <div className="rounded-xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-4 py-4 text-sm leading-relaxed text-muted-foreground">
                Every role should map cleanly to a buyer, seller, or platform problem. If it does not, it is likely scope drift.
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-5 flex items-start gap-4 rounded-2xl border border-cyan-300/16 bg-cyan-400/6 p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-400/8 text-cyan-100 shadow-[var(--glow-cyan)]">
              <SOFIE.icon className="h-5 w-5" strokeWidth={1.7} />
            </div>
            <div className="min-w-0">
              <div className="mc-kicker">Chief of staff</div>
              <div className="mt-1 text-lg font-semibold text-foreground">{SOFIE.name}</div>
              <div className="text-sm text-muted-foreground">{SOFIE.role}</div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{SOFIE.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {SOFIE.skills.map((skill) => (
                  <Badge key={skill} variant="outline" className="border-cyan-300/20 text-cyan-100">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {TEAM_SECTIONS.map((section) => (
              <section key={section.id} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="mc-kicker">{section.label}</div>
                  <div className="h-px flex-1 bg-[var(--panel-line)]" />
                </div>
                <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{section.description}</p>
                <div className="grid gap-4 xl:grid-cols-2">
                  {section.members.map((member) => (
                    <TeamMemberCard key={member.name} member={member} onNavigate={onNavigate} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </Card>

        {onNavigate ? (
          <Card className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mc-kicker">Next step</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Move from role mapping into structure or staffing if the current operating model feels thin.
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => onNavigate("org")}>
                  Org chart
                </Button>
                <Button variant="neon-cyan" onClick={() => onNavigate("hiring")}>
                  Hiring
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ) : null}
      </div>
    </main>
  );
}
