import type { SandboxCredentialGrant, SandboxCredentialRevocationReceipt } from "./sandboxCredentials.js";
import type { SandboxAllocation, SandboxAllocationRequest, SandboxTerminationReceipt } from "./sandboxProvider.js";
import type { SandboxResultBundle } from "./sandboxResultBundle.js";
import type { RemoteSandboxJournal, SandboxLifecycleEvent } from "./remoteSandboxRuntime.js";

type Report = (packet: Record<string, unknown>) => Promise<unknown>;

export class ConvexRemoteSandboxJournal implements RemoteSandboxJournal {
  constructor(private readonly report: Report, private readonly runId: string) {}

  async recordAllocationRequested(request: SandboxAllocationRequest) {
    await this.report({ sandbox: { operation: "REQUESTED", request } });
  }

  async recordAllocation(allocation: SandboxAllocation) {
    await this.report({ sandbox: { operation: "UPDATED", resourceName: allocation.resourceName, allocation } });
  }

  async recordResult(result: SandboxResultBundle) {
    await this.report({
      sandbox: {
        operation: "RESULT",
        result: {
          digest: result.digest,
          status: result.status,
          providerCostUsd: result.usage.providerCostUsd,
          inferenceCostUsd: result.usage.inferenceCostUsd,
        },
      },
    });
  }

  async recordCredentialIssued(grant: Omit<SandboxCredentialGrant, "secret">) {
    await this.report({ credential: { operation: "ISSUED", grant } });
  }

  async recordCredentialRevoked(receipt: SandboxCredentialRevocationReceipt) {
    await this.report({ credential: { operation: "REVOKED", receipt } });
  }

  async recordTermination(receipt: SandboxTerminationReceipt) {
    await this.report({ sandbox: { operation: "TERMINATED", resourceName: receipt.resourceName, receipt } });
  }

  async recordEvent(event: SandboxLifecycleEvent) {
    await this.report({
      events: [{
        idempotencyKey: `factory:${this.runId}:sandbox:${event.type}:${event.occurredAt}`,
        eventType: event.type,
        workflowStep: "remote-sandbox-execution",
        status: lifecycleStatus(event.type),
        startedAt: event.occurredAt,
        endedAt: event.occurredAt,
        commandSummary: event.type.toLowerCase().split("_").map((part) => part[0].toUpperCase() + part.slice(1)).join(" "),
        metadata: { resourceName: event.resourceName, attemptId: event.attemptId, ...(event.metadata ?? {}) },
      }],
    });
  }
}

function lifecycleStatus(type: SandboxLifecycleEvent["type"]) {
  if (type === "SANDBOX_FAILED") return "FAILED";
  if (type === "SANDBOX_CANCELLATION_REQUESTED") return "CANCELED";
  if (["SANDBOX_TERMINATED", "SANDBOX_CREDENTIAL_REVOKED", "SANDBOX_RESULT_RECEIVED"].includes(type)) return "COMPLETED";
  return "RUNNING";
}
