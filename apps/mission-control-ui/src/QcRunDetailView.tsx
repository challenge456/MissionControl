/**
 * QC Run Detail View
 *
 * Detailed view of a single QC run with findings, artifacts, and evidence.
 */

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RiskBadge, StatusBadge } from "@/components/factory/badges";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Download,
  ArrowLeft,
  Clock,
  GitBranch,
  GitCommit,
} from "lucide-react";

interface QcRunDetailViewProps {
  runId: Id<"qcRuns">;
  onBack?: () => void;
}

function RiskGradeBadge({ grade }: { grade: "GREEN" | "YELLOW" | "RED" | undefined }) {
  if (!grade) return <StatusBadge tone="neutral">N/A</StatusBadge>;
  return <RiskBadge level={grade} className="font-mono" />;
}

const SEVERITY_TONE = {
  RED: "error",
  YELLOW: "warning",
  GREEN: "success",
  INFO: "info",
} as const;

function SeverityBadge({ severity }: { severity: "RED" | "YELLOW" | "GREEN" | "INFO" }) {
  return <StatusBadge tone={SEVERITY_TONE[severity]}>{severity}</StatusBadge>;
}

export function QcRunDetailView({ runId, onBack }: QcRunDetailViewProps) {
  const run = useQuery(api.qcRuns.get, { id: runId });
  const findings = useQuery(api.qcFindings.listByRun, { qcRunId: runId });
  const artifacts = useQuery(api.qcArtifacts.listByRun, { qcRunId: runId });

  if (!run || !findings || !artifacts) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-[13.5px] text-ink-muted">Loading run details...</div>
      </div>
    );
  }

  const findingsByCategory = findings.reduce((acc, f) => {
    if (!acc[f.category]) acc[f.category] = [];
    acc[f.category].push(f);
    return acc;
  }, {} as Record<string, typeof findings>);

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack} aria-label="Back">
              <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
            </Button>
          )}
          <div>
            <h1 className="font-mono text-[26px] font-semibold leading-tight tracking-tight text-ink">
              {run.runId}
            </h1>
            <div className="mt-1.5 flex items-center gap-2 text-[13px] text-ink-secondary">
              <GitBranch className="h-3.5 w-3.5" strokeWidth={1.75} />
              {run.branch ?? "main"}
              <span className="text-ink-muted">·</span>
              <GitCommit className="h-3.5 w-3.5" strokeWidth={1.75} />
              <span className="font-mono">{run.commitSha?.substring(0, 7)}</span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <RiskGradeBadge grade={run.riskGrade} />
          {run.qualityScore !== undefined && (
            <StatusBadge tone="neutral" className="font-mono">
              Score: {run.qualityScore}
            </StatusBadge>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="text-[12.5px] font-medium text-ink-secondary">Status</div>
          <div className="mt-2 text-[17px] font-semibold text-ink">{run.status}</div>
          {run.durationMs && (
            <div className="mt-1 flex items-center gap-1 text-[12px] text-ink-muted">
              <Clock className="h-3 w-3" strokeWidth={1.75} />
              {Math.round(run.durationMs / 1000)}s
            </div>
          )}
        </Card>

        <Card className="p-4">
          <div className="text-[12.5px] font-medium text-ink-secondary">Findings</div>
          <div className="mt-2 flex items-center gap-2 font-mono text-[15px]">
            {run.findingCounts ? (
              <>
                <span className="font-medium text-err">{run.findingCounts.red}</span>
                <span className="font-medium text-warn">{run.findingCounts.yellow}</span>
                <span className="font-medium text-ok">{run.findingCounts.green}</span>
                <span className="font-medium text-info-accent">{run.findingCounts.info}</span>
              </>
            ) : (
              <span className="text-[17px] font-semibold text-ink">--</span>
            )}
          </div>
          <div className="mt-1 text-[12px] text-ink-muted">
            RED / YELLOW / GREEN / INFO
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-[12.5px] font-medium text-ink-secondary">Gate Status</div>
          <div className="mt-2 flex items-center gap-2">
            {run.gatePassed === true && (
              <>
                <CheckCircle2 className="h-4 w-4 text-ok" strokeWidth={1.75} />
                <span className="text-[17px] font-semibold text-ok">PASSED</span>
              </>
            )}
            {run.gatePassed === false && (
              <>
                <AlertTriangle className="h-4 w-4 text-err" strokeWidth={1.75} />
                <span className="text-[17px] font-semibold text-err">FAILED</span>
              </>
            )}
            {run.gatePassed === undefined && (
              <span className="text-[17px] font-semibold text-ink-muted">N/A</span>
            )}
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="findings" className="w-full">
        <TabsList>
          <TabsTrigger value="findings">Findings ({findings.length})</TabsTrigger>
          <TabsTrigger value="artifacts">Artifacts ({artifacts.length})</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="findings" className="mt-4 space-y-4">
          {Object.entries(findingsByCategory).map(([category, categoryFindings]) => (
            <Card key={category} className="p-4">
              <h3 className="mb-3 text-[15px] font-semibold text-ink">
                {category.replace(/_/g, " ")} ({categoryFindings.length})
              </h3>
              <div className="space-y-3">
                {categoryFindings.map((finding) => (
                  <div key={finding._id} className="border-l border-line pl-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <SeverityBadge severity={finding.severity} />
                          <span className="text-[13.5px] font-medium text-ink">{finding.title}</span>
                        </div>
                        <p className="text-[13px] text-ink-secondary">{finding.description}</p>
                        {finding.filePaths && finding.filePaths.length > 0 && (
                          <div className="mt-2 font-mono text-[12px] text-ink-muted">
                            {finding.filePaths.join(", ")}
                          </div>
                        )}
                        {finding.suggestedFix && (
                          <div className="mt-2 rounded-lg bg-surface-2 p-2 text-[12px] text-ink-secondary">
                            <span className="font-medium text-ink">Suggested fix:</span> {finding.suggestedFix}
                          </div>
                        )}
                      </div>
                      {finding.confidence !== undefined && (
                        <StatusBadge tone="neutral" className="font-mono">
                          {Math.round(finding.confidence * 100)}%
                        </StatusBadge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
          {findings.length === 0 && (
            <div className="py-12 text-center text-[13px] text-ink-muted">
              No findings for this run
            </div>
          )}
        </TabsContent>

        <TabsContent value="artifacts" className="mt-4 space-y-3">
          {artifacts.map((artifact) => (
            <Card key={artifact._id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-ink-muted" strokeWidth={1.75} />
                <div>
                  <div className="text-[13.5px] font-medium text-ink">{artifact.name}</div>
                  <div className="text-[12.5px] text-ink-muted">
                    {artifact.type} · {artifact.mimeType}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="gap-2">
                <Download className="h-4 w-4" strokeWidth={1.75} />
                Download
              </Button>
            </Card>
          ))}
          {artifacts.length === 0 && (
            <div className="py-12 text-center text-[13px] text-ink-muted">
              No artifacts for this run
            </div>
          )}
        </TabsContent>

        <TabsContent value="details" className="mt-4">
          <Card className="p-6">
            <dl className="space-y-3">
              <div>
                <dt className="text-[12.5px] font-medium text-ink-secondary">Run ID</dt>
                <dd className="mt-1 font-mono text-[13px] text-ink">{run.runId}</dd>
              </div>
              <div>
                <dt className="text-[12.5px] font-medium text-ink-secondary">Repo URL</dt>
                <dd className="mt-1 text-[13px] text-ink">{run.repoUrl}</dd>
              </div>
              <div>
                <dt className="text-[12.5px] font-medium text-ink-secondary">Scope</dt>
                <dd className="mt-1 text-[13px] text-ink">{run.scopeType}</dd>
              </div>
              <div>
                <dt className="text-[12.5px] font-medium text-ink-secondary">Initiator</dt>
                <dd className="mt-1 text-[13px] text-ink">{run.initiatorType}</dd>
              </div>
              {run.evidenceHash && (
                <div>
                  <dt className="text-[12.5px] font-medium text-ink-secondary">Evidence Hash</dt>
                  <dd className="mt-1 break-all font-mono text-[12px] text-ink">{run.evidenceHash}</dd>
                </div>
              )}
            </dl>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
