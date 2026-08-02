import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspaceRepositoriesPanel } from "./WorkspaceRepositoriesPanel";

const mocks = vi.hoisted(() => ({
  repositories: [] as any[],
  scopes: [] as any[],
  structure: { teams: [{ _id: "team-1", name: "Checkout", status: "ACTIVE" }], memberships: [], members: [], repositories: [], assignmentCount: 0, canManageTeams: true },
  setDefault: vi.fn(),
  backfill: vi.fn(),
}));

vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    projects: {
      listRepositories: "projects.listRepositories",
      listCodeScopes: "projects.listCodeScopes",
      setDefaultRepository: "projects.setDefaultRepository",
      backfillLegacyRepositories: "projects.backfillLegacyRepositories",
      createRepositoryConnection: "projects.createRepositoryConnection",
      createRepositoryCodeScope: "projects.createRepositoryCodeScope",
      archiveRepositoryCodeScope: "projects.archiveRepositoryCodeScope",
    },
    softwareFactoryControlPlane: {
      listWorkspaceStructure: "control-plane.listWorkspaceStructure",
    },
  },
}));

vi.mock("convex/react", () => ({
  useQuery: (query: string) => {
    if (query === "projects.listRepositories") return mocks.repositories;
    if (query === "projects.listCodeScopes") return mocks.scopes;
    if (query === "control-plane.listWorkspaceStructure") return mocks.structure;
    return undefined;
  },
  useMutation: (mutation: string) => {
    if (mutation === "projects.setDefaultRepository") return mocks.setDefault;
    if (mutation === "projects.backfillLegacyRepositories") return mocks.backfill;
    return vi.fn();
  },
}));

const project = {
  _id: "workspace-1",
  _creationTime: 1,
  name: "SellerFi",
  slug: "sellerfi",
  status: "ACTIVE",
} as never;

describe("WorkspaceRepositoriesPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.repositories = [];
    mocks.scopes = [];
    mocks.setDefault.mockResolvedValue({ success: true });
    mocks.backfill.mockResolvedValue({ created: 1, existing: 0, skipped: 0, failed: 0 });
  });

  it("shows a truthful setup state when the workspace has no repository", () => {
    render(<WorkspaceRepositoriesPanel project={project} />);

    expect(screen.getByText("No repository connected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add repository" })).toBeInTheDocument();
    expect(screen.getByText(/Workspaces can contain multiple repositories/)).toBeInTheDocument();
  });

  it("shows multiple repositories and monorepo scopes without exposing host paths", () => {
    mocks.repositories = [
      {
        repositoryId: "repository-1",
        source: "CONNECTION",
        repository: "sellerfi/marketplace",
        displayName: "marketplace",
        defaultBranch: "main",
        isDefault: true,
        status: "READY",
        webhookStatus: "READY",
        scopeCount: 1,
      },
      {
        repositoryId: "repository-2",
        source: "CONNECTION",
        repository: "sellerfi/docs",
        displayName: "docs",
        defaultBranch: "main",
        isDefault: false,
        status: "CONFIGURED",
        webhookStatus: "MISSING",
        scopeCount: 0,
      },
    ];
    mocks.scopes = [
      {
        _id: "scope-1",
        active: true,
        name: "Buyer portal",
        includePaths: ["apps/buyer-portal"],
        owningTeam: "Checkout",
        owningTeamId: "team-1",
        allowedEnvironments: ["LOCAL", "CLOUD"],
        verificationPolicy: "Unit + browser",
      },
    ];

    render(<WorkspaceRepositoriesPanel project={project} />);

    expect(screen.getByText("sellerfi/marketplace")).toBeInTheDocument();
    expect(screen.getByText("sellerfi/docs")).toBeInTheDocument();
    expect(screen.getByText("Buyer portal")).toBeInTheDocument();
    expect(screen.getByText("apps/buyer-portal")).toBeInTheDocument();
    expect(screen.queryByText(/Users\//)).not.toBeInTheDocument();
  });

  it("materializes a legacy repository before monorepo scopes are added", async () => {
    mocks.repositories = [
      {
        repositoryId: null,
        source: "LEGACY",
        repository: "sellerfi/marketplace",
        displayName: "marketplace",
        defaultBranch: "main",
        isDefault: true,
        status: "CONFIGURED",
        webhookStatus: "MISSING",
        scopeCount: 0,
      },
    ];
    render(<WorkspaceRepositoriesPanel project={project} />);

    fireEvent.click(screen.getByRole("button", { name: "Prepare monorepo scopes" }));

    await waitFor(() =>
      expect(mocks.backfill).toHaveBeenCalledWith({ projectId: "workspace-1" })
    );
  });
});
