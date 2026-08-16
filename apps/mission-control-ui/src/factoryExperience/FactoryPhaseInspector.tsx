import { Activity, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { FactoryExperienceLevel } from "./recipeCatalog";
import {
  phaseInspectorSections,
  type FactoryPhaseProjection,
} from "./phaseProjection";

export function FactoryPhaseInspector({
  phase,
  level,
}: {
  phase?: FactoryPhaseProjection;
  level: FactoryExperienceLevel;
}) {
  if (!phase) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-surface-1 p-6 text-center text-[12.5px] text-ink-muted">
        Select a recorded phase to inspect its evidence.
      </div>
    );
  }
  const sections = phaseInspectorSections(phase);
  const visible =
    level === "basic"
      ? ([
          ["Execution", sections.execution],
          ["Output", sections.output],
          ["Gates", sections.gates],
        ] as const)
      : ([
          ["Input", sections.input],
          ["Prompt", sections.prompt],
          ["Agent configuration", sections.configuration],
          ["Execution", sections.execution],
          ["Output", sections.output],
          ["Gates", sections.gates],
        ] as const);
  return (
    <section
      className="rounded-xl border border-line bg-surface-1"
      aria-labelledby="phase-inspector-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.08em] text-ink-muted">
            Phase inspector
          </div>
          <h3
            id="phase-inspector-title"
            className="mt-1 text-[14px] font-semibold text-ink"
          >
            {phase.name}
          </h3>
          <p className="mt-1 text-[11px] text-ink-muted">
            {phase.owner} · {phase.type} · {phase.status.toLowerCase()}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10.5px] font-medium ${phase.status === "FAILED" ? "border-err/30 bg-err-soft text-err" : phase.status === "RUNNING" ? "border-info-accent/30 bg-info-soft text-info-accent" : "border-ok/30 bg-ok-soft text-ok"}`}
        >
          {phase.status === "FAILED" ? (
            <AlertTriangle size={12} />
          ) : phase.status === "RUNNING" ? (
            <Activity size={12} />
          ) : (
            <CheckCircle2 size={12} />
          )}
          {phase.status}
        </span>
      </div>
      <div className="grid gap-px bg-line md:grid-cols-2">
        {visible.map(([label, values]) => (
          <InspectorSection
            key={label}
            label={label}
            values={values}
            advanced={level === "advanced"}
          />
        ))}
      </div>
      {level === "advanced" ? (
        <details className="border-t border-line p-4">
          <summary className="cursor-pointer text-[11.5px] font-medium text-ink">
            Raw observation
          </summary>
          <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-line bg-surface-2 p-3 font-mono text-[10px] leading-relaxed text-ink-secondary">
            {JSON.stringify(phase, null, 2)}
          </pre>
        </details>
      ) : null}
    </section>
  );
}

function InspectorSection({
  label,
  values,
  advanced,
}: {
  label: string;
  values: Record<string, unknown>;
  advanced: boolean;
}) {
  const entries = Object.entries(values).filter(
    ([key]) => advanced || key !== "raw",
  );
  return (
    <div className="min-w-0 bg-surface-1 p-4">
      <h4 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
        {label}
      </h4>
      <dl className="mt-3 space-y-2.5">
        {entries.map(([key, value]) => (
          <div key={key}>
            <dt className="text-[9.5px] capitalize text-ink-muted">
              {key.replace(/([A-Z])/g, " $1")}
            </dt>
            <dd className="mt-0.5 break-words text-[11px] leading-relaxed text-ink-secondary">
              {displayValue(value)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function displayValue(value: unknown): string {
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  )
    return "Not recorded";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return "Recorded value is unavailable";
  }
}
