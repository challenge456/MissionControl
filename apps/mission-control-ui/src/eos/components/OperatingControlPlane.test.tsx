import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OperatingControlPlane } from "./OperatingControlPlane";

const mocks = vi.hoisted(() => ({ queryData: null as any, setAttentionState: vi.fn().mockResolvedValue({ success: true }), setProjectId: vi.fn() }));

vi.mock("../../workspace/WorkspaceScopeProvider", () => ({
  useWorkspaceScope: () => ({ projectId: "project-1", project: null, setProjectId: mocks.setProjectId }),
}));

vi.mock("../../../../../convex/_generated/api", () => ({
  api: {
    softwareFactoryControlPlane: {
      getOperatingView: "control-plane.getOperatingView",
      setAttentionState: "control-plane.setAttentionState",
    },
  },
}));

const data = {
  generatedAt: 1,
  lens: "MY",
  defaultLens: "MY",
  availableLenses: ["MY", "TEAM", "WORKSPACE", "COMPANY"],
  scope: { company: { id: "tenant-1", name: "SellerFi" }, workspace: { id: "project-1", name: "Marketplace" }, team: null, repository: null, codeScope: null },
  allowedActions: { manageCompany: true, manageWorkspace: true, manageTeam: true, resolveAttention: true, dispatch: true },
  summary: {
    activeMissions: 5,
    activeWorkOrders: 8,
    attentionRequired: 1,
    runningAgents: 3,
    deliveryConfidence: { status: "WATCH", score: 74, formula: "Deterministic formula" },
    evidence: { passing: 4, failing: 1, stale: 1, missing: 2, unknown: 0 },
    formulae: { deliveryConfidence: "Deterministic formula", attention: "Stable severity ranking" },
    source: "Canonical delivery records",
    freshness: { generatedAt: 1, status: "CURRENT" },
  },
  attention: [{ correlationKey: "wo:1", type: "FAILING_EVIDENCE", severity: "CRITICAL", reason: "Independent browser evidence failed.", ownerLabel: "Jay", requiredAction: "Inspect proof.", createdAt: 1, evidenceLabel: "Verification receipt", workspaceId: "project-1", workspaceName: "Marketplace", workOrderId: "wo-1", workOrderTitle: "Checkout trust flow", age: "2h" }],
  attentionWindow: { showing: 1, total: 1, limit: 15 },
  missions: [{ id: "mission-1", title: "Checkout confidence", objective: "Make acquisition evidence clear.", state: "IN_PROGRESS", owner: "Jay", assignmentRoles: ["OWNER"], teamId: "team-1", repositoryId: "repo-1", codeScopeIds: [], workOrders: 1, runningAgents: 1, nextAction: "Inspect the active run.", execution: { model: "composer", environment: "CLOUD", checkpointAt: 1, budgetUsd: 5, spentUsd: 1 }, evidence: { failing: 0, stale: 0, missing: 0 }, budget: { budgetUsd: 10, spentUsd: 2 }, updatedAt: 1 }],
  teams: [{ id: "team-1", name: "Checkout", status: "ACTIVE", members: 5, activeMissions: 25, attention: 1 }],
  people: [{ id: "member-1", name: "Jay", role: "LEAD", ownedMissions: 5, contributedMissions: 0, reviewMissions: 1, activeMissions: 5, capacityLimit: 5, attention: 1, runningAgents: 1, evidence: { passing: 4, failing: 0, stale: 0, missing: 1 } }],
  workspaces: [{ id: "project-1", name: "Marketplace", teams: 5, members: 25, activeMissions: 125, attention: 1, repositories: 1 }],
  fleet: { humanCapacity: { members: 25, activeAssignments: 125 }, agentDefinitions: { value: null, status: "UNKNOWN", source: "Not joined" }, agentInstances: { running: 3, failed: 1 }, executorHosts: { value: null, status: "UNKNOWN", source: "Checked at binding" } },
  filters: { teams: [{ id: "team-1", name: "Checkout" }], repositories: [{ id: "repo-1", name: "Marketplace" }], codeScopes: [{ id: "scope-1", name: "Buyer portal", repositoryId: "repo-1" }] },
};

vi.mock("convex/react", () => ({
  useQuery: () => mocks.queryData,
  useMutation: () => mocks.setAttentionState,
}));

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.search}</output>;
}

describe("OperatingControlPlane", () => {
  beforeEach(() => {
    mocks.queryData = data;
    mocks.setProjectId.mockClear();
  });

  it("renders truthful role lenses, attention, ownership, fleet boundaries, and deep-link state", () => {
    const onNavigate = vi.fn();
    render(
      <MemoryRouter initialEntries={["/v2/command-center?workspace=project-1"]}>
        <OperatingControlPlane projectId={"project-1" as never} onNavigate={onNavigate} />
        <LocationProbe />
      </MemoryRouter>
    );

    expect(screen.getByRole("region", { name: "Company account control plane" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "My Work" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Checkout trust flow")).toBeInTheDocument();
    expect(screen.getByText("Owner: Jay")).toBeInTheDocument();
    expect(screen.getByText("74%")).toBeInTheDocument();
    expect(screen.getByText("Agent definitions")).toBeInTheDocument();
    expect(screen.getByText("Executor hosts")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Company" }));
    expect(screen.getByTestId("location").textContent).toContain("lens=company");

    fireEvent.click(screen.getByRole("button", { name: /Inspect proof/i }));
    expect(onNavigate).toHaveBeenCalledWith("control-work-orders");
    expect(screen.getByTestId("location").textContent).toContain("workOrder=wo-1");
  });

  it("shows a recoverable state for stale or unauthorized URL scope", () => {
    mocks.queryData = { status: "SCOPE_ERROR", message: "Repository does not belong to this workspace.", generatedAt: 1 };
    render(
      <MemoryRouter initialEntries={["/v2/command-center?workspace=project-1&team=bad-team&repository=bad-repo&codeScope=bad-scope"]}>
        <OperatingControlPlane projectId={"project-1" as never} onNavigate={vi.fn()} />
        <LocationProbe />
      </MemoryRouter>
    );

    expect(screen.getByText("Operating scope unavailable")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reset operating scope" }));
    expect(screen.getByTestId("location").textContent).toBe("?workspace=project-1");
  });

  it("keeps Company read-oriented and enters the owning workspace before a mutation", () => {
    mocks.queryData = {
      ...data,
      lens: "COMPANY",
      allowedActions: { ...data.allowedActions, resolveAttention: false },
      workspaces: [
        ...data.workspaces,
        { id: "project-2", name: "Second Business", teams: 5, members: 25, activeMissions: 125, attention: 0, repositories: 1 },
      ],
    };
    render(
      <MemoryRouter initialEntries={["/v2/command-center?company=tenant-1&workspace=project-1&lens=company"]}>
        <OperatingControlPlane projectId={"project-1" as never} onNavigate={vi.fn()} />
        <LocationProbe />
      </MemoryRouter>
    );

    expect(screen.queryByRole("button", { name: "Resolve" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Second Business/i }));
    expect(mocks.setProjectId).toHaveBeenCalledWith("project-2");
    expect(screen.getByTestId("location").textContent).toContain("workspace=project-2");
    expect(screen.getByTestId("location").textContent).toContain("lens=workspace");
  });

  it("shows team members, capacity, review load, proof, and governed epics", () => {
    mocks.queryData = { ...data, lens: "TEAM", scope: { ...data.scope, team: { id: "team-1", name: "Checkout" } } };
    render(
      <MemoryRouter initialEntries={["/v2/command-center?workspace=project-1&lens=team&team=team-1"]}>
        <OperatingControlPlane projectId={"project-1" as never} onNavigate={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText("Team member")).toBeInTheDocument();
    expect(screen.getAllByText("Jay").length).toBeGreaterThan(0);
    expect(screen.getByText("1 review · 0 contribute")).toBeInTheDocument();
    expect(screen.getByText("Team epics")).toBeInTheDocument();
    expect(screen.getByText("composer")).toBeInTheDocument();
  });
});
