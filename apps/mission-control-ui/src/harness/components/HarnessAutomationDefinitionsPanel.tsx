import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { LockKeyhole, ReceiptText } from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

export function HarnessAutomationDefinitionsPanel({
  projectId,
}: {
  projectId?: Id<"projects"> | null;
}): JSX.Element | null {
  const [pendingActivationId, setPendingActivationId] = useState<string | null>(null);
  const definitions = useQuery(api.factory.automationDefinitions.list, {
    projectId: projectId ?? undefined,
  });
  const setEnabled = useMutation(api.factory.automationDefinitions.setEnabled);

  if (!definitions || definitions.length === 0) return null;

  return (
    <section className="rounded-xl border border-line bg-surface-1 p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg border border-line bg-surface-2 p-2 text-ink-muted">
          <LockKeyhole className="h-4 w-4" aria-hidden />
        </div>
        <div>
          <h2 className="text-[15px] font-semibold text-ink">Approved automation definitions</h2>
          <p className="mt-0.5 text-[13px] text-ink-secondary">
            Accepted proposals become disabled contracts until a separate activation decision.
          </p>
        </div>
      </div>
      <ul className="mt-4 divide-y divide-line rounded-lg border border-line">
        {definitions.map((definition) => (
          <li key={definition._id} className="flex flex-wrap items-center justify-between gap-3 px-3 py-3">
            <div>
              <div className="text-sm font-medium text-ink">{definition.name}</div>
              <div className="mt-1 text-xs text-ink-muted">{definition.sourcePattern} · {definition.schedule}</div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
              <span className="rounded-full border border-line px-2 py-0.5">
                {definition.enabled ? "Active review loop" : "Disabled"}
              </span>
              <span className="flex items-center gap-1"><ReceiptText className="h-3.5 w-3.5" /> Receipt required</span>
              {definition.enabled ? (
                <button
                  type="button"
                  onClick={() => void setEnabled({ definitionId: definition._id, enabled: false, actorId: "harness-ui" })}
                  className="font-medium text-warn underline-offset-2 hover:underline"
                >
                  Disable
                </button>
              ) : pendingActivationId === definition._id ? (
                <>
                  <button
                    type="button"
                    onClick={() => void setEnabled({ definitionId: definition._id, enabled: true, actorId: "harness-ui" }).then(() => setPendingActivationId(null))}
                    className="font-medium text-registry-accent underline-offset-2 hover:underline"
                  >
                    Confirm activation
                  </button>
                  <button type="button" onClick={() => setPendingActivationId(null)} className="hover:text-ink">
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setPendingActivationId(definition._id)}
                  className="font-medium text-registry-accent underline-offset-2 hover:underline"
                >
                  Activate review loop
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
