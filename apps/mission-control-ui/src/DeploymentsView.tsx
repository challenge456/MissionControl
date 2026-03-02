/**
 * Deployments View — Environment Deployment Board
 *
 * One column per environment (dev, staging, prod). Each column shows the
 * currently ACTIVE deployment, version badge, Deploy and Rollback CTAs.
 */

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "./components/PageHeader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "./Toast";
import { cn } from "@/lib/utils";
import { Rocket, RotateCcw, Server } from "lucide-react";

function fmtTime(ts?: number) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString();
}

export function DeploymentsView({ projectId }: { projectId: Id<"projects"> | null }) {
  const { toast } = useToast();
  const [selectedTenantId, setSelectedTenantId] = useState<Id<"tenants"> | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<Id<"agentTemplates"> | null>(null);
  const [deployEnvId, setDeployEnvId] = useState<Id<"environments"> | null>(null);
  const [deployVersionId, setDeployVersionId] = useState<Id<"agentVersions"> | null>(null);
  const [rollbackDeploymentId, setRollbackDeploymentId] = useState<Id<"deployments"> | null>(null);

  const tenants = useQuery(api["registry/tenants"].listTenants, { activeOnly: false });
  const templates = useQuery(api["registry/agentTemplates"].listTemplates, {
    tenantId: selectedTenantId ?? undefined,
    projectId: projectId ?? undefined,
    activeOnly: false,
  });
  const environments = useQuery(
    api["registry/environments"].listEnvironments,
    selectedTenantId ? { tenantId: selectedTenantId } : "skip"
  );
  const versions = useQuery(
    api["registry/agentVersions"].listVersions,
    selectedTemplateId ? { templateId: selectedTemplateId } : "skip"
  );
  const deployments = useQuery(api["governance/deployments"].listDeployments, {
    tenantId: selectedTenantId ?? undefined,
    templateId: selectedTemplateId ?? undefined,
  });

  const createDeployment = useMutation(api["governance/deployments"].createDeployment);
  const activateDeployment = useMutation(api["governance/deployments"].activateDeployment);
  const rollbackDeployment = useMutation(api["governance/deployments"].rollbackDeployment);

  useEffect(() => {
    if (!selectedTenantId && tenants?.length) setSelectedTenantId(tenants[0]._id);
  }, [selectedTenantId, tenants]);

  useEffect(() => {
    if (!selectedTemplateId && templates?.length) setSelectedTemplateId(templates[0]._id);
  }, [selectedTemplateId, templates]);

  const versionMap = useMemo(() => {
    const map = new Map<Id<"agentVersions">, { version: number; status: string }>();
    for (const v of versions ?? []) map.set(v._id, { version: v.version, status: v.status });
    return map;
  }, [versions]);

  const activeByEnv = useMemo(() => {
    const map = new Map<Id<"environments">, typeof deployments[0]>();
    for (const d of deployments ?? []) {
      if (d.status === "ACTIVE") map.set(d.environmentId, d);
    }
    return map;
  }, [deployments]);

  const pendingByEnv = useMemo(() => {
    const map = new Map<Id<"environments">, (typeof deployments)[0][]>();
    for (const d of deployments ?? []) {
      if (d.status === "PENDING") {
        const list = map.get(d.environmentId) ?? [];
        list.push(d);
        map.set(d.environmentId, list);
      }
    }
    return map;
  }, [deployments]);

  const handleDeploy = async () => {
    if (!selectedTemplateId || !deployEnvId || !deployVersionId) {
      toast("Select environment and version.", true);
      return;
    }
    try {
      const active = activeByEnv.get(deployEnvId);
      const dep = await createDeployment({
        tenantId: selectedTenantId ?? undefined,
        templateId: selectedTemplateId,
        environmentId: deployEnvId,
        targetVersionId: deployVersionId,
        previousVersionId: active?.targetVersionId ?? undefined,
        metadata: { source: "deployments.ui" },
      });
      await activateDeployment({ deploymentId: dep._id });
      toast("Deployed and activated.");
      setDeployEnvId(null);
      setDeployVersionId(null);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Deploy failed", true);
    }
  };

  const handleRollback = async () => {
    if (!rollbackDeploymentId) return;
    try {
      await rollbackDeployment({ deploymentId: rollbackDeploymentId });
      toast("Rollback created.");
      setRollbackDeploymentId(null);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Rollback failed", true);
    }
  };

  return (
    <main className="flex-1 overflow-auto">
      <PageHeader
        title="Deployments"
        description="Promote approved versions through environments. Activate and rollback from the board."
      />

      <div className="px-6 pb-4 flex flex-wrap items-center gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tenant</span>
        <select
          value={selectedTenantId ?? ""}
          onChange={(e) => setSelectedTenantId((e.target.value || null) as Id<"tenants"> | null)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
        >
          <option value="">Select tenant</option>
          {(tenants ?? []).map((t) => (
            <option key={t._id} value={t._id}>{t.name}</option>
          ))}
        </select>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground ml-2">Template</span>
        <select
          value={selectedTemplateId ?? ""}
          onChange={(e) => setSelectedTemplateId((e.target.value || null) as Id<"agentTemplates"> | null)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
        >
          <option value="">Select template</option>
          {(templates ?? []).map((t) => (
            <option key={t._id} value={t._id}>{t.name}</option>
          ))}
        </select>
      </div>

      {!selectedTemplateId ? (
        <div className="px-6 pb-6 text-center py-12 text-muted-foreground text-sm">
          Select a tenant and template to view the deployment board.
        </div>
      ) : (
        <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(environments ?? []).map((env) => {
            const active = activeByEnv.get(env._id);
            const pendingList = pendingByEnv.get(env._id) ?? [];
            const targetVersion = active ? versionMap.get(active.targetVersionId) : null;
            const previousVersion = active?.previousVersionId ? versionMap.get(active.previousVersionId) : null;

            return (
              <Card key={env._id} className="p-4 flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold text-foreground uppercase tracking-wider">{env.name}</span>
                  <span className="text-[10px] text-muted-foreground">({env.type})</span>
                </div>

                {active ? (
                  <>
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-bold text-foreground">v{targetVersion?.version ?? "?"}</span>
                        <span className="rounded border border-primary/30 bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary/70 dark:text-primary">
                          ACTIVE
                        </span>
                      </div>
                      {previousVersion && (
                        <div className="text-[10px] text-muted-foreground">was v{previousVersion.version}</div>
                      )}
                      <div className="text-[10px] text-muted-foreground/70 mt-1">
                        Activated {fmtTime(active.activatedAt)}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                      disabled={!active.previousVersionId}
                      onClick={() => setRollbackDeploymentId(active._id)}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Rollback
                    </Button>
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3 mb-3 text-center text-sm text-muted-foreground">
                    No active deployment
                  </div>
                )}

                {pendingList.length > 0 && (
                  <div className="text-[10px] text-muted-foreground mb-2">
                    {pendingList.length} pending
                  </div>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs mt-auto"
                  onClick={() => setDeployEnvId(env._id)}
                >
                  <Rocket className="h-3 w-3 mr-1" />
                  Deploy
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {(environments ?? []).length === 0 && selectedTenantId && (
        <div className="px-6 pb-6 text-center py-12 text-muted-foreground text-sm">
          No environments for this tenant.
        </div>
      )}

      {/* Deploy modal */}
      <Dialog open={!!deployEnvId} onOpenChange={(open) => !open && setDeployEnvId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deploy version</DialogTitle>
            <DialogDescription>
              Select a version to deploy to this environment. It will be activated immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="block text-sm font-medium mb-2">Version</label>
            <select
              value={deployVersionId ?? ""}
              onChange={(e) => setDeployVersionId((e.target.value || null) as Id<"agentVersions"> | null)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select version</option>
              {(versions ?? []).map((v) => (
                <option key={v._id} value={v._id}>v{v.version} ({v.status})</option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeployEnvId(null)}>Cancel</Button>
            <Button onClick={handleDeploy} disabled={!deployVersionId}>Deploy</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rollback confirmation */}
      <Dialog open={!!rollbackDeploymentId} onOpenChange={(open) => !open && setRollbackDeploymentId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rollback deployment?</DialogTitle>
            <DialogDescription>
              This will create a rollback to the previous version. The current deployment will be retired.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRollbackDeploymentId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRollback}>Rollback</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
