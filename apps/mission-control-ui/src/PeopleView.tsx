import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id, Doc } from "../../../convex/_generated/dataModel";
import { AddPersonModal } from "./AddPersonModal";
import { EditPersonModal } from "./EditPersonModal";
import { PageHeader } from "./components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { UserPlus, Search, Users, Shield, Mail, Building2 } from "lucide-react";

interface PeopleViewProps {
  projectId: Id<"projects"> | null;
}

const ROLE_BADGE_CLASSES: Record<string, string> = {
  OWNER: "border-amber-400/20 bg-amber-500/10 text-amber-300",
  ADMIN: "border-red-400/20 bg-red-500/10 text-red-300",
  MANAGER: "border-cyan-300/20 bg-cyan-400/10 text-cyan-100",
  MEMBER: "border-[var(--panel-line)] bg-[color:var(--shell-panel)] text-foreground",
  VIEWER: "border-[var(--panel-line)] bg-[color:var(--shell-panel)] text-muted-foreground",
};

const ACCESS_LEVEL_CLASSES: Record<string, string> = {
  ADMIN: "text-red-300",
  EDIT: "text-amber-300",
};

export function PeopleView({ projectId }: PeopleViewProps) {
  const orgMembers = useQuery(api.orgMembers.list, {
    projectId: projectId ?? undefined,
  });
  const projects = useQuery(api.projects.list);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editMember, setEditMember] = useState<Doc<"orgMembers"> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);

  if (!orgMembers) {
    return (
      <main className="mc-page">
        <div className="mc-page-body">
          <div className="h-[620px] rounded-2xl border border-[var(--panel-line)] skeleton-shimmer" />
        </div>
      </main>
    );
  }

  const filtered = orgMembers.filter((member) => {
    const matchesSearch =
      !searchQuery ||
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.email && member.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = !roleFilter || ((member as any).systemRole || "MEMBER") === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleCounts: Record<string, number> = {};
  orgMembers.forEach((member) => {
    const role = (member as any).systemRole || "MEMBER";
    roleCounts[role] = (roleCounts[role] || 0) + 1;
  });

  const activeCount = orgMembers.filter((member) => member.active).length;
  const leadershipCount = orgMembers.filter((member) => ["OWNER", "ADMIN", "MANAGER"].includes((member as any).systemRole || "MEMBER")).length;

  const getProjectName = (pid: Id<"projects">) => {
    return projects?.find((project) => project._id === pid)?.name || "Unknown";
  };

  return (
    <main className="mc-page">
      <PageHeader
        title="People"
        description="Directory, role posture, and project access across the operating team."
        eyebrow="Comms"
        icon={<Users className="h-4.5 w-4.5" strokeWidth={1.7} />}
        status={
          <Badge variant="outline" className="border-cyan-300/20 text-cyan-100">
            {orgMembers.length} members
          </Badge>
        }
        actions={
          <Button variant="neon-cyan" onClick={() => setShowAddModal(true)}>
            <UserPlus className="h-4 w-4" />
            Add member
          </Button>
        }
      />

      <div className="mc-page-body mc-page-stack">
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4">
            <div className="mc-kicker">Team size</div>
            <div className="mt-2 text-3xl font-semibold text-foreground">{orgMembers.length}</div>
            <div className="mt-1 text-xs text-muted-foreground">People available in the directory</div>
          </Card>
          <Card className="p-4">
            <div className="mc-kicker">Active now</div>
            <div className="mt-2 text-3xl font-semibold text-cyan-100">{activeCount}</div>
            <div className="mt-1 text-xs text-muted-foreground">Members currently marked active</div>
          </Card>
          <Card className="p-4">
            <div className="mc-kicker">Leadership</div>
            <div className="mt-2 text-3xl font-semibold text-amber-100">{leadershipCount}</div>
            <div className="mt-1 text-xs text-muted-foreground">Owner, admin, and manager roles</div>
          </Card>
          <Card className="p-4">
            <div className="mc-kicker">Role filters</div>
            <div className="mt-2 text-3xl font-semibold text-foreground">{Object.keys(roleCounts).length}</div>
            <div className="mt-1 text-xs text-muted-foreground">Distinct role groups in this workspace</div>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
          <Card className="p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative max-w-[420px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search by name, email, or role"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  aria-label="Search team members"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <FilterChip
                  label={`All (${orgMembers.length})`}
                  active={roleFilter === null}
                  onClick={() => setRoleFilter(null)}
                />
                {["OWNER", "ADMIN", "MANAGER", "MEMBER", "VIEWER"].map((role) =>
                  roleCounts[role] ? (
                    <FilterChip
                      key={role}
                      label={`${role} (${roleCounts[role]})`}
                      active={roleFilter === role}
                      onClick={() => setRoleFilter(roleFilter === role ? null : role)}
                    />
                  ) : null
                )}
              </div>
            </div>

            {orgMembers.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  icon={Users}
                  title="No team members yet"
                  description="Add the first team member so roles, access, and ownership can be routed clearly."
                  action={
                    <Button variant="neon-cyan" onClick={() => setShowAddModal(true)}>
                      <UserPlus className="h-4 w-4" />
                      Add first member
                    </Button>
                  }
                />
              </div>
            ) : filtered.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  icon={Search}
                  title="No matching members"
                  description="Try widening the search or removing the active role filter."
                />
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
                {filtered.map((member) => (
                  <PersonCard
                    key={member._id}
                    member={member}
                    getProjectName={getProjectName}
                    onClick={() => setEditMember(member)}
                  />
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="mc-kicker">Operator guidance</div>
            <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted-foreground">
              <div className="rounded-xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-4 py-4">
                Keep titles and roles current. Team context becomes routing context across the whole system.
              </div>
              <div className="rounded-xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-4 py-4">
                Use this surface to validate who can see, change, and approve work before issues become access incidents.
              </div>
            </div>
          </Card>
        </div>
      </div>

      <AddPersonModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        projectId={projectId}
      />
      <EditPersonModal
        open={editMember !== null}
        onClose={() => setEditMember(null)}
        member={editMember}
      />
    </main>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors",
        active
          ? "border-cyan-300/20 bg-cyan-400/10 text-cyan-100"
          : "border-[var(--panel-line)] bg-[color:var(--shell-panel)] text-muted-foreground hover:text-foreground"
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

interface PersonCardProps {
  member: Doc<"orgMembers">;
  getProjectName: (pid: Id<"projects">) => string;
  onClick: () => void;
}

function PersonCard({ member, getProjectName, onClick }: PersonCardProps) {
  const systemRole = (member as any).systemRole || "MEMBER";
  const projectAccess = (member as any).projectAccess as
    | { projectId: Id<"projects">; accessLevel: string }[]
    | undefined;
  const permissions = (member as any).permissions as string[] | undefined;

  return (
    <button
      type="button"
      className="rounded-2xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] p-5 text-left transition-colors hover:border-[var(--panel-line-strong)]"
      onClick={onClick}
      aria-label={`View details for ${member.name}`}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex h-14 w-14 shrink-0 items-center justify-center rounded-full border text-base font-semibold",
            member.active ? "border-cyan-300/20 bg-cyan-400/10 text-cyan-100" : "border-[var(--panel-line)] bg-background/50 text-muted-foreground"
          )}
        >
          {member.avatar || member.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-lg font-semibold text-foreground">{member.name}</div>
            <span className={cn("rounded-full border px-2.5 py-0.5 text-[0.66rem] font-semibold uppercase tracking-[0.14em]", ROLE_BADGE_CLASSES[systemRole] || ROLE_BADGE_CLASSES.MEMBER)}>
              {systemRole}
            </span>
          </div>
          {member.title ? <div className="mt-1 text-sm text-muted-foreground">{member.title}</div> : null}
          <div className="mt-1 text-sm text-cyan-100">{member.role}</div>
        </div>
      </div>

      <div className="mt-4 space-y-3 border-t border-[var(--panel-line)] pt-4">
        {member.email ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span className="truncate">{member.email}</span>
          </div>
        ) : null}

        {projectAccess && projectAccess.length > 0 ? (
          <div>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              Project access
            </div>
            <div className="flex flex-wrap gap-2">
              {projectAccess.slice(0, 3).map((access) => (
                <span key={access.projectId} className="rounded-full border border-[var(--panel-line)] px-2.5 py-1 text-xs text-foreground">
                  {getProjectName(access.projectId)}
                  <span className={cn("ml-1", ACCESS_LEVEL_CLASSES[access.accessLevel] ?? "text-muted-foreground")}>
                    {access.accessLevel}
                  </span>
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {permissions && permissions.length > 0 ? (
          <div>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              <Shield className="h-3.5 w-3.5" />
              Permissions
            </div>
            <div className="flex flex-wrap gap-2">
              {permissions.slice(0, 4).map((permission) => (
                <Badge key={permission} variant="outline" className="border-[var(--panel-line)] text-muted-foreground">
                  {permission}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </button>
  );
}
