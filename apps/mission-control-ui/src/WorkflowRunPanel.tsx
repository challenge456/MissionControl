/**
 * Workflow Run Panel
 *
 * Displays workflow execution progress with step-by-step status indicators.
 * Real-time updates via Convex subscriptions.
 */

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { X } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { StatusBadge, type StatusBadgeProps } from "./components/factory/badges";
import { ExecutionRunInspector } from "./controlPlane/ExecutionRunInspector";

interface WorkflowRunPanelProps {
  runId: string;
  onClose?: () => void;
}

const RUN_STATUS_TONE: Record<string, StatusBadgeProps["tone"]> = {
  PENDING: "neutral",
  RUNNING: "info",
  COMPLETED: "success",
  FAILED: "error",
  PAUSED: "warning",
};

const RUN_BAR_CLASS: Record<string, string> = {
  PENDING: "bg-ink-muted",
  RUNNING: "bg-info-accent",
  COMPLETED: "bg-ok",
  FAILED: "bg-err",
  PAUSED: "bg-warn",
};

const STEP_DOT_CLASS: Record<string, string> = {
  PENDING: "bg-ink-muted",
  RUNNING: "bg-info-accent",
  DONE: "bg-ok",
  FAILED: "bg-err",
};

const STEP_TEXT_CLASS: Record<string, string> = {
  PENDING: "text-ink-muted",
  RUNNING: "text-info-accent",
  DONE: "text-ok",
  FAILED: "text-err",
};

export function WorkflowRunPanel({ runId, onClose }: WorkflowRunPanelProps) {
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const run = useQuery(api.workflowRuns.get, { runId });
  const workflow = run ? useQuery(api.workflows.get, { workflowId: run.workflowId }) : null;

  if (!run || !workflow) {
    return (
      <div className="p-5 text-[13px] text-ink-muted">
        Loading workflow run...
      </div>
    );
  }

  return (
    <div className="fixed right-0 top-0 z-[1000] flex h-screen w-[500px] flex-col border-l border-line bg-surface-1">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line p-5">
        <div>
          <h2 className="text-[15px] font-semibold text-ink">{workflow.name}</h2>
          <div className="mt-1 font-mono text-[11.5px] text-ink-muted">Run: {run.runId}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setInspectorOpen(true)}
            className="rounded-md border border-line bg-surface-2 px-2.5 py-1.5 text-[12px] text-ink-secondary transition-colors duration-150 hover:bg-surface-3 hover:text-ink"
          >
            Inspector
          </button>
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close workflow run panel"
              className="rounded-md p-1.5 text-ink-muted transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
            >
              <X size={16} strokeWidth={1.75} />
            </button>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="border-b border-line p-5">
        <StatusBadge tone={RUN_STATUS_TONE[run.status] ?? "neutral"}>{run.status}</StatusBadge>

        <div className="mt-3 text-[13px] text-ink-secondary">
          Step {run.currentStepIndex + 1} of {run.totalSteps}
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-2">
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-200",
              RUN_BAR_CLASS[run.status] ?? "bg-ink-muted"
            )}
            style={{ width: `${((run.currentStepIndex + 1) / run.totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Initial Input */}
      <div className="border-b border-line p-5">
        <div className="mb-2 text-[11.5px] font-medium uppercase tracking-[0.06em] text-ink-muted">
          Initial input
        </div>
        <div className="max-h-[100px] overflow-auto rounded-lg bg-surface-2 p-3 text-[13px] text-ink-secondary">
          {run.initialInput}
        </div>
      </div>

      {/* Steps */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="mb-3 text-[11.5px] font-medium uppercase tracking-[0.06em] text-ink-muted">
          Workflow steps
        </div>

        {run.steps.map((step, index) => {
          const stepDef = workflow.steps[index];
          const agentDef = workflow.agents.find((a) => a.id === stepDef.agent);

          return (
            <div
              key={step.stepId}
              className={cn(
                "mb-3 rounded-lg border p-3",
                index === run.currentStepIndex
                  ? "border-line bg-surface-2"
                  : "border-transparent"
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "h-1.5 w-1.5 shrink-0 rounded-full",
                    STEP_DOT_CLASS[step.status] ?? "bg-ink-muted"
                  )}
                  aria-hidden
                />
                <span
                  className={cn(
                    "font-mono text-[13px] font-semibold",
                    STEP_TEXT_CLASS[step.status] ?? "text-ink"
                  )}
                >
                  {step.stepId}
                </span>
                <span className="text-[12px] text-ink-muted">({agentDef?.persona})</span>
              </div>

              {step.retryCount > 0 && (
                <div className="mt-1 text-[11.5px] text-warn">
                  Retry {step.retryCount}/{stepDef.retryLimit}
                </div>
              )}

              {step.error && (
                <div className="mt-1 rounded-md bg-err-soft p-1.5 text-[11.5px] text-err">
                  {step.error}
                </div>
              )}

              {step.status === "DONE" && step.output && (
                <div className="mt-1 max-h-[60px] overflow-hidden text-ellipsis text-[11.5px] text-ink-muted">
                  {step.output.substring(0, 150)}
                  {step.output.length > 150 && "..."}
                </div>
              )}

              {step.startedAt && (
                <div className="mt-1 text-[11.5px] text-ink-muted">
                  {step.completedAt
                    ? `Completed in ${Math.round((step.completedAt - step.startedAt) / 1000)}s`
                    : `Running for ${Math.round((Date.now() - step.startedAt) / 1000)}s`}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="border-t border-line p-5 text-[12px] text-ink-muted">
        {run.completedAt ? (
          <div>Completed in {Math.round((run.completedAt - run.startedAt) / 1000)}s</div>
        ) : (
          <div>Running for {Math.round((Date.now() - run.startedAt) / 1000)}s</div>
        )}
      </div>

      <ExecutionRunInspector
        open={inspectorOpen}
        workflowRunId={run._id as Id<"workflowRuns">}
        onClose={() => setInspectorOpen(false)}
      />
    </div>
  );
}
