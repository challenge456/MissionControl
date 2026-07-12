/**
 * Per-agent settings panel (OpenClaw Studio parity - Phase 3).
 * Personality (link to Identity), Capabilities (Run/Web/File note), Advanced (Open in OpenClaw, Delete).
 */

import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Settings, User, Shield, ExternalLink, Trash2 } from "lucide-react";

interface AgentSettingsPanelProps {
  agent: Doc<"agents">;
  open: boolean;
  onClose: () => void;
  onNavigateToIdentity?: () => void;
  onDelete?: (agentId: Id<"agents">) => void;
}

export function AgentSettingsPanel({
  agent,
  open,
  onClose,
  onNavigateToIdentity,
  onDelete,
}: AgentSettingsPanelProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings size={16} strokeWidth={1.7} aria-hidden />
            {agent.emoji ? `${agent.emoji} ` : ""}{agent.name}
          </DialogTitle>
          <DialogDescription>Personality, capabilities, and advanced options.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Personality */}
          <section>
            <h4 className="text-[11.5px] font-medium uppercase tracking-[0.06em] text-ink-muted flex items-center gap-2 mb-2">
              <User size={14} strokeWidth={1.7} aria-hidden />
              Personality
            </h4>
            <p className="text-[13.5px] text-ink-secondary mb-2">
              Soul (SOUL.md), identity, and instructions. Edit in Identity Directory.
            </p>
            {onNavigateToIdentity && (
              <Button size="sm" variant="outline" onClick={onNavigateToIdentity}>
                Open in Identity Directory
              </Button>
            )}
          </section>

          {/* Capabilities */}
          <section>
            <h4 className="text-[11.5px] font-medium uppercase tracking-[0.06em] text-ink-muted flex items-center gap-2 mb-2">
              <Shield size={14} strokeWidth={1.7} aria-hidden />
              Capabilities
            </h4>
            <p className="text-[13.5px] text-ink-secondary">
              Run commands (Off / Ask / Auto), Web access, File tools. When using an OpenClaw Gateway, configure these on the Gateway or in OpenClaw Studio (Capabilities tab). Mission Control policy engine applies to task-based runs.
            </p>
          </section>

          {/* Advanced */}
          <section>
            <h4 className="text-[11.5px] font-medium uppercase tracking-[0.06em] text-ink-muted mb-2">
              Advanced
            </h4>
            <div className="flex flex-col gap-2">
              <a
                href="https://github.com/grp06/openclaw-studio"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[13.5px] text-ink-secondary hover:text-ink hover:underline transition-colors duration-150"
              >
                <ExternalLink size={14} strokeWidth={1.7} aria-hidden />
                OpenClaw Studio (Gateway UI)
              </a>
              {onDelete && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="w-fit mt-2"
                  onClick={() => onDelete(agent._id)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Delete agent
                </Button>
              )}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
