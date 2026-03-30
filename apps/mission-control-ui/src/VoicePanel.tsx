import { useState, useRef } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { PageHeader } from "./components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Mic, Volume2, Bot, Radio, Waves, Loader2 } from "lucide-react";

export function VoicePanel({ projectId }: { projectId: Id<"projects"> | null }) {
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [text, setText] = useState("");
  const [synthesizing, setSynthesizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const agents = useQuery(api.agents.listAll, projectId ? { projectId } : {});
  const artifacts = useQuery(
    api.voice.listArtifacts,
    selectedAgentId ? { agentId: selectedAgentId, limit: 20 } : { limit: 20 }
  );
  const synthesize = useAction(api.voice.synthesize);

  const selectedAgent = agents?.find((a: any) => a._id === selectedAgentId);
  const artifactList = artifacts ?? [];
  const generatedCount = artifactList.length;
  const totalDuration = artifactList.reduce((sum: number, item: any) => sum + (item.durationMs ?? 0), 0);

  const handleSynthesize = async () => {
    if (!text.trim()) return;
    setError(null);
    setSynthesizing(true);
    try {
      await synthesize({
        text: text.trim(),
        agentId: selectedAgentId || undefined,
        projectId: projectId ?? undefined,
      });
      setText("");
    } catch (err: any) {
      setError(err.message ?? "Synthesis failed");
    } finally {
      setSynthesizing(false);
    }
  };

  return (
    <main className="mc-page">
      <PageHeader
        title="Voice"
        description="Generate operator-reviewed voice output, inspect transcripts, and keep spoken interactions attached to a real agent context."
        eyebrow="Comms"
        icon={<Mic className="h-4.5 w-4.5" strokeWidth={1.7} />}
        status={
          <Badge variant="outline" className="border-cyan-300/20 text-cyan-100">
            {generatedCount} artifacts
          </Badge>
        }
      />

      <div className="mc-page-body mc-page-stack">
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4">
            <div className="mc-kicker">Artifacts</div>
            <div className="mt-2 text-3xl font-semibold text-foreground">{generatedCount}</div>
            <div className="mt-1 text-xs text-muted-foreground">Voice outputs currently retained for review</div>
          </Card>
          <Card className="p-4">
            <div className="mc-kicker">Agents available</div>
            <div className="mt-2 text-3xl font-semibold text-cyan-100">{agents?.length ?? 0}</div>
            <div className="mt-1 text-xs text-muted-foreground">Eligible identities for synthesis routing</div>
          </Card>
          <Card className="p-4">
            <div className="mc-kicker">Total duration</div>
            <div className="mt-2 text-3xl font-semibold text-foreground">{(totalDuration / 1000).toFixed(1)}s</div>
            <div className="mt-1 text-xs text-muted-foreground">Recorded output length in this session scope</div>
          </Card>
          <Card className="p-4">
            <div className="mc-kicker">Output posture</div>
            <div className="mt-2 text-3xl font-semibold text-emerald-200">{selectedAgent ? "Scoped" : "Open"}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {selectedAgent ? `Targeting ${selectedAgent.name}` : "No agent selected yet"}
            </div>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <Card className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mc-kicker">Speech console</div>
                <div className="mt-1 text-sm font-semibold text-foreground">Talk as an agent with explicit routing</div>
              </div>
              <Badge variant="outline" className="border-[var(--panel-line)] text-muted-foreground">
                Operator-reviewed
              </Badge>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)]">
              <div className="rounded-2xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] p-4">
                <div
                  className={cn(
                    "mx-auto flex h-28 w-28 items-center justify-center rounded-full border text-cyan-100 shadow-[var(--glow-cyan)]",
                    selectedAgent ? "border-cyan-300/20 bg-cyan-400/8" : "border-[var(--panel-line)] bg-background/50"
                  )}
                >
                  <Bot className="h-9 w-9" />
                </div>
                <div className="mt-4 text-center">
                  <div className="text-sm font-semibold text-foreground">{selectedAgent?.name ?? "Any agent"}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {selectedAgent?.role ?? "Unscoped output"}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Agent
                  </label>
                  <select
                    value={selectedAgentId}
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                    className="flex h-10 w-full rounded-2xl border border-[var(--panel-line)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--shell-panel)_98%,transparent),color-mix(in_srgb,var(--background)_90%,transparent))] px-3.5 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Any agent</option>
                    {agents?.map((agent: any) => (
                      <option key={agent._id} value={agent._id}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Message
                  </label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Write the exact message the agent should speak. Keep it concise, accurate, and safe to replay."
                    rows={6}
                    className="flex min-h-[148px] w-full rounded-xl border border-[var(--panel-line)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--shell-panel)_98%,transparent),color-mix(in_srgb,var(--background)_90%,transparent))] px-3.5 py-3 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] placeholder:text-muted-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                {error && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="neon-cyan"
                    onClick={handleSynthesize}
                    disabled={synthesizing || !text.trim()}
                    className="min-w-[148px]"
                  >
                    {synthesizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
                    {synthesizing ? "Synthesizing" : "Generate voice"}
                  </Button>
                  <Button variant="outline" onClick={() => setText("")} disabled={!text}>
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="mc-kicker">Operator guidance</div>
            <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted-foreground">
              <div className="rounded-xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-4 py-4">
                Voice output should be routed through a clear agent identity whenever it leaves the system.
              </div>
              <div className="rounded-xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-4 py-4">
                Treat transcripts as operational records. If wording matters, write it precisely before synthesis.
              </div>
              <div className="rounded-xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-4 py-4">
                Keep previews short. Use chat or task comments for long reasoning, then convert only the final spoken output here.
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="mc-kicker">Transcript log</div>
              <div className="mt-1 text-sm font-semibold text-foreground">Recent voice artifacts</div>
            </div>
            <Badge variant="outline" className="border-[var(--panel-line)] text-muted-foreground">
              <Radio className="mr-1 h-3.5 w-3.5" />
              Reviewable history
            </Badge>
          </div>

          {artifactList.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon={Waves}
                title="No voice artifacts yet"
                description="Synthesize speech to capture transcripts, providers, and generated duration here."
              />
            </div>
          ) : (
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {artifactList.map((artifact: any) => (
                <div
                  key={artifact._id}
                  className="rounded-xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm leading-relaxed text-foreground">{artifact.text}</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="outline" className="border-cyan-300/20 text-cyan-100">
                          {artifact.provider}
                        </Badge>
                        <Badge variant="outline" className="border-[var(--panel-line)] text-muted-foreground">
                          {artifact.voiceId ?? "default"}
                        </Badge>
                        {artifact.durationMs ? (
                          <Badge variant="outline" className="border-[var(--panel-line)] text-muted-foreground">
                            {(artifact.durationMs / 1000).toFixed(1)}s
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {new Date(artifact._creationTime).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <audio ref={audioRef} className="hidden" />
      </div>
    </main>
  );
}
