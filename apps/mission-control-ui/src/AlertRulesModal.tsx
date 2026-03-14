import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bell, Trash2 } from "lucide-react";

interface AlertRulesModalProps {
  projectId: Id<"projects"> | null;
  onClose: () => void;
}

export function AlertRulesModal({ projectId, onClose }: AlertRulesModalProps) {
  const rules = useQuery(api.alertRules.list, { projectId: projectId ?? undefined });
  const createRule = useMutation(api.alertRules.create);
  const updateRule = useMutation(api.alertRules.update);
  const removeRule = useMutation(api.alertRules.remove);

  const [threshold, setThreshold] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    const value = Number(threshold);
    if (!Number.isFinite(value) || value <= 0) return;
    setAdding(true);
    try {
      await createRule({
        projectId: projectId ?? undefined,
        type: "daily_cost_exceeded",
        threshold: value,
        enabled: true,
      });
      setThreshold("");
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alert rules
          </DialogTitle>
          <DialogDescription>
            Get notified when daily API cost exceeds a threshold. Rules are evaluated hourly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="threshold" className="text-xs text-muted-foreground">
                Notify if daily cost exceeds ($)
              </Label>
              <Input
                id="threshold"
                type="number"
                min={0}
                step={1}
                placeholder="e.g. 50"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                className="mt-1"
              />
            </div>
            <Button
              type="button"
              size="sm"
              className="mt-6"
              disabled={adding || !threshold || Number(threshold) <= 0}
              onClick={handleAdd}
            >
              Add
            </Button>
          </div>

          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">Active rules</div>
            {rules === undefined ? (
              <div className="text-xs text-muted-foreground">Loading…</div>
            ) : rules.length === 0 ? (
              <div className="text-xs text-muted-foreground rounded-lg border border-dashed border-border p-4 text-center">
                No alert rules. Add one above.
              </div>
            ) : (
              <ul className="space-y-2">
                {rules.map((rule) => (
                  <li
                    key={rule._id}
                    className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm"
                  >
                    <span>
                      Daily cost &gt; ${rule.threshold.toFixed(0)}
                      {rule.projectId ? " (this project)" : " (all)"}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() =>
                          updateRule({ id: rule._id, enabled: !rule.enabled })
                        }
                      >
                        {rule.enabled ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-destructive hover:text-destructive"
                        onClick={() => removeRule({ id: rule._id })}
                        aria-label="Delete rule"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
