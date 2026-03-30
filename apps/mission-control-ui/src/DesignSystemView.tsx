import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "./components/PageHeader";
import {
  SwatchBook,
  Type,
  PanelsTopLeft,
  Sparkles,
  ArrowRight,
  Workflow,
  Wand2,
} from "lucide-react";

const VISUAL_PILLARS = [
  {
    title: "State before decoration",
    description: "The UI should answer what is happening and what needs attention before it tries to impress anyone.",
  },
  {
    title: "One recognizable language",
    description: "Every page should look like Mission Control, even when new agents or tools generate parts of it.",
  },
  {
    title: "Prototype before complexity",
    description: "Design intent gets locked visually before backend complexity and implementation drift expand.",
  },
];

const COLOR_TOKENS = [
  { label: "Background", value: "Deep command deck", swatch: "bg-[#06101b]" },
  { label: "Panel", value: "Dark glass surface", swatch: "bg-[#0a1726]" },
  { label: "Primary", value: "Emerald action", swatch: "bg-emerald-400" },
  { label: "Secondary", value: "Cyan signal", swatch: "bg-cyan-300" },
  { label: "Warning", value: "Amber review", swatch: "bg-amber-300" },
  { label: "Danger", value: "Restrained red", swatch: "bg-rose-400" },
];

const WORKFLOW_STEPS = [
  {
    title: "Lock the visual contract",
    detail: "Use root `design.md` as the shared source of truth for colors, typography, motion, and anti-patterns.",
  },
  {
    title: "Generate or redesign from references",
    detail: "Borrow patterns and hierarchy from references without cloning them. Original composition is the requirement.",
  },
  {
    title: "Approve the prototype",
    detail: "Do not let backend work race ahead of a visual direction that still feels generic or unstable.",
  },
  {
    title: "Implement with shadcn primitives",
    detail: "Use accessible, interactive primitives as the base layer and apply Mission Control’s styling through tokens and wrappers.",
  },
];

export function DesignSystemView() {
  return (
    <main className="mc-page">
      <PageHeader
        title="Design DNA"
        description="Mission Control’s shared visual contract. This is the source design language that keeps redesigns, generated pages, and component work consistent."
        icon={<SwatchBook className="h-4.5 w-4.5" strokeWidth={1.7} />}
        status={
          <Badge variant="outline" className="border-cyan-300/20 text-cyan-100">
            Powered by root `design.md`
          </Badge>
        }
      />

      <div className="mc-page-body mc-page-stack">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <Card className="p-5">
            <div className="mc-kicker">Why this exists</div>
            <div className="mt-2 text-xl font-semibold text-foreground">
              Generated apps look the same when design intent stays implicit.
            </div>
            <div className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Mission Control now has an explicit design contract so new pages, redesigns, and agent-generated UI all inherit the same visual language instead of drifting into generic AI dashboards.
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline" className="border-cyan-300/20 text-cyan-100">Design contract</Badge>
              <Badge variant="outline" className="border-emerald-300/20 text-emerald-100">Transferable between agents</Badge>
              <Badge variant="outline" className="border-amber-300/20 text-amber-100">Prototype-first</Badge>
            </div>
          </Card>

          <Card className="p-5">
            <div className="mc-kicker">Repo artifact</div>
            <div className="mt-2 text-sm font-semibold text-foreground">`design.md` is now the source of truth.</div>
            <div className="mt-2 text-sm leading-relaxed text-muted-foreground">
              It captures product intent, brand posture, layout rules, motion, color roles, component direction, reference-handling rules, and shadcn implementation guidance in agent-readable form. `docs/design.md` remains the extended companion reference.
            </div>
            <div className="mt-4 inline-flex rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100">
              Shared with future generators and redesign flows
            </div>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {VISUAL_PILLARS.map((pillar) => (
            <Card key={pillar.title} className="p-5">
              <div className="mc-kicker">Principle</div>
              <div className="mt-2 text-sm font-semibold text-foreground">{pillar.title}</div>
              <div className="mt-2 text-sm leading-relaxed text-muted-foreground">{pillar.description}</div>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4 text-cyan-100" />
              <div className="mc-kicker">Typography and atmosphere</div>
            </div>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Display tone</div>
                <div className="mt-2 font-[family:var(--font-display)] text-2xl font-semibold tracking-[0.08em] text-foreground">
                  Mission Control
                </div>
                <div className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Geometric, futuristic, legible. Strong enough for command surfaces without turning theatrical.
                </div>
              </div>
              <div className="rounded-xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Body tone</div>
                <div className="mt-2 text-sm leading-relaxed text-foreground">
                  Calm, readable, dense when needed. The UI should feel like an operating system, not ad copy.
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <PanelsTopLeft className="h-4 w-4 text-cyan-100" />
              <div className="mc-kicker">Color system</div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {COLOR_TOKENS.map((token) => (
                <div key={token.label} className="rounded-xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg border border-white/10 ${token.swatch}`} />
                    <div>
                      <div className="text-sm font-semibold text-foreground">{token.label}</div>
                      <div className="text-xs text-muted-foreground">{token.value}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Workflow className="h-4 w-4 text-cyan-100" />
              <div className="mc-kicker">Stitch-inspired workflow</div>
            </div>
            <div className="mt-4 space-y-3">
              {WORKFLOW_STEPS.map((step, index) => (
                <div key={step.title} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-400/10 text-xs font-semibold text-cyan-100">
                    {index + 1}
                  </div>
                  <div className="min-w-0 rounded-xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-4 py-3">
                    <div className="text-sm font-semibold text-foreground">{step.title}</div>
                    <div className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-cyan-100" />
              <div className="mc-kicker">Applied to Mission Control</div>
            </div>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
              <div className="rounded-xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-4 py-3">
                The shell, home, pipeline, docs, projects, and chat surfaces now inherit a shared visual language instead of evolving independently.
              </div>
              <div className="rounded-xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-4 py-3">
                The UI now has a reviewable design contract, which means future redesigns can be original without becoming inconsistent.
              </div>
              <div className="rounded-xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-4 py-3">
                The next maturity step is to let skills and generators consume root `design.md` automatically when creating new pages or features.
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-100" />
            <div className="mc-kicker">Recommendation</div>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Any new screen, redesign prompt, or shadcn conversion should reference root `design.md` first. That is how we keep Mission Control from drifting into whatever the model has seen most recently.
            </div>
            <div className="flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100">
              Design contract first
              <ArrowRight className="h-3.5 w-3.5" />
              UI generation second
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
