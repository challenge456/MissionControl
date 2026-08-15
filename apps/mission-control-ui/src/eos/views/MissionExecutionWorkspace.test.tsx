import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MissionExecutionWorkspace } from "./MissionExecutionWorkspace";

vi.mock("convex/react", () => ({
  useMutation: () => vi.fn(),
}));

const workOrder = {
  _id: "work-order-1",
  title: "Deliver the local golden path",
  missionRole: "WORKER",
  state: "BLOCKED",
  acceptanceCriteria: [{ id: "browser-proof" }],
  childTasks: [{ _id: "task-1", status: "DONE" }],
  executionRuns: [{
    _id: "attempt-1",
    runId: "attempt-failed",
    status: "FAILED",
    factoryDefinitionVersionId: "factory-version-7",
    executorAdapter: "codex",
    executorVersion: "v1",
    executionClaimedBy: "local-factory-worker",
    headSha: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  }],
  verificationReceipts: [{
    workflowRunId: "attempt-1",
    evidenceEnvelopeIds: ["evidence-failure-1"],
  }],
  reviewPackage: {
    status: "BLOCKED",
    identity: {
      headSha: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      pullRequestNumber: 90,
      pullRequestUrl: "https://github.com/jaydubya818/MissionControl/pull/90",
      githubAppInstallationId: "installation-1",
    },
    gate: { verifier: "service:factory-verifier" },
  },
  acceptanceEligibility: {
    eligible: false,
    reviewPackageStatus: "BLOCKED",
    blockingReasons: ["Exact-head GitHub CI evidence is bound to another candidate SHA."],
  },
};

describe("Mission execution golden-path projection", () => {
  it("shows immutable candidate, Factory, executor, evidence, PR attribution, and blocked acceptance", () => {
    render(<MissionExecutionWorkspace
      projectId={"project-1" as any}
      mission={{ _id: "mission-1", state: "BLOCKED" }}
      workOrders={[workOrder]}
    />);

    expect(screen.getByText("attempt-failed")).toBeInTheDocument();
    expect(screen.getByText("factory-version-7")).toBeInTheDocument();
    expect(screen.getByText(/codex\/v1 · local-factory-worker/)).toBeInTheDocument();
    expect(screen.getByText("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")).toBeInTheDocument();
    expect(screen.getByText(/evidence-failure-1/)).toBeInTheDocument();
    expect(screen.getByText(/#90 · installation installation-1/)).toBeInTheDocument();
    expect(screen.getByText(/Exact-head GitHub CI evidence is bound to another candidate SHA/)).toBeInTheDocument();
  });

  it("shows a corrected retry as eligible without rewriting the historical Attempt identity", () => {
    const recovered = {
      ...workOrder,
      state: "AWAITING_VERIFICATION",
      executionRuns: [{
        ...workOrder.executionRuns[0],
        _id: "attempt-2",
        runId: "attempt-recovered",
        status: "COMPLETED",
        headSha: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        retryOfWorkflowRunId: "attempt-1",
      }, workOrder.executionRuns[0]],
      verificationReceipts: [{ workflowRunId: "attempt-2", evidenceEnvelopeIds: ["evidence-pass-2"] }],
      reviewPackage: {
        ...workOrder.reviewPackage,
        status: "READY",
        identity: {
          ...workOrder.reviewPackage.identity,
          headSha: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
          pullRequestNumber: 91,
          pullRequestUrl: "https://github.com/jaydubya818/MissionControl/pull/91",
        },
      },
      acceptanceEligibility: {
        eligible: true,
        reviewPackageStatus: "READY",
        blockingReasons: [],
      },
    };
    render(<MissionExecutionWorkspace
      projectId={"project-1" as any}
      mission={{ _id: "mission-1", state: "AWAITING_ACCEPTANCE" }}
      workOrders={[recovered]}
    />);

    expect(screen.getByText("attempt-recovered")).toBeInTheDocument();
    expect(screen.getByText("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb")).toBeInTheDocument();
    expect(screen.getByText(/evidence-pass-2/)).toBeInTheDocument();
    expect(screen.getByText("ELIGIBLE")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open exact candidate pull request/i })).toHaveAttribute("href", "https://github.com/jaydubya818/MissionControl/pull/91");
    expect(recovered.executionRuns[1].runId).toBe("attempt-failed");
    expect(workOrder.verificationReceipts[0].evidenceEnvelopeIds).toEqual(["evidence-failure-1"]);
  });
});
