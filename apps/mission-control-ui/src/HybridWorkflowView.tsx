import { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";

interface HybridWorkflowViewProps {
  projectId: Id<"projects"> | null;
}

export function HybridWorkflowView({ projectId }: HybridWorkflowViewProps) {
  const [name, setName] = useState("Checkout E2E Workflow");
  const [apiStepsText, setApiStepsText] = useState('[{"title":"Create cart"},{"title":"Create session"}]');
  const [uiStepsText, setUiStepsText] = useState('["await page.goto(\\"/checkout\\")","await page.click(\\"#submit\\")"]');

  const list = useQuery((api as any).hybridWorkflows.list, { projectId: projectId ?? undefined, limit: 30 });
  const create = useMutation((api as any).hybridWorkflows.create);
  const execute = useAction((api as any).hybridWorkflows.execute);

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-6 py-6">
      <header>
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-ink">Hybrid Workflows</h1>
        <p className="mt-1.5 text-[14px] text-ink-secondary">Build and execute combined API setup + UI validation flows.</p>
      </header>

      <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface-1 p-5">
        <input
          className="h-9 w-full rounded-lg border border-line bg-surface-1 px-3 text-[13.5px] text-ink placeholder:text-ink-muted"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Workflow name"
        />
        <textarea
          className="min-h-[90px] w-full rounded-lg border border-line bg-surface-1 px-3 py-2 font-mono text-[12px] text-ink placeholder:text-ink-muted"
          value={apiStepsText}
          onChange={(e) => setApiStepsText(e.target.value)}
        />
        <textarea
          className="min-h-[90px] w-full rounded-lg border border-line bg-surface-1 px-3 py-2 font-mono text-[12px] text-ink placeholder:text-ink-muted"
          value={uiStepsText}
          onChange={(e) => setUiStepsText(e.target.value)}
        />
        <Button
          className="self-start"
          onClick={() =>
            create({
              projectId: projectId ?? undefined,
              name,
              description: "Generated from Mission Control UI",
              apiSetupSteps: JSON.parse(apiStepsText),
              uiValidationSteps: JSON.parse(uiStepsText),
              executionMode: "hybrid",
              stopOnFailure: true,
              timeoutSeconds: 300,
              retryEnabled: true,
              createdBy: "operator",
            })
          }
        >
          Create Workflow
        </Button>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface-1 p-5">
        <h2 className="text-[15px] font-semibold text-ink">Workflows</h2>
        <div className="flex flex-col gap-2">
          {(list ?? []).map((row: any) => (
            <div
              key={row._id}
              className="flex items-center justify-between rounded-lg border border-line px-3 py-2 transition-colors duration-150 hover:bg-surface-2"
            >
              <div className="min-w-0">
                <div className="text-[13.5px] font-medium text-ink">{row.name}</div>
                <div className="text-[12.5px] text-ink-muted">
                  API {row.apiSetupSteps.length} · UI {row.uiValidationSteps.length} · {row.active ? "active" : "inactive"}
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => execute({ id: row._id, executedBy: "operator" })}>
                Execute
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
