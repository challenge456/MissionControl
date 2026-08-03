import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FactoryConfigurationPanel } from "./FactoryConfigurationPanel";

const mocks = vi.hoisted(() => ({
  definitions: [] as any[],
  detail: undefined as any,
  workflows: [{ _id: "workflow-1", name: "Mission delivery", version: 1 }],
  policies: [{ _id: "policy-1", name: "Default governance" }],
  verifiers: [{ _id: "verifier-1", label: "Independent review" }],
  createFactory: vi.fn(),
  createVersion: vi.fn(),
  assess: vi.fn(),
  activate: vi.fn(),
}));

vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    "factory/configuration": {
      list: "factory.list",
      getDetail: "factory.getDetail",
      create: "factory.create",
      createVersion: "factory.createVersion",
      assessReadiness: "factory.assessReadiness",
      activate: "factory.activate",
    },
    workflows: { list: "workflows.list" },
    "governance/policyEnvelopes": { listPolicyEnvelopes: "policies.list" },
    "context/verifiers": { list: "verifiers.list" },
  },
}));

vi.mock("convex/react", () => ({
  useQuery: (query: string) => {
    if (query === "factory.list") return mocks.definitions;
    if (query === "factory.getDetail") return mocks.detail;
    if (query === "workflows.list") return mocks.workflows;
    if (query === "policies.list") return mocks.policies;
    if (query === "verifiers.list") return mocks.verifiers;
    return undefined;
  },
  useMutation: (mutation: string) => {
    if (mutation === "factory.create") return mocks.createFactory;
    if (mutation === "factory.createVersion") return mocks.createVersion;
    if (mutation === "factory.assessReadiness") return mocks.assess;
    if (mutation === "factory.activate") return mocks.activate;
    throw new Error(`Unexpected mutation: ${mutation}`);
  },
}));

function renderPanel() {
  return render(<FactoryConfigurationPanel projectId={"project-1" as any} repositoryId={"repository-1" as any} />);
}

function detailWith(status: "PASS" | "BLOCKED") {
  return {
    definition: { _id: "factory-1", status: "DRAFT" },
    versions: [{ _id: "version-1", version: 1, configurationDigest: "factory-v1-12345678" }],
    assessments: [{
      _id: "assessment-1",
      factoryDefinitionVersionId: "version-1",
      status,
      checks: [{
        id: "github",
        label: "GitHub App connection",
        status: status === "PASS" ? "VERIFIED" : "MISSING",
        remediation: status === "PASS" ? undefined : "Install the GitHub App.",
      }],
    }],
  };
}

describe("FactoryConfigurationPanel", () => {
  beforeEach(() => {
    mocks.definitions = [];
    mocks.detail = undefined;
    mocks.createFactory.mockReset().mockResolvedValue("factory-1");
    mocks.createVersion.mockReset().mockResolvedValue("version-1");
    mocks.assess.mockReset().mockResolvedValue("assessment-1");
    mocks.activate.mockReset().mockResolvedValue({ activeVersionId: "version-1" });
  });

  it("creates a draft Factory from the explicit empty state", async () => {
    renderPanel();
    expect(screen.getByText(/No Factory exists for this repository/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Create Factory" }));

    await waitFor(() => expect(mocks.createFactory).toHaveBeenCalledWith({
      repositoryId: "repository-1",
      name: "Software Factory",
    }));
  });

  it("shows remediation and blocks activation after failed readiness", () => {
    mocks.definitions = [{ _id: "factory-1", repositoryId: "repository-1", status: "DRAFT" }];
    mocks.detail = detailWith("BLOCKED");
    renderPanel();

    expect(screen.getByText("Install the GitHub App.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Activate" })).toBeDisabled();
  });

  it("allows activation only for a passing assessment of the latest version", async () => {
    mocks.definitions = [{ _id: "factory-1", repositoryId: "repository-1", status: "DRAFT" }];
    mocks.detail = detailWith("PASS");
    renderPanel();

    const activate = screen.getByRole("button", { name: "Activate" });
    expect(activate).toBeEnabled();
    fireEvent.click(activate);

    await waitFor(() => expect(mocks.activate).toHaveBeenCalledWith({
      factoryDefinitionVersionId: "version-1",
    }));
    expect(await screen.findByRole("status")).toHaveTextContent("Factory version 1 activated.");
  });
});
