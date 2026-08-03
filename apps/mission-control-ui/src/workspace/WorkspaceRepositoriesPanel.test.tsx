import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspaceRepositoriesPanel } from "./WorkspaceRepositoriesPanel";

vi.mock("./FactoryConfigurationPanel", () => ({
  FactoryConfigurationPanel: () => <div>Factory configuration test boundary</div>,
}));

const mocks = vi.hoisted(() => ({
  repositories: [] as any[],
  scopes: [] as any[],
  readiness: undefined as any,
  setDefault: vi.fn(),
  backfill: vi.fn(),
  beginInstallation: vi.fn(),
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
    githubAppConnections: {
      getRepositoryReadiness: "githubAppConnections.getRepositoryReadiness",
      beginInstallation: "githubAppConnections.beginInstallation",
    },
  },
}));

vi.mock("convex/react", () => ({
  useQuery: (query: string) => {
    if (query === "projects.listRepositories") return mocks.repositories;
    if (query === "projects.listCodeScopes") return mocks.scopes;
    if (query === "githubAppConnections.getRepositoryReadiness") return mocks.readiness;
    return undefined;
  },
  useMutation: (mutation: string) => {
    if (mutation === "projects.setDefaultRepository") return mocks.setDefault;
    if (mutation === "projects.backfillLegacyRepositories") return mocks.backfill;
    return vi.fn();
  },
  useAction: (action: string) => {
    if (action === "githubAppConnections.beginInstallation") return mocks.beginInstallation;
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
    mocks.readiness = undefined;
    mocks.setDefault.mockResolvedValue({ success: true });
    mocks.backfill.mockResolvedValue({ created: 1, existing: 0, skipped: 0, failed: 0 });
    mocks.beginInstallation.mockResolvedValue({
      ok: true,
      installUrl: "https://github.com/apps/mission-control/installations/new?state=opaque",
    });
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

  it("shows actionable GitHub App readiness without exposing credentials", () => {
    mocks.repositories = [
      {
        repositoryId: "repository-1",
        source: "CONNECTION",
        repository: "sellerfi/marketplace",
        displayName: "marketplace",
        defaultBranch: "main",
        isDefault: true,
        status: "DEGRADED",
        webhookStatus: "ERROR",
        scopeCount: 0,
      },
    ];
    mocks.readiness = {
      overall: "BLOCKED",
      installation: {
        installationId: "12345",
        accountLogin: "sellerfi",
      },
      checks: [
        {
          id: "permissions",
          status: "BLOCKED",
          label: "Least-privilege permissions",
          detail: "Missing checks:read",
          remediation: "Update the GitHub App permission grant to the documented V1 envelope.",
        },
      ],
    };

    render(<WorkspaceRepositoriesPanel project={project} />);

    expect(screen.getByText("GitHub App readiness")).toBeInTheDocument();
    expect(screen.getByText(/Missing checks:read/)).toBeInTheDocument();
    expect(screen.getByText(/tokens are not stored/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Repair installation" })).toBeInTheDocument();
    expect(screen.queryByText(/ghs_/i)).not.toBeInTheDocument();
  });

  it("sanitizes GitHub App setup failures", async () => {
    mocks.repositories = [
      {
        repositoryId: "repository-1",
        source: "CONNECTION",
        repository: "sellerfi/marketplace",
        displayName: "marketplace",
        defaultBranch: "main",
        isDefault: true,
        status: "CONFIGURED",
        webhookStatus: "MISSING",
        scopeCount: 0,
      },
    ];
    mocks.readiness = {
      overall: "MISSING",
      installation: null,
      checks: [{
        id: "installation",
        status: "MISSING",
        label: "GitHub App installation",
        detail: "No GitHub App installation is bound to this repository.",
        remediation: "Install the Mission Control GitHub App.",
      }],
    };
    mocks.beginInstallation.mockResolvedValue({ ok: false, code: "NOT_CONFIGURED" });

    render(<WorkspaceRepositoriesPanel project={project} />);
    fireEvent.click(screen.getByRole("button", { name: "Install GitHub App" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "GitHub App setup is not configured for this environment"
    );
    expect(screen.queryByText(/Request ID secret/)).not.toBeInTheDocument();
  });
});
