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
    attemptPurpose: "IMPLEMENTATION",
    factoryDefinitionVersionId: "factory-version-7",
    executorAdapter: "codex",
    executorVersion: "v1",
    executionClaimedBy: "local-factory-worker",
    headSha: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  }],
  verificationRuns: [{
    _id: "verification-run-failed",
    workflowRunId: "attempt-verifier-1",
    verificationSubjectDigest: "sha256:subject-failed",
    verificationPlanId: "verification-plan:failed",
    independenceValid: true,
  }],
  evidenceEnvelopes: [{ _id: "evidence-failure-1", verificationRunId: "verification-run-failed" }],
  qualityGateDecisions: [{ state: "INELIGIBLE" }],
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
  currentVerification: {
    eligible: false,
    current: false,
    verificationRunId: "verification-run-failed",
    reasons: ["Exact-head GitHub CI evidence is bound to another candidate SHA."],
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
        attemptPurpose: "IMPLEMENTATION",
        headSha: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        retryOfWorkflowRunId: "attempt-1",
      }, workOrder.executionRuns[0]],
      verificationRuns: [{
        _id: "verification-run-pass",
        workflowRunId: "attempt-verifier-2",
        verificationSubjectDigest: "sha256:subject-pass",
        verificationPlanId: "verification-plan:pass",
        independenceValid: true,
      }],
      evidenceEnvelopes: [{ _id: "evidence-pass-2", verificationRunId: "verification-run-pass" }],
      qualityGateDecisions: [{ state: "ELIGIBLE" }],
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
      currentVerification: {
        eligible: true,
        current: true,
        verificationRunId: "verification-run-pass",
        reasons: [],
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
    expect(workOrder.evidenceEnvelopes[0]._id).toBe("evidence-failure-1");
  });
});
