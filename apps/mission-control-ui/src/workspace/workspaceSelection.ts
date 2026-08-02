import type { Id } from "../../../../convex/_generated/dataModel";

export type AccessibleWorkspace = { _id: Id<"projects">; name: string };

export function selectAccessibleWorkspace({
  requestedWorkspace,
  persistedWorkspace,
  workspaces,
}: {
  requestedWorkspace: string | null;
  persistedWorkspace: string | null;
  workspaces: AccessibleWorkspace[];
}): { projectId: Id<"projects"> | null; requestedUnavailable: boolean } {
  const softwareFactoryDemo = workspaces.find(
    (workspace) => workspace.name.trim().toLowerCase() === "software factory demo"
  );
  const legacyMissionControl = workspaces.find(
    (workspace) => workspace.name.trim().toLowerCase() === "mission control"
  );
  const requested = requestedWorkspace
    ? workspaces.find((workspace) => workspace._id === requestedWorkspace)
    : undefined;
  if (requested) return { projectId: requested._id, requestedUnavailable: false };

  const persisted = persistedWorkspace
    ? workspaces.find((workspace) => workspace._id === persistedWorkspace)
    : undefined;
  const persistedIsLegacyMissionControl =
    persisted?._id != null &&
    legacyMissionControl?._id != null &&
    persisted._id === legacyMissionControl._id;
  const preferred =
    (persistedIsLegacyMissionControl && softwareFactoryDemo
      ? softwareFactoryDemo
      : persisted) ??
    softwareFactoryDemo ??
    legacyMissionControl ??
    workspaces.find((workspace) =>
      workspace.name.trim().toLowerCase().includes("mission control")
    ) ??
    workspaces[0];

  return {
    projectId: preferred?._id ?? null,
    requestedUnavailable: Boolean(requestedWorkspace),
  };
}
