import { type FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function WorkspaceTeamsPanel({ project }: { project: Doc<"projects"> }) {
  const structure = useQuery(api.softwareFactoryControlPlane.listWorkspaceStructure, { projectId: project._id });
  const createTeam = useMutation(api.softwareFactoryControlPlane.createTeam);
  const setTeamMembership = useMutation(api.softwareFactoryControlPlane.setTeamMembership);
  const [name, setName] = useState("");
  const [teamId, setTeamId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [role, setRole] = useState<"LEAD" | "DEVELOPER" | "QA" | "PM" | "VIEWER">("DEVELOPER");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const membershipsByTeam = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const membership of structure?.memberships ?? []) {
      if (!membership.active) continue;
      const rows = map.get(membership.teamId) ?? [];
      rows.push(membership);
      map.set(membership.teamId, rows);
    }
    return map;
  }, [structure]);
  const membersById = useMemo(() => new Map<string, Doc<"orgMembers">>((structure?.members ?? []).map((member) => [member._id, member])), [structure]);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!project.tenantId || !name.trim() || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const result = await createTeam({ tenantId: project.tenantId, projectId: project._id, name: name.trim(), slug: slugify(name), purpose: "Governed software delivery team", maxActiveMissionsPerMember: 5 });
      if (!result.success) throw new Error(result.error);
      setName("");
      setMessage("Team created. Add members and designate the accountable lead.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Team could not be created.");
    } finally {
      setBusy(false);
    }
  };

  const handleMembership = async (event: FormEvent) => {
    event.preventDefault();
    if (!project.tenantId || !teamId || !memberId || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      await setTeamMembership({ tenantId: project.tenantId, projectId: project._id, teamId: teamId as never, memberId: memberId as never, role, capacityAllocationPct: 100, active: true });
      setMessage("Team membership saved and will immediately govern the Team lens.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Membership could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-5" aria-label="Workspace teams and memberships">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[12.5px] font-medium text-ink-secondary">Scrum teams & membership</div>
          <div className="mt-1 text-[12px] text-ink-muted">Stable team authority replaces free-form squad labels while preserving them as audit snapshots.</div>
        </div>
        <Users className="h-4 w-4 text-ink-muted" aria-hidden />
      </div>

      {message ? <div role="status" className="mt-3 rounded-lg border border-line bg-surface-2 px-3 py-2 text-[12px] text-ink-secondary">{message}</div> : null}

      {structure === undefined ? (
        <div className="mt-4 h-24 animate-pulse rounded-lg bg-surface-2" />
      ) : structure.teams.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-line px-4 py-6 text-center">
          <div className="text-[13px] font-medium text-ink">No governed teams yet</div>
          <div className="mt-1 text-[12px] text-ink-muted">Create the first team before assigning accountable Mission owners.</div>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {structure.teams.map((team) => {
            const memberships = membershipsByTeam.get(team._id) ?? [];
            return (
              <div key={team._id} className="rounded-lg border border-line bg-surface-2/35 p-3">
                <div className="flex items-center justify-between gap-3"><div className="text-[13px] font-semibold text-ink">{team.name}</div><span className="font-mono text-[10px] uppercase text-ink-muted">{team.status}</span></div>
                <div className="mt-1 text-[11px] text-ink-muted">{memberships.length} active member{memberships.length === 1 ? "" : "s"} · WIP limit {team.capacityPolicy?.maxActiveMissionsPerMember ?? "Needs setup"}</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {memberships.map((membership) => <span key={membership._id} className="rounded border border-line bg-surface-1 px-2 py-1 text-[10px] text-ink-secondary">{membersById.get(membership.memberId)?.name ?? "Unknown member"} · {membership.role}</span>)}
                  {memberships.length === 0 ? <span className="text-[11px] text-warn">No members assigned</span> : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {structure?.canManageTeams && project.tenantId ? (
        <div className="mt-4 grid gap-4 border-t border-line pt-4 xl:grid-cols-2">
          <form onSubmit={(event) => void handleCreate(event)} className="space-y-2">
            <Label htmlFor="team-name">Create team</Label>
            <div className="flex gap-2"><Input id="team-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Checkout platform" maxLength={120} /><Button type="submit" variant="outline" disabled={busy || !name.trim()}>{busy ? "Saving…" : "Create"}</Button></div>
          </form>
          <form onSubmit={(event) => void handleMembership(event)} className="space-y-2">
            <Label htmlFor="team-membership">Add or update membership</Label>
            <div className="grid gap-2 sm:grid-cols-[1fr_1fr_120px_auto]">
              <select id="team-membership" value={teamId} onChange={(event) => setTeamId(event.target.value)} className="h-9 rounded-md border border-line bg-surface-1 px-2 text-[12px] text-ink"><option value="">Team</option>{structure.teams.map((team) => <option key={team._id} value={team._id}>{team.name}</option>)}</select>
              <select value={memberId} onChange={(event) => setMemberId(event.target.value)} aria-label="Member" className="h-9 rounded-md border border-line bg-surface-1 px-2 text-[12px] text-ink"><option value="">Member</option>{structure.members.filter((member) => member.active).map((member) => <option key={member._id} value={member._id}>{member.name}</option>)}</select>
              <select value={role} onChange={(event) => setRole(event.target.value as typeof role)} aria-label="Team role" className="h-9 rounded-md border border-line bg-surface-1 px-2 text-[12px] text-ink"><option value="LEAD">Lead</option><option value="DEVELOPER">Developer</option><option value="QA">QA</option><option value="PM">PM</option><option value="VIEWER">Viewer</option></select>
              <Button type="submit" variant="outline" disabled={busy || !teamId || !memberId}>Save</Button>
            </div>
          </form>
        </div>
      ) : structure ? <div className="mt-4 border-t border-line pt-3 text-[11px] text-ink-muted">Team structure is read-only for your current role.</div> : null}
    </Card>
  );
}
