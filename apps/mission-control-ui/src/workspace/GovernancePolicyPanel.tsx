import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Loader2, ShieldCheck } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/factory/badges";

export function GovernancePolicyPanel({ projectId }: { projectId: Id<"projects"> }) {
  const activePolicy = useQuery(api.governancePolicies.getActiveForProject, { projectId });
  const activateVerificationFirstV1 = useMutation(api.governancePolicies.activateVerificationFirstV1);
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const activate = async () => {
    setState("submitting");
    setMessage("");
    try {
      const result = await activateVerificationFirstV1({ projectId, requestedBy: "operator" });
      setState("success");
      setMessage(result.created ? "Verification-First V1 governance is active." : "Verification-First V1 governance was already active.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "The governance policy could not be activated.");
    }
  };

  return (
    <div className="mt-5 border-t border-line pt-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[12.5px] font-medium text-ink-secondary">
            <ShieldCheck size={14} aria-hidden /> Governance policy
          </div>
          <div className="mt-1 text-[12px] leading-relaxed text-ink-muted">
            Bind approval validity, evidence freshness, and mandatory reverification to this workspace before dispatch.
          </div>
        </div>
        <StatusBadge tone={activePolicy ? "success" : "warning"}>
          {activePolicy?.name ?? "Not configured"}
        </StatusBadge>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={activate} disabled={state === "submitting"}>
          {state === "submitting" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
          Activate Verification-First V1
        </Button>
        <span className="text-[11.5px] text-ink-muted">Material changes revoke approvals and stale affected evidence.</span>
      </div>
      {message ? (
        <div role={state === "error" ? "alert" : "status"} className={`mt-3 rounded-lg border px-3 py-2 text-[12px] ${state === "error" ? "border-danger/30 bg-danger/10 text-danger" : "border-success/30 bg-success/10 text-success"}`}>
          {message}
        </div>
      ) : null}
    </div>
  );
}
