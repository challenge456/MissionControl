import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useMutation } from "convex/react";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { api } from "../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  draftsEqual,
  missionDraftPayload,
  missionToDraftValues,
  SOURCE_KINDS,
  validateMissionDraft,
  type MissionDraftErrors,
  type MissionDraftValues,
} from "../missionDraftModel";

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? <p id={id} role="alert" className="text-xs text-destructive">{message}</p> : null;
}

export function MissionDraftForm({
  mission,
  projectId,
  onDirtyChange,
}: {
  mission: any;
  projectId: Id<"projects">;
  onDirtyChange?: (dirty: boolean) => void;
}): JSX.Element {
  const updateDraft = useMutation(api.missions.updateDraft);
  const formId = useId();
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const saveKeyRef = useRef<string | null>(null);
  const initial = useMemo(() => missionToDraftValues(mission), [mission]);
  const [baseline, setBaseline] = useState<MissionDraftValues>(initial);
  const [values, setValues] = useState<MissionDraftValues>(initial);
  const [errors, setErrors] = useState<MissionDraftErrors>({});
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const dirty = !draftsEqual(values, baseline);
  const editable = mission.state === "DRAFT";

  useEffect(() => {
    if (!dirty) {
      setBaseline(initial);
      setValues(initial);
    }
  }, [dirty, initial]);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const setField = <K extends keyof MissionDraftValues>(
    field: K,
    value: MissionDraftValues[K]
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setStatus("idle");
    setSaveError(null);
  };

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!dirty || status === "saving") return;
    const nextErrors = validateMissionDraft(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStatus("error");
      requestAnimationFrame(() => {
        const firstField = Object.keys(nextErrors)[0];
        document.getElementById(`${formId}-${firstField}`)?.focus();
      });
      return;
    }

    setStatus("saving");
    setSaveError(null);
    saveKeyRef.current ??= `ui-mission-draft:${crypto.randomUUID()}`;
    try {
      const result = await updateDraft({
        missionId: mission._id,
        projectId,
        idempotencyKey: saveKeyRef.current,
        ...missionDraftPayload(values),
      });
      const persisted = missionToDraftValues(result.mission);
      setValues(persisted);
      setBaseline(persisted);
      setStatus("saved");
      saveKeyRef.current = null;
      requestAnimationFrame(() => saveButtonRef.current?.focus());
    } catch (cause: any) {
      setSaveError(cause.message ?? "Mission draft could not be saved.");
      setStatus("error");
    }
  }

  if (!editable) {
    return (
      <section className="rounded-xl border border-line bg-surface-1 p-4">
        <h2 className="text-[13px] font-semibold text-ink">Draft details</h2>
        <p className="mt-2 text-[13px] text-ink-secondary">
          Draft editing is locked because this Mission is {mission.state.replace(/_/g, " ").toLowerCase()}.
        </p>
      </section>
    );
  }

  return (
    <form onSubmit={save} noValidate className="space-y-6" aria-label="Mission draft">
      <section className="space-y-4 rounded-xl border border-line bg-surface-1 p-4">
        <div>
          <h2 className="text-[13px] font-semibold text-ink">Draft definition</h2>
          <p className="mt-1 text-[12px] text-ink-muted">Define the governed outcome before planning begins.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${formId}-title`}>Title</Label>
          <Input id={`${formId}-title`} value={values.title} onChange={(event) => setField("title", event.target.value)} aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? `${formId}-title-error` : undefined} />
          <FieldError id={`${formId}-title-error`} message={errors.title} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${formId}-objective`}>Objective</Label>
          <Textarea id={`${formId}-objective`} value={values.objective} onChange={(event) => setField("objective", event.target.value)} aria-invalid={Boolean(errors.objective)} aria-describedby={errors.objective ? `${formId}-objective-error` : undefined} />
          <FieldError id={`${formId}-objective-error`} message={errors.objective} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${formId}-context`}>Context</Label>
          <Textarea id={`${formId}-context`} value={values.context} onChange={(event) => setField("context", event.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${formId}-owner`}>Owner</Label>
          <Input id={`${formId}-owner`} value={values.owner} onChange={(event) => setField("owner", event.target.value)} placeholder="Optional accountable owner" />
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-line bg-surface-1 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[13px] font-semibold text-ink">Constraints</h2>
            <p className="mt-1 text-[12px] text-ink-muted">Boundaries the plan must respect.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setField("constraints", [...values.constraints, ""])}>Add constraint</Button>
        </div>
        {values.constraints.map((constraint, index) => (
          <div key={index} className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <Label className="sr-only" htmlFor={`${formId}-constraints-${index}`}>Constraint {index + 1}</Label>
              <Input id={`${formId}-constraints-${index}`} value={constraint} onChange={(event) => {
                const next = [...values.constraints];
                next[index] = event.target.value;
                setField("constraints", next);
              }} />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setField("constraints", values.constraints.filter((_, itemIndex) => itemIndex !== index))}>Remove</Button>
          </div>
        ))}
        <FieldError id={`${formId}-constraints-error`} message={errors.constraints} />
      </section>

      <section className="space-y-4 rounded-xl border border-line bg-surface-1 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[13px] font-semibold text-ink">Sources of truth</h2>
            <p className="mt-1 text-[12px] text-ink-muted">Repository, document, issue, or URL references used during planning.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setField("sourceOfTruthRefs", [...values.sourceOfTruthRefs, { kind: "DOC", label: "", location: "" }])}>Add source</Button>
        </div>
        {values.sourceOfTruthRefs.map((source, index) => (
          <div key={index} className="grid gap-2 rounded-lg border border-line p-3 sm:grid-cols-[120px_1fr_1.4fr_auto]">
            <div>
              <Label className="sr-only" htmlFor={`${formId}-source-kind-${index}`}>Source {index + 1} kind</Label>
              <select id={`${formId}-source-kind-${index}`} value={source.kind} onChange={(event) => {
                const next = [...values.sourceOfTruthRefs];
                next[index] = { ...source, kind: event.target.value as typeof source.kind };
                setField("sourceOfTruthRefs", next);
              }} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                {SOURCE_KINDS.map((kind) => <option key={kind} value={kind}>{kind}</option>)}
              </select>
            </div>
            <div>
              <Label className="sr-only" htmlFor={`${formId}-source-label-${index}`}>Source {index + 1} label</Label>
              <Input id={`${formId}-source-label-${index}`} value={source.label} placeholder="Label" onChange={(event) => {
                const next = [...values.sourceOfTruthRefs];
                next[index] = { ...source, label: event.target.value };
                setField("sourceOfTruthRefs", next);
              }} />
            </div>
            <div>
              <Label className="sr-only" htmlFor={`${formId}-source-location-${index}`}>Source {index + 1} location</Label>
              <Input id={`${formId}-source-location-${index}`} value={source.location} placeholder="Path or URL" onChange={(event) => {
                const next = [...values.sourceOfTruthRefs];
                next[index] = { ...source, location: event.target.value };
                setField("sourceOfTruthRefs", next);
              }} />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setField("sourceOfTruthRefs", values.sourceOfTruthRefs.filter((_, itemIndex) => itemIndex !== index))}>Remove</Button>
          </div>
        ))}
        <FieldError id={`${formId}-sourceOfTruthRefs-error`} message={errors.sourceOfTruthRefs} />
      </section>

      <section className="space-y-4 rounded-xl border border-line bg-surface-1 p-4">
        <h2 className="text-[13px] font-semibold text-ink">Guardrails</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor={`${formId}-budgetUsd`}>Budget (USD)</Label>
            <Input id={`${formId}-budgetUsd`} type="number" min="0" step="0.01" value={values.budgetUsd} onChange={(event) => setField("budgetUsd", event.target.value)} aria-invalid={Boolean(errors.budgetUsd)} aria-describedby={errors.budgetUsd ? `${formId}-budgetUsd-error` : undefined} />
            <FieldError id={`${formId}-budgetUsd-error`} message={errors.budgetUsd} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${formId}-maxReadOnlyConcurrency`}>Read-only concurrency</Label>
            <Input id={`${formId}-maxReadOnlyConcurrency`} type="number" min="1" step="1" value={values.maxReadOnlyConcurrency} onChange={(event) => setField("maxReadOnlyConcurrency", event.target.value)} aria-invalid={Boolean(errors.maxReadOnlyConcurrency)} aria-describedby={errors.maxReadOnlyConcurrency ? `${formId}-maxReadOnlyConcurrency-error` : undefined} />
            <FieldError id={`${formId}-maxReadOnlyConcurrency-error`} message={errors.maxReadOnlyConcurrency} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${formId}-maxCorrectiveIterations`}>Corrective iterations</Label>
            <Input id={`${formId}-maxCorrectiveIterations`} type="number" min="0" step="1" value={values.maxCorrectiveIterations} onChange={(event) => setField("maxCorrectiveIterations", event.target.value)} aria-invalid={Boolean(errors.maxCorrectiveIterations)} aria-describedby={errors.maxCorrectiveIterations ? `${formId}-maxCorrectiveIterations-error` : undefined} />
            <FieldError id={`${formId}-maxCorrectiveIterations-error`} message={errors.maxCorrectiveIterations} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${formId}-stopCondition`}>Stop condition</Label>
          <Textarea id={`${formId}-stopCondition`} value={values.stopCondition} onChange={(event) => setField("stopCondition", event.target.value)} aria-invalid={Boolean(errors.stopCondition)} aria-describedby={errors.stopCondition ? `${formId}-stopCondition-error` : undefined} />
          <FieldError id={`${formId}-stopCondition-error`} message={errors.stopCondition} />
        </div>
      </section>

      <div className="sticky bottom-0 flex items-center justify-between gap-4 border-t border-line bg-app/95 py-3 backdrop-blur">
        <div role="status" aria-live="polite" className="text-[12.5px] text-ink-secondary">
          {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : dirty ? "Unsaved changes" : "No unsaved changes"}
          {saveError ? <span className="ml-2 text-destructive">— {saveError}</span> : null}
        </div>
        <Button ref={saveButtonRef} type="submit" disabled={!dirty || status === "saving"}>
          {status === "saving" ? "Saving…" : "Save draft"}
        </Button>
      </div>
    </form>
  );
}
