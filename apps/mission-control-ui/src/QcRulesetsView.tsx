/**
 * QC Rulesets View
 *
 * Ruleset table, create/edit form, seed defaults button.
 */

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/factory/badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Loader2, Database } from "lucide-react";

const PRESETS = [
  { value: "PRE_RELEASE", label: "Pre-Release" },
  { value: "POST_MERGE", label: "Post-Merge" },
  { value: "WEEKLY_HEALTH", label: "Weekly Health" },
  { value: "SECURITY_FOCUS", label: "Security Focus" },
  { value: "CUSTOM", label: "Custom" },
] as const;

const DEFAULT_COVERAGE = { unit: 70, integration: 50, e2e: 30 };
const DEFAULT_GATE = { name: "Default gate", condition: "requiredDocs", severity: "YELLOW" };

interface QcRulesetsViewProps {
  projectId: Id<"projects"> | null;
}

export function QcRulesetsView({ projectId }: QcRulesetsViewProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [preset, setPreset] = useState<string>("CUSTOM");
  const [unit, setUnit] = useState(DEFAULT_COVERAGE.unit);
  const [integration, setIntegration] = useState(DEFAULT_COVERAGE.integration);
  const [e2e, setE2e] = useState(DEFAULT_COVERAGE.e2e);
  const [securityPathsStr, setSecurityPathsStr] = useState("auth/**\nsecurity/**");
  const [gates, setGates] = useState<{ name: string; condition: string; severity: string }[]>([
    { ...DEFAULT_GATE },
  ]);
  const [loading, setLoading] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);

  const rulesets = useQuery(api.qcRulesets.list, { projectId: projectId ?? undefined });
  const createRuleset = useMutation(api.qcRulesets.create);
  const updateRuleset = useMutation(api.qcRulesets.update);
  const removeRuleset = useMutation(api.qcRulesets.remove);
  const seedDefaults = useMutation(api.qcRulesets.seedDefaults);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createRuleset({
        projectId: projectId ?? undefined,
        name: name || "New ruleset",
        description: description || undefined,
        preset: preset as "PRE_RELEASE" | "POST_MERGE" | "WEEKLY_HEALTH" | "SECURITY_FOCUS" | "CUSTOM",
        requiredDocs: ["README.md"],
        coverageThresholds: { unit, integration, e2e },
        securityPaths: securityPathsStr.trim() ? securityPathsStr.trim().split(/\n/).map((s) => s.trim()).filter(Boolean) : [],
        gateDefinitions: gates,
      });
      setCreateOpen(false);
      setName("");
      setDescription("");
      setPreset("CUSTOM");
      setUnit(DEFAULT_COVERAGE.unit);
      setIntegration(DEFAULT_COVERAGE.integration);
      setE2e(DEFAULT_COVERAGE.e2e);
      setSecurityPathsStr("auth/**\nsecurity/**");
      setGates([{ ...DEFAULT_GATE }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDefaults = async () => {
    setSeedLoading(true);
    try {
      await seedDefaults({});
    } finally {
      setSeedLoading(false);
    }
  };

  const handleRemove = async (id: Id<"qcRulesets">) => {
    if (!confirm("Delete this ruleset?")) return;
    await removeRuleset({ id });
  };

  const addGate = () => {
    setGates((prev) => [...prev, { name: "", condition: "requiredDocs", severity: "YELLOW" }]);
  };
  const removeGate = (i: number) => {
    setGates((prev) => prev.filter((_, idx) => idx !== i));
  };
  const updateGate = (i: number, field: "name" | "condition" | "severity", value: string) => {
    setGates((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-6 py-6">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-ink">
            Rulesets
          </h1>
          <p className="mt-1.5 text-[14px] text-ink-secondary">
            Manage QC rulesets and presets
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSeedDefaults} disabled={seedLoading}>
            {seedLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
            <span className="ml-2">Seed defaults</span>
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            <span className="ml-2">Create ruleset</span>
          </Button>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Preset</TableHead>
              <TableHead>Coverage (U / I / E)</TableHead>
              <TableHead>Gates</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!rulesets ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-ink-muted">
                  Loading…
                </TableCell>
              </TableRow>
            ) : rulesets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-ink-muted">
                  No rulesets. Seed defaults or create one.
                </TableCell>
              </TableRow>
            ) : (
              rulesets.map((r) => (
                <TableRow key={r._id}>
                  <TableCell className="font-medium text-ink">{r.name}</TableCell>
                  <TableCell>
                    <StatusBadge tone="neutral">{r.preset ?? "CUSTOM"}</StatusBadge>
                  </TableCell>
                  <TableCell className="text-[13px] text-ink-secondary">
                    {r.coverageThresholds.unit}% / {r.coverageThresholds.integration}% /{" "}
                    {r.coverageThresholds.e2e}%
                  </TableCell>
                  <TableCell className="text-[13px] text-ink-secondary">{r.gateDefinitions.length}</TableCell>
                  <TableCell>
                    <StatusBadge tone={r.active ? "success" : "neutral"}>
                      {r.active ? "Active" : "Inactive"}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>
                    {!r.isBuiltIn && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-err"
                        aria-label="Delete ruleset"
                        onClick={() => handleRemove(r._id)}
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create ruleset</DialogTitle>
            <DialogDescription>
              Define name, preset, coverage thresholds, and gate definitions.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My ruleset" />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description"
              />
            </div>
            <div className="space-y-2">
              <Label>Preset</Label>
              <Select value={preset} onValueChange={setPreset}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRESETS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Coverage thresholds (%)</Label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Unit</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={unit}
                    onChange={(e) => setUnit(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Integration</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={integration}
                    onChange={(e) => setIntegration(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label className="text-xs">E2E</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={e2e}
                    onChange={(e) => setE2e(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Security paths (one per line)</Label>
              <textarea
                className="min-h-[80px] w-full rounded-lg border border-line bg-surface-1 px-3 py-2 font-mono text-[12.5px] text-ink placeholder:text-ink-muted"
                value={securityPathsStr}
                onChange={(e) => setSecurityPathsStr(e.target.value)}
                placeholder="auth/**"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Gate definitions</Label>
                <Button type="button" variant="outline" size="sm" onClick={addGate}>
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                {gates.map((g, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input
                      placeholder="Gate name"
                      value={g.name}
                      onChange={(e) => updateGate(i, "name", e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Condition"
                      value={g.condition}
                      onChange={(e) => updateGate(i, "condition", e.target.value)}
                      className="w-28"
                    />
                    <Select value={g.severity} onValueChange={(v) => updateGate(i, "severity", v)}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RED">RED</SelectItem>
                        <SelectItem value="YELLOW">YELLOW</SelectItem>
                        <SelectItem value="GREEN">GREEN</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeGate(i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
