import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { CheckCircle2, GitBranch, ShieldCheck, Sparkles } from "lucide-react";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { cn } from "../lib/utils";
import {
  FACTORY_RECIPES,
  factoryExperienceMetadata,
  getFactoryRecipe,
  recommendFactoryRecipe,
  type FactoryExperienceLevel,
  type ModelRoutingIntent,
} from "./recipeCatalog";

type ExecutionEnvironment = "LOCAL" | "CLOUD" | "REMOTE" | "POLICY_SELECTED";

function titleFromRequest(request: string) {
  const compact = request.trim().replace(/\s+/g, " ");
  if (compact.length <= 72) return compact;
  return `${compact.slice(0, 69).trimEnd()}…`;
}

export function CreateFactoryMissionDialog({
  projectId,
  open,
  onOpenChange,
  experienceLevel,
  initialRequest = "",
  initialRecipeId,
  onCreated,
}: {
  projectId: Id<"projects">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  experienceLevel: FactoryExperienceLevel;
  initialRequest?: string;
  initialRecipeId?: string;
  onCreated?: (mission: Doc<"missions">) => void;
}) {
  const createDraft = useMutation(api.missions.createDraft);
  const repositories = useQuery(api.projects.listRepositories, { projectId });
  const [title, setTitle] = useState("");
  const [request, setRequest] = useState("");
  const [stopCondition, setStopCondition] = useState(
    "Stop when the approved validation contract is complete or operator intervention is required.",
  );
  const [selectedRecipeId, setSelectedRecipeId] = useState("plan-build-test");
  const [selectionTouched, setSelectionTouched] = useState(false);
  const [repositoryIntent, setRepositoryIntent] = useState("");
  const [routingIntent, setRoutingIntent] =
    useState<ModelRoutingIntent>("balanced");
  const [executionEnvironment, setExecutionEnvironment] =
    useState<ExecutionEnvironment>("POLICY_SELECTED");
  const [maxCorrectiveIterations, setMaxCorrectiveIterations] = useState(2);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const createKeyRef = useRef<string | null>(null);
  const recommendation = useMemo(
    () => recommendFactoryRecipe(request),
    [request],
  );
  const selectedRecipe =
    getFactoryRecipe(selectedRecipeId) ?? FACTORY_RECIPES[0];
  const defaultRepository =
    repositories?.find((repository) => repository.isDefault) ??
    repositories?.[0];

  useEffect(() => {
    if (!open) return;
    const nextRequest = initialRequest.trim();
    const nextRecommendation = recommendFactoryRecipe(nextRequest);
    const nextRecipeId =
      initialRecipeId ?? nextRecommendation?.recipeId ?? "plan-build-test";
    const nextRecipe = getFactoryRecipe(nextRecipeId) ?? FACTORY_RECIPES[0];
    setRequest(nextRequest);
    setTitle(titleFromRequest(nextRequest));
    setSelectedRecipeId(nextRecipe.id);
    setSelectionTouched(
      Boolean(
        initialRecipeId && initialRecipeId !== nextRecommendation?.recipeId,
      ),
    );
    setRoutingIntent(nextRecipe.modelRoutingIntent);
    setMaxCorrectiveIterations(nextRecipe.maxCorrectiveIterations);
    setError(null);
    setSaving(false);
    createKeyRef.current = null;
  }, [initialRecipeId, initialRequest, open]);

  useEffect(() => {
    if (!open || !defaultRepository?.repository) return;
    if (
      !repositoryIntent ||
      !repositories?.some(
        (repository) => repository.repository === repositoryIntent,
      )
    ) {
      setRepositoryIntent(defaultRepository.repository);
    }
  }, [defaultRepository?.repository, open, repositories, repositoryIntent]);

  useEffect(() => {
    if (!recommendation || selectionTouched) return;
    setSelectedRecipeId(recommendation.recipeId);
    const recipe = getFactoryRecipe(recommendation.recipeId);
    if (recipe) {
      setRoutingIntent(recipe.modelRoutingIntent);
      setMaxCorrectiveIterations(recipe.maxCorrectiveIterations);
    }
  }, [recommendation?.recipeId, selectionTouched]);

  function chooseRecipe(recipeId: string) {
    const recipe = getFactoryRecipe(recipeId);
    if (!recipe) return;
    setSelectionTouched(true);
    setSelectedRecipeId(recipe.id);
    setRoutingIntent(recipe.modelRoutingIntent);
    setMaxCorrectiveIterations(recipe.maxCorrectiveIterations);
  }

  async function submit() {
    if (
      !title.trim() ||
      !request.trim() ||
      !stopCondition.trim() ||
      !recommendation
    ) {
      setError(
        "Title, request, stop condition, and a valid workflow recommendation are required.",
      );
      return;
    }
    setSaving(true);
    setError(null);
    try {
      createKeyRef.current ??= `ui-mission:${crypto.randomUUID()}`;
      const metadata = factoryExperienceMetadata({
        recommendation,
        selectedRecipeId,
        routingIntent,
        repositoryIntent: repositoryIntent || undefined,
        executionEnvironment,
      });
      const result = await createDraft({
        projectId,
        title: title.trim(),
        objective: request.trim(),
        stopCondition: stopCondition.trim(),
        executionEnvironment,
        maxCorrectiveIterations,
        idempotencyKey: createKeyRef.current,
        metadata: { factoryExperience: metadata },
      });
      createKeyRef.current = null;
      onOpenChange(false);
      onCreated?.(result.mission);
    } catch (cause: unknown) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Mission could not be created.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Start governed work</DialogTitle>
          <DialogDescription>
            Describe the outcome and review the workflow Mission Control will
            compose. This creates a Mission draft; it does not dispatch,
            approve, accept, or merge work.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="factory-mission-title">Mission title</Label>
              <Input
                id="factory-mission-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Improve buyer onboarding confidence"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="factory-mission-request">
                What should Mission Control build?
              </Label>
              <Textarea
                id="factory-mission-request"
                rows={4}
                value={request}
                onChange={(event) => {
                  setRequest(event.target.value);
                  setSelectionTouched(false);
                }}
                placeholder="Describe the desired outcome, constraints, and what success looks like."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="factory-mission-repository">Repository</Label>
              <select
                id="factory-mission-repository"
                value={repositoryIntent}
                onChange={(event) => setRepositoryIntent(event.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {(repositories ?? []).map((repository) => (
                  <option
                    key={repository.repository}
                    value={repository.repository}
                  >
                    {repository.displayName} · {repository.defaultBranch}
                  </option>
                ))}
                {!repositories?.length ? (
                  <option value="">
                    Repository will be selected in Mission scope
                  </option>
                ) : null}
              </select>
              <p className="text-[11px] leading-relaxed text-ink-secondary">
                This is composition intent only. Repository ID, code scope,
                owner, and team must still be bound before Plan approval.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="factory-mission-stop">Stop condition</Label>
              <Textarea
                id="factory-mission-stop"
                rows={3}
                value={stopCondition}
                onChange={(event) => setStopCondition(event.target.value)}
              />
            </div>
          </div>

          <section
            className="rounded-xl border border-line bg-surface-2 p-4"
            aria-label="Recommended workflow"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-info-accent">
                  <Sparkles size={13} aria-hidden /> Recommended workflow
                </div>
                <h3 className="mt-1.5 text-[16px] font-semibold text-ink">
                  {recommendation
                    ? getFactoryRecipe(recommendation.recipeId)?.name
                    : "Describe the work to get a recommendation"}
                </h3>
                <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-ink-secondary">
                  {recommendation?.rationale ??
                    "Recommendations are rule-based and use no model tokens."}
                </p>
              </div>
              {recommendation ? (
                <div className="inline-flex items-center gap-1.5 rounded-md border border-ok/30 bg-ok-soft px-2.5 py-1.5 text-[11px] font-medium text-ok">
                  <CheckCircle2 size={13} /> Rule based
                </div>
              ) : null}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-[220px_minmax(0,1fr)]">
              <label
                className="text-[11.5px] font-medium text-ink-secondary"
                htmlFor="factory-recipe-choice"
              >
                Workflow recipe
                <select
                  id="factory-recipe-choice"
                  value={selectedRecipeId}
                  onChange={(event) => chooseRecipe(event.target.value)}
                  className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-ink"
                >
                  {FACTORY_RECIPES.map((recipe) => (
                    <option key={recipe.id} value={recipe.id}>
                      {recipe.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="rounded-lg border border-line bg-surface-1 p-3">
                <div className="text-[12.5px] font-medium text-ink">
                  {selectedRecipe.shortDescription}
                </div>
                <div className="mt-2 grid gap-2 text-[11px] text-ink-muted sm:grid-cols-2">
                  <span>{selectedRecipe.timeEstimate}</span>
                  <span>{selectedRecipe.costPosture}</span>
                  <span>Verification: {selectedRecipe.verificationLevel}</span>
                  <span>Human acceptance remains required</span>
                </div>
              </div>
            </div>
            {recommendation && recommendation.recipeId !== selectedRecipeId ? (
              <p className="mt-3 text-[11.5px] text-warn">
                Override recorded: Mission Control recommended{" "}
                {getFactoryRecipe(recommendation.recipeId)?.name}; you selected{" "}
                {selectedRecipe.name}. Mandatory policy requirements still
                apply.
              </p>
            ) : null}
          </section>

          {experienceLevel !== "basic" ? (
            <section
              className="rounded-xl border border-line bg-surface-1 p-4"
              aria-label="Workflow composition intent"
            >
              <div className="flex items-center gap-2">
                <GitBranch size={14} className="text-ink-muted" />
                <h3 className="text-[13px] font-semibold text-ink">
                  Workflow composition intent
                </h3>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <label
                  className="text-[11.5px] font-medium text-ink-secondary"
                  htmlFor="factory-routing-intent"
                >
                  Model routing
                  <select
                    id="factory-routing-intent"
                    value={routingIntent}
                    onChange={(event) =>
                      setRoutingIntent(event.target.value as ModelRoutingIntent)
                    }
                    className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="cheapest-capable">Cheapest capable</option>
                    <option value="balanced">Balanced</option>
                    <option value="high-confidence">High confidence</option>
                    <option value="frontier">Frontier</option>
                  </select>
                </label>
                <label
                  className="text-[11.5px] font-medium text-ink-secondary"
                  htmlFor="factory-execution-environment"
                >
                  Executor posture
                  <select
                    id="factory-execution-environment"
                    value={executionEnvironment}
                    onChange={(event) =>
                      setExecutionEnvironment(
                        event.target.value as ExecutionEnvironment,
                      )
                    }
                    className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="POLICY_SELECTED">Policy selected</option>
                    <option value="LOCAL">Local</option>
                    <option value="REMOTE">Remote sandbox</option>
                    <option value="CLOUD">Cloud</option>
                  </select>
                </label>
                <label
                  className="text-[11.5px] font-medium text-ink-secondary"
                  htmlFor="factory-retry-bound"
                >
                  Corrective iterations
                  <Input
                    id="factory-retry-bound"
                    className="mt-1.5"
                    type="number"
                    min={0}
                    max={5}
                    value={maxCorrectiveIterations}
                    onChange={(event) =>
                      setMaxCorrectiveIterations(
                        Math.max(0, Math.min(5, Number(event.target.value))),
                      )
                    }
                  />
                </label>
              </div>
              <dl className="mt-4 grid gap-3 rounded-lg border border-line bg-surface-2 p-3 text-[11.5px] sm:grid-cols-2">
                <CompositionFact
                  label="Agent roles"
                  value={
                    selectedRecipe.roles.length
                      ? selectedRecipe.roles.join(" · ")
                      : "None on a passing deterministic run"
                  }
                />
                <CompositionFact
                  label="Context"
                  value={selectedRecipe.contextStrategy}
                />
                <CompositionFact
                  label="Tests"
                  value={selectedRecipe.testStrategy}
                />
                <CompositionFact
                  label="Review"
                  value={selectedRecipe.reviewStrategy}
                />
              </dl>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {selectedRecipe.deterministicGates.map((gate) => (
                  <span
                    key={gate}
                    className="rounded-md border border-line bg-surface-2 px-2 py-1 text-[10.5px] text-ink-secondary"
                  >
                    {gate}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {experienceLevel === "advanced" && recommendation ? (
            <details className="rounded-xl border border-line bg-surface-1 p-4">
              <summary className="cursor-pointer text-[12.5px] font-medium text-ink">
                Raw composition intent
              </summary>
              <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg border border-line bg-surface-2 p-3 font-mono text-[10px] leading-relaxed text-ink-secondary">
                {JSON.stringify(
                  {
                    recipe: selectedRecipe.id,
                    workflowCandidates: selectedRecipe.workflowCandidates,
                    routingIntent,
                    executionEnvironment,
                    maxCorrectiveIterations,
                    deterministicGateIntent: selectedRecipe.deterministicGates,
                    authority:
                      "Mission -> approved Plan -> WorkOrder -> Attempt; workOrders.accept remains sole acceptance authority",
                  },
                  null,
                  2,
                )}
              </pre>
            </details>
          ) : null}

          <div
            className={cn(
              "flex items-start gap-2 rounded-lg border px-3 py-2.5 text-[11.5px] leading-relaxed",
              "border-info-accent/25 bg-info-soft/35 text-ink-secondary",
            )}
          >
            <ShieldCheck
              size={14}
              className="mt-0.5 shrink-0 text-info-accent"
              aria-hidden
            />
            <span>
              <strong className="text-ink">
                UI mode does not change governance.
              </strong>{" "}
              The active Factory Version, policy, quality contract, exact
              verification subject, and acceptance eligibility are resolved by
              the server after the Plan is approved.
            </span>
          </div>
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => void submit()}
            disabled={saving || !recommendation}
          >
            {saving ? "Creating…" : "Create Mission draft"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CompositionFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[9.5px] font-medium uppercase tracking-[0.07em] text-ink-muted">
        {label}
      </dt>
      <dd className="mt-1 text-ink-secondary">{value}</dd>
    </div>
  );
}
