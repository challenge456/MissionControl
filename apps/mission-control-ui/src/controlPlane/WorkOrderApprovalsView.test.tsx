import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkOrderApprovalsView } from "./WorkOrderApprovalsView";

const mocks = vi.hoisted(() => ({ decide: vi.fn() }));

vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    workOrders: {
      approvalQueue: "workOrders.approvalQueue",
      decideApprovalDecision: "workOrders.decideApprovalDecision",
    },
  },
}));

const pendingDecision = {
  _id: "approval-1",
  approvalType: "PROTECTED_DISPATCH",
  requestedAction: "Approve bounded implementation dispatch",
  riskLevel: "HIGH",
  status: "PENDING",
  requestedBy: "orchestrator",
  expiresAt: Date.now() + 60 * 60_000,
  createdAt: Date.now(),
  workOrder: {
    _id: "work-order-1",
    title: "Implement governed decision packet",
    desiredOutcome: "Operator can authorize bounded work with evidence.",
    workflowId: "software-factory",
    repository: "MissionControl",
    branchStrategy: "isolated-worktree",
    riskLevel: "HIGH",
    state: "AWAITING_APPROVAL",
    assignedAgent: "builder",
    constraints: ["No production deploy"],
    requiredApprovals: ["RISK_REVIEW"],
    acceptanceCriteria: [{ id: "ac-1", title: "Operator flow passes", verificationMethod: "BROWSER" }],
  },
  verificationReceipts: [],
  remainingUncertainty: [],
};

vi.mock("convex/react", () => ({
  useQuery: (query: string) => query === "workOrders.approvalQueue" ? [pendingDecision] : undefined,
  useMutation: () => mocks.decide,
}));

describe("WorkOrderApprovalsView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.decide.mockResolvedValue({ status: "APPROVED" });
  });

  it("renders the complete decision, dispatch, and proof packet", () => {
    render(<WorkOrderApprovalsView projectId={"project-1" as never} />);

    expect(screen.getByRole("heading", { name: "Decision Center" })).toBeInTheDocument();
    expect(screen.getByText("Approve bounded implementation dispatch")).toBeInTheDocument();
    expect(screen.getByText(/Repository: MissionControl/)).toBeInTheDocument();
    expect(screen.getByText(/Dispatch remains explicit/)).toBeInTheDocument();
    expect(screen.getAllByText(/Operator flow passes/)).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Approve scope" })).toBeEnabled();
  });

  it("requires a reason and records workspace-scoped decisions", async () => {
    render(<WorkOrderApprovalsView projectId={"project-1" as never} />);

    fireEvent.click(screen.getByRole("button", { name: "Approve scope" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Record why this decision");
    expect(mocks.decide).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Decision reason"), { target: { value: "Scope is bounded and rollback is explicit." } });
    fireEvent.click(screen.getByRole("button", { name: "Approve scope" }));

    await waitFor(() => expect(mocks.decide).toHaveBeenCalledWith(expect.objectContaining({
      approvalDecisionId: "approval-1",
      projectId: "project-1",
      decision: "APPROVE",
      reason: "Scope is bounded and rollback is explicit.",
    })));
  });
});
