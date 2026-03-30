import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { PageHeader } from "./components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { UserPlus, Filter, Handshake, Phone, CalendarDays, Target } from "lucide-react";

interface CrmViewProps {
  projectId: Id<"projects"> | null;
}

const CRM_COLUMNS = [
  { id: "prospect", label: "Prospect" },
  { id: "contacted", label: "Contacted" },
  { id: "meeting", label: "Meeting" },
  { id: "proposal", label: "Proposal" },
  { id: "active", label: "Active" },
] as const;

export function CrmView({ projectId }: CrmViewProps) {
  const agents = useQuery(api.agents.listAll, projectId ? { projectId } : {});

  if (!agents) {
    return (
      <main className="mc-page">
        <div className="mc-page-body">
          <div className="h-[620px] rounded-2xl border border-[var(--panel-line)] skeleton-shimmer" />
        </div>
      </main>
    );
  }

  const columnItems: Record<string, typeof agents> = {
    prospect: agents.filter((agent) => agent.status === "IDLE"),
    contacted: agents.filter((agent) => agent.status === "ASSIGNED"),
    meeting: agents.filter((agent) => agent.status === "PAUSED"),
    proposal: agents.filter((agent) => agent.status === "QUARANTINED"),
    active: agents.filter((agent) => agent.status === "ACTIVE"),
  };

  const totalContacts = agents.length;
  const engagedCount = columnItems.contacted.length + columnItems.meeting.length + columnItems.proposal.length;

  return (
    <main className="mc-page">
      <PageHeader
        title="CRM"
        description="Track relationship posture, conversation stage, and active commercial motion across your contact pipeline."
        eyebrow="Comms"
        icon={<Handshake className="h-4.5 w-4.5" strokeWidth={1.7} />}
        status={
          <Badge variant="outline" className="border-cyan-300/20 text-cyan-100">
            {totalContacts} contacts
          </Badge>
        }
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="neon-cyan">
              <UserPlus className="h-4 w-4" />
              Add contact
            </Button>
          </div>
        }
      />

      <div className="mc-page-body mc-page-stack">
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4">
            <div className="mc-kicker">Pipeline size</div>
            <div className="mt-2 text-3xl font-semibold text-foreground">{totalContacts}</div>
            <div className="mt-1 text-xs text-muted-foreground">Current entries represented in the CRM flow</div>
          </Card>
          <Card className="p-4">
            <div className="mc-kicker">Engaged</div>
            <div className="mt-2 text-3xl font-semibold text-cyan-100">{engagedCount}</div>
            <div className="mt-1 text-xs text-muted-foreground">Contacts already in live conversation or proposal motion</div>
          </Card>
          <Card className="p-4">
            <div className="mc-kicker">Meetings</div>
            <div className="mt-2 text-3xl font-semibold text-amber-100">{columnItems.meeting.length}</div>
            <div className="mt-1 text-xs text-muted-foreground">Contacts currently waiting on a meeting follow-up</div>
          </Card>
          <Card className="p-4">
            <div className="mc-kicker">Active</div>
            <div className="mt-2 text-3xl font-semibold text-emerald-200">{columnItems.active.length}</div>
            <div className="mt-1 text-xs text-muted-foreground">Relationships that are already in active status</div>
          </Card>
        </div>

        {totalContacts === 0 ? (
          <Card className="p-5">
            <EmptyState
              icon={Handshake}
              title="No CRM contacts yet"
              description="Add contacts once you are ready to track outreach, meeting posture, and commercial follow-through in one place."
              action={
                <Button variant="neon-cyan">
                  <UserPlus className="h-4 w-4" />
                  Add first contact
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-5">
            {CRM_COLUMNS.map((column) => (
              <Card key={column.id} className="p-4">
                <div className="flex items-center justify-between gap-3 border-b border-[var(--panel-line)] pb-3">
                  <div className="mc-kicker">{column.label}</div>
                  <Badge variant="outline" className="border-[var(--panel-line)] text-muted-foreground">
                    {columnItems[column.id].length}
                  </Badge>
                </div>

                <div className="mt-4 space-y-3">
                  {columnItems[column.id].length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[var(--panel-line)] px-3 py-8 text-center text-xs text-muted-foreground">
                      No contacts in this stage
                    </div>
                  ) : (
                    columnItems[column.id].map((agent) => (
                      <div key={agent._id} className="rounded-xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] p-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cyan-300/16 bg-cyan-400/8 text-sm font-semibold text-cyan-100">
                            {agent.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-foreground">{agent.name}</div>
                            <div className="truncate text-xs text-muted-foreground">{agent.role}</div>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge variant="outline" className="border-[var(--panel-line)] text-muted-foreground">
                            <Target className="mr-1 h-3.5 w-3.5" />
                            {agent.status}
                          </Badge>
                          <Badge variant="outline" className="border-[var(--panel-line)] text-muted-foreground">
                            <Phone className="mr-1 h-3.5 w-3.5" />
                            outreach
                          </Badge>
                          <Badge variant="outline" className="border-[var(--panel-line)] text-muted-foreground">
                            <CalendarDays className="mr-1 h-3.5 w-3.5" />
                            follow-up
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
