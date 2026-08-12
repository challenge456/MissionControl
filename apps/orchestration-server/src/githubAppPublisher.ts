import { createSign } from "node:crypto";

const GITHUB_API = "https://api.github.com";
const GITHUB_API_VERSION = "2022-11-28";
const GITHUB_REQUEST_TIMEOUT_MS = 30_000;

export interface GithubInstallationToken {
  token: string;
  expiresAt: number;
}

export interface GithubPullRequestIdentity {
  id: string;
  number: number;
  url: string;
  state: string;
  created: boolean;
}

export class GithubAppPublisher {
  constructor(
    private readonly appId: string,
    private readonly privateKey: string,
    private readonly fetcher: typeof fetch = fetch
  ) {
    if (!appId.trim()) throw new Error("GITHUB_APP_ID is required for GitHub publication.");
    if (!privateKey.trim()) throw new Error("GITHUB_APP_PRIVATE_KEY is required for GitHub publication.");
  }

  async mintInstallationToken(input: {
    installationId: string;
    repository: string;
    providerRepositoryId?: string;
  }, signal?: AbortSignal): Promise<GithubInstallationToken> {
    if (!/^[1-9]\d*$/.test(input.installationId)) {
      throw new Error("GitHub installation identity must be a positive integer.");
    }
    const jwt = createGithubAppJwt(this.appId, this.privateKey);
    const repositoryName = parseGithubRepository(input.repository).repo;
    const providerRepositoryId = input.providerRepositoryId === undefined
      ? undefined
      : parsePositiveSafeInteger(input.providerRepositoryId, "GitHub repository provider identity");
    const body = providerRepositoryId === undefined
      ? { repositories: [repositoryName] }
      : { repository_ids: [providerRepositoryId] };
    const result = await this.githubJson<{ token?: string; expires_at?: string }>(
      `/app/installations/${encodeURIComponent(input.installationId)}/access_tokens`,
      { method: "POST", token: jwt, body, signal }
    );
    if (!result.token || !result.expires_at) throw new Error("GitHub App did not issue an installation token.");
    const expiresAt = Date.parse(result.expires_at);
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      throw new Error("GitHub App issued an invalid or expired installation token.");
    }
    return { token: result.token, expiresAt };
  }

  async findOrCreatePullRequest(input: {
    token: string;
    repository: string;
    branch: string;
    baseBranch: string;
    title: string;
    body: string;
  }, signal?: AbortSignal): Promise<GithubPullRequestIdentity> {
    const { owner } = parseGithubRepository(input.repository);
    const head = `${owner}:${input.branch}`;
    const existing = await this.githubJson<Array<{
      id: number;
      number: number;
      html_url: string;
      state: string;
      head?: { ref?: string };
    }>>(
      `/repos/${input.repository}/pulls?state=all&head=${encodeURIComponent(head)}&base=${encodeURIComponent(input.baseBranch)}&per_page=20`,
      { method: "GET", token: input.token, signal }
    );
    const exact = existing.find((pullRequest) => pullRequest.head?.ref === input.branch) ?? existing[0];
    if (exact) {
      if (exact.state !== "open") {
        throw new Error(`Pull request #${exact.number} already owns branch ${input.branch} but is ${exact.state}.`);
      }
      return { id: String(exact.id), number: exact.number, url: exact.html_url, state: exact.state, created: false };
    }
    const created = await this.githubJson<{
      id: number;
      number: number;
      html_url: string;
      state: string;
    }>(`/repos/${input.repository}/pulls`, {
      method: "POST",
      token: input.token,
      body: {
        title: input.title,
        head: input.branch,
        base: input.baseBranch,
        body: input.body,
        draft: false,
        maintainer_can_modify: false,
      },
      signal,
    });
    return { id: String(created.id), number: created.number, url: created.html_url, state: created.state, created: true };
  }

  private async githubJson<T>(path: string, input: {
    method: "GET" | "POST";
    token: string;
    body?: unknown;
    signal?: AbortSignal;
  }): Promise<T> {
    const controller = new AbortController();
    const abort = () => controller.abort(input.signal?.reason);
    if (input.signal?.aborted) abort();
    else input.signal?.addEventListener("abort", abort, { once: true });
    const timeout = setTimeout(() => controller.abort(new Error("GitHub API request timed out.")), GITHUB_REQUEST_TIMEOUT_MS);
    try {
      const response = await this.fetcher(`${GITHUB_API}${path}`, {
        method: input.method,
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${input.token}`,
          "Content-Type": "application/json",
          "User-Agent": "Mission-Control-GitHub-App",
          "X-GitHub-Api-Version": GITHUB_API_VERSION,
        },
        body: input.body === undefined ? undefined : JSON.stringify(input.body),
        signal: controller.signal,
      });
      if (!response.ok) {
        const requestId = response.headers.get("x-github-request-id");
        throw new Error(`GitHub API request failed (${response.status}${requestId ? `; request ${requestId}` : ""}).`);
      }
      return await response.json() as T;
    } finally {
      clearTimeout(timeout);
      input.signal?.removeEventListener("abort", abort);
    }
  }
}

function createGithubAppJwt(appId: string, rawPrivateKey: string, now = Date.now()): string {
  const privateKey = rawPrivateKey.replace(/\\n/g, "\n");
  const issuedAt = Math.floor(now / 1_000) - 60;
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify({ iat: issuedAt, exp: issuedAt + 9 * 60, iss: appId }));
  const unsigned = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  return `${unsigned}.${signer.sign(privateKey).toString("base64url")}`;
}

function base64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

export function parseGithubRepository(repository: string) {
  const [owner, repo, ...rest] = repository.trim().split("/");
  const validPart = /^(?!\.{1,2}$)[A-Za-z0-9_.-]{1,100}$/;
  if (!owner || !repo || rest.length || !validPart.test(owner) || !validPart.test(repo)) {
    throw new Error("GitHub repository must use a safe owner/name identifier.");
  }
  return { owner, repo };
}

function parsePositiveSafeInteger(value: string, label: string): number {
  if (!/^[1-9]\d*$/.test(value)) throw new Error(`${label} must be a positive integer.`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) throw new Error(`${label} exceeds the supported integer range.`);
  return parsed;
}
