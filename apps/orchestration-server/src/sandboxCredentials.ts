import { createHash } from "node:crypto";
import { redactSandboxText } from "./sandboxProvider.js";

export interface SandboxCredentialRequest {
  projectId: string;
  workflowRunId: string;
  attemptId: string;
  attemptLeaseId: string;
  model?: string;
  maxCostUsd: number;
  expiresAt: number;
}

export interface SandboxCredentialGrant {
  grantKey: string;
  provider: "OPENROUTER" | "FAKE";
  externalCredentialId: string;
  secret: string;
  environmentVariable: "OPENAI_API_KEY";
  issuedAt: number;
  expiresAt: number;
  maxCostUsd: number;
  secretFingerprint: string;
}

export interface SandboxCredentialRevocationReceipt {
  grantKey: string;
  externalCredentialId: string;
  requestedAt: number;
  revokedAt: number;
  revoked: true;
}

export type SandboxCredentialReference = Omit<SandboxCredentialGrant, "secret">;

export interface SandboxCredentialBroker {
  mint(request: SandboxCredentialRequest): Promise<SandboxCredentialGrant>;
  revoke(grant: SandboxCredentialReference): Promise<SandboxCredentialRevocationReceipt>;
}

export class OpenRouterSandboxCredentialBroker implements SandboxCredentialBroker {
  constructor(
    private readonly managementKey = process.env.OPENROUTER_MANAGEMENT_API_KEY?.trim(),
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly now: () => number = Date.now,
  ) {}

  async mint(request: SandboxCredentialRequest): Promise<SandboxCredentialGrant> {
    if (!this.managementKey) throw new Error("OpenRouter management credential is not configured on the control plane.");
    validateCredentialRequest(request, this.now());
    const grantKey = stableCredentialGrantKey(request);
    const response = await this.fetchImpl("https://openrouter.ai/api/v1/keys", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.managementKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: grantKey,
        limit: request.maxCostUsd,
        expires_at: new Date(request.expiresAt).toISOString(),
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const payload = await readJson(response, "create Attempt inference key");
    const secret = String(payload?.data?.key ?? payload?.key ?? "");
    const externalCredentialId = String(payload?.data?.hash ?? payload?.hash ?? "");
    if (!secret || !externalCredentialId) throw new Error("OpenRouter did not return the one-time key and revocable key hash.");
    return {
      grantKey,
      provider: "OPENROUTER",
      externalCredentialId,
      secret,
      environmentVariable: "OPENAI_API_KEY",
      issuedAt: this.now(),
      expiresAt: request.expiresAt,
      maxCostUsd: request.maxCostUsd,
      secretFingerprint: secretFingerprint(secret),
    };
  }

  async revoke(grant: SandboxCredentialReference): Promise<SandboxCredentialRevocationReceipt> {
    if (!this.managementKey) throw new Error("OpenRouter management credential is not configured on the control plane.");
    if (grant.provider !== "OPENROUTER" || !grant.externalCredentialId) throw new Error("Credential grant cannot be revoked by the OpenRouter broker.");
    const requestedAt = this.now();
    const response = await this.fetchImpl(`https://openrouter.ai/api/v1/keys/${encodeURIComponent(grant.externalCredentialId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${this.managementKey}` },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok && response.status !== 404) {
      const detail = redactSandboxText(await response.text());
      throw new Error(`OpenRouter could not revoke the Attempt key (${response.status}): ${detail}`);
    }
    return {
      grantKey: grant.grantKey,
      externalCredentialId: grant.externalCredentialId,
      requestedAt,
      revokedAt: this.now(),
      revoked: true,
    };
  }
}

export class FakeSandboxCredentialBroker implements SandboxCredentialBroker {
  readonly active = new Map<string, SandboxCredentialGrant>();
  readonly calls: string[] = [];
  constructor(private readonly now: () => number = Date.now) {}

  async mint(request: SandboxCredentialRequest): Promise<SandboxCredentialGrant> {
    validateCredentialRequest(request, this.now());
    const grantKey = stableCredentialGrantKey(request);
    const existing = this.active.get(grantKey);
    if (existing) return existing;
    const secret = `fake-attempt-key-${createHash("sha256").update(grantKey).digest("hex").slice(0, 16)}`;
    const grant: SandboxCredentialGrant = {
      grantKey,
      provider: "FAKE",
      externalCredentialId: `fake:${grantKey}`,
      secret,
      environmentVariable: "OPENAI_API_KEY",
      issuedAt: this.now(),
      expiresAt: request.expiresAt,
      maxCostUsd: request.maxCostUsd,
      secretFingerprint: secretFingerprint(secret),
    };
    this.active.set(grantKey, grant);
    this.calls.push(`mint:${grantKey}`);
    return grant;
  }

  async revoke(grant: SandboxCredentialReference): Promise<SandboxCredentialRevocationReceipt> {
    const requestedAt = this.now();
    this.active.delete(grant.grantKey);
    this.calls.push(`revoke:${grant.grantKey}`);
    return {
      grantKey: grant.grantKey,
      externalCredentialId: grant.externalCredentialId,
      requestedAt,
      revokedAt: this.now(),
      revoked: true,
    };
  }
}

export function stableCredentialGrantKey(input: Pick<SandboxCredentialRequest, "projectId" | "workflowRunId" | "attemptId">) {
  const digest = createHash("sha256").update(`${input.projectId}:${input.workflowRunId}:${input.attemptId}`).digest("hex").slice(0, 20);
  return `mc-attempt-${digest}`;
}

function secretFingerprint(secret: string) {
  return `sha256:${createHash("sha256").update(secret).digest("hex")}`;
}

function validateCredentialRequest(request: SandboxCredentialRequest, now: number) {
  if (!request.projectId || !request.workflowRunId || !request.attemptId || !request.attemptLeaseId) throw new Error("Attempt credential scope is incomplete.");
  if (!Number.isFinite(request.maxCostUsd) || request.maxCostUsd <= 0 || request.maxCostUsd > 100) throw new Error("Attempt credential spend cap is invalid.");
  if (!Number.isFinite(request.expiresAt) || request.expiresAt <= now + 30_000 || request.expiresAt > now + 8 * 60 * 60 * 1_000 + 60_000) throw new Error("Attempt credential expiry is outside the allowed runtime window.");
}

async function readJson(response: Response, action: string) {
  const text = await response.text();
  let payload: any;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = {};
  }
  if (!response.ok) throw new Error(`OpenRouter could not ${action} (${response.status}): ${redactSandboxText(payload?.error?.message ?? text)}`);
  return payload;
}
