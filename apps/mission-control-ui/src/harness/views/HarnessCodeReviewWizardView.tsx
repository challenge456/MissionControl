import { useState } from "react";
import { ClipboardCheck, FileSearch, FlaskConical, Gauge, Repeat2, ShieldCheck, Workflow } from "lucide-react";
import type { MainView } from "../../TopNav";
import { HarnessPage } from "../components/HarnessUi";
import { HarnessLegibilityCallout } from "../components/HarnessPrinciples";
import { HarnessCodeReviewWizardSteps } from "../components/HarnessCodeReviewWizardSteps";
import { Button } from "@/components/ui/button";
import type { Id } from "../../../../../convex/_generated/dataModel";

const WIZARD_STEPS = [
  { id: 1, title: "Evidence", detail: "Scan PR comments, issues, and CI failures from the last week — legible surfaces only." },
  { id: 2, title: "Confirm findings", detail: "Editable checklist of recurring agent mistakes (security, reuse, error handling)." },
  { id: 3, title: "Review skill", detail: "Create an owned code-review skill in Registry — team agrees on style guide." },
  { id: 4, title: "CI automation", detail: "GitHub Action / Launch — outer loop runs on every PR open." },
  { id: 5, title: "Change Risk", detail: "Policy gate: small stacked PRs auto-merge; production paths need human review." },
  { id: 6, title: "Verifiers", detail: "Shift expensive checks left — targeted LLM lint rules at ~$0.30/day vs ~$25/PR." },
  { id: 7, title: "Meta loop", detail: "Maintenance agent mines PR comments nightly and proposes harness fixes." },
];

const REVIEW_CAPABILITIES: Array<{
  title: string;
  description: string;
  detail: string;
  icon: typeof FileSearch;
  view: MainView;
  action: string;
}> = [
  {
    title: "Change review lenses",
    description: "Score each pull request through security, correctness, and style lenses.",
    detail: "Configured per repository and visible alongside the PR evidence.",
    icon: FileSearch,
    view: "harness-change-review",
    action: "Open change review",
  },
  {
    title: "Mutation testing",
    description: "Measure diff coverage and surface escaped mutations on changed files.",
    detail: "Focuses review attention on test gaps that CI alone does not explain.",
    icon: FlaskConical,
    view: "harness-change-review",
    action: "Inspect mutation results",
  },
  {
    title: "Merge gates",
    description: "Combine CI, review scores, and human-touch thresholds into a clear verdict.",
    detail: "Keeps high-risk changes with an accountable reviewer before merge.",
    icon: ShieldCheck,
    view: "harness-change-review",
    action: "Review merge gate",
  },
  {
    title: "Continuous improvement",
    description: "Turn recurring PR feedback into owned skills, verifiers, and eval scenarios.",
    detail: "The nightly meta loop makes review quality compound over time.",
    icon: Workflow,
    view: "harness-meta-loop",
    action: "Open meta loop",
  },
  {
    title: "Agent code quality",
    description: "Prove that a skill improves outcomes before it becomes team policy.",
    detail: "Compare baseline and candidate runs, then promote only evidence-backed improvements.",
    icon: Gauge,
    view: "registry-runs",
    action: "Open eval runs",
  },
  {
    title: "Repetitive work automation",
    description: "Turn recurring operator work into scheduled, governed factory workflows.",
    detail: "Detect repeated work, promote it to a Work Order, and keep receipts for the meta loop.",
    icon: Repeat2,
    view: "harness-automations",
    action: "Open automations",
  },
];

export function HarnessCodeReviewWizardView({
  onNavigate,
  projectId,
}: {
  onNavigate: (view: MainView) => void;
  projectId?: Id<"projects"> | null;
}): JSX.Element {
  const [step, setStep] = useState(0);
  const current = WIZARD_STEPS[step];

  return (
    <HarnessPage
      title="Code Review Setup"
      description="Golden path: one outcome → three review layers (agentic, risk, verifiers)."
      icon={<ClipboardCheck className="h-5 w-5 text-registry-accent" />}
    >
      <div className="mx-auto max-w-[960px] space-y-6">
        <HarnessLegibilityCallout />
        <section aria-labelledby="agentic-review-capabilities">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="agentic-review-capabilities" className="text-base font-semibold text-ink">
                Agentic code review capabilities
              </h2>
              <p className="mt-1 text-sm text-ink-secondary">
                Review, quality, and automation surfaces that make agent work safer and progressively more autonomous.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => onNavigate("harness-change-review")}>
              Review a pull request
            </Button>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {REVIEW_CAPABILITIES.map((capability) => {
              const Icon = capability.icon;
              return (
                <div key={capability.title} className="rounded-xl border border-line bg-surface-1 p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg border border-line bg-surface-2 p-2 text-registry-accent">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-ink">{capability.title}</h3>
                      <p className="mt-1 text-sm text-ink-secondary">{capability.description}</p>
                      <p className="mt-2 text-xs text-ink-muted">{capability.detail}</p>
                      <Button
                        variant="link"
                        size="sm"
                        className="mt-2 h-auto px-0 text-registry-accent"
                        onClick={() => onNavigate(capability.view)}
                      >
                        {capability.action}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="review-setup-protocol">
          <div>
            <h2 id="review-setup-protocol" className="text-base font-semibold text-ink">
              Setup protocol
            </h2>
            <p className="mt-1 text-sm text-ink-secondary">
              Establish the review policy once, then let the factory run it consistently on every pull request.
            </p>
          </div>
        </section>
        <div className="flex gap-1">
          {WIZARD_STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`h-1 flex-1 rounded-full ${i <= step ? "bg-registry-accent" : "bg-surface-2"}`}
            />
          ))}
        </div>

        <div className="rounded-xl border border-line bg-surface-1 p-6">
          <div className="text-xs uppercase text-ink-muted">
            Step {current.id} of {WIZARD_STEPS.length}
          </div>
          <h2 className="mt-1 text-lg font-semibold text-ink">{current.title}</h2>
          <p className="mt-2 text-sm text-ink-secondary">{current.detail}</p>
          <div className="mt-4">
            <HarnessCodeReviewWizardSteps step={step} projectId={projectId} onNavigate={onNavigate} />
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" size="sm" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
            Back
          </Button>
          {step < WIZARD_STEPS.length - 1 ? (
            <Button size="sm" onClick={() => setStep((s) => s + 1)}>
              Continue
            </Button>
          ) : (
            <Button size="sm" onClick={() => onNavigate("harness-health")}>
              Finish → Factory Health
            </Button>
          )}
        </div>
      </div>
    </HarnessPage>
  );
}
