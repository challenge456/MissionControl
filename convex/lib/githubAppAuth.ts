import type { GithubPermissionGrant } from "./githubAppReadiness";

const GITHUB_API_VERSION = "2026-03-10";

function encodeBase64Url(value: string | ArrayBuffer): string {
  const bytes = typeof value === "string"
    ? new TextEncoder().encode(value)
    : new Uint8Array(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function encodeDerLength(length: number): number[] {
  if (length < 128) return [length];
  const bytes: number[] = [];
  let remaining = length;
  while (remaining > 0) {
    bytes.unshift(remaining & 0xff);
    remaining >>= 8;
  }
  return [0x80 | bytes.length, ...bytes];
}

function wrapPkcs1AsPkcs8(pkcs1: Uint8Array): Uint8Array {
  const version = [0x02, 0x01, 0x00];
  const rsaAlgorithmIdentifier = [
    0x30, 0x0d,
    0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01,
    0x05, 0x00,
  ];
  const privateKey = [0x04, ...encodeDerLength(pkcs1.length), ...pkcs1];
  const body = [...version, ...rsaAlgorithmIdentifier, ...privateKey];
  return Uint8Array.from([0x30, ...encodeDerLength(body.length), ...body]);
}

function decodePem(pem: string): ArrayBuffer {
  const normalized = pem.replace(/\\n/g, "\n");
  const pkcs1 = normalized.includes("-----BEGIN RSA PRIVATE KEY-----");
  const base64 = normalized
    .replace(/-----BEGIN (?:RSA )?PRIVATE KEY-----/g, "")
    .replace(/-----END (?:RSA )?PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");
  const binary = atob(base64);
  const decoded = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const keyBytes = pkcs1 ? wrapPkcs1AsPkcs8(decoded) : decoded;
  return keyBytes.buffer.slice(
    keyBytes.byteOffset,
    keyBytes.byteOffset + keyBytes.byteLength
  ) as ArrayBuffer;
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function createGithubAppJwt(input: {
  appId: string;
  privateKey: string;
  now?: number;
}): Promise<string> {
  const nowSeconds = Math.floor((input.now ?? Date.now()) / 1_000);
  const header = encodeBase64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = encodeBase64Url(JSON.stringify({
    iat: nowSeconds - 60,
    exp: nowSeconds + 9 * 60,
    iss: input.appId,
  }));
  const signingInput = `${header}.${payload}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    decodePem(input.privateKey),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput)
  );
  return `${signingInput}.${encodeBase64Url(signature)}`;
}

async function githubJson<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": GITHUB_API_VERSION,
      "User-Agent": "Mission-Control-GitHub-App",
      ...init.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub verification failed (${response.status})`);
  }
  return await response.json() as T;
}

export async function verifyGithubInstallationSetup(input: {
  code: string;
  installationId: string;
  repository: string;
  appId: string;
  clientId: string;
  clientSecret: string;
  privateKey: string;
}) {
  const oauth = await githubJson<{ access_token?: string; error?: string }>(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: input.clientId,
        client_secret: input.clientSecret,
        code: input.code,
      }),
    }
  );
  if (!oauth.access_token) throw new Error("GitHub user authorization was not established");

  const userRepositories = await githubJson<{
    repositories?: Array<{ id: number; full_name: string }>;
  }>(`https://api.github.com/user/installations/${input.installationId}/repositories?per_page=100`, {
    method: "GET",
    headers: { Authorization: `Bearer ${oauth.access_token}` },
  });
  const target = userRepositories.repositories?.find(
    (repository) => repository.full_name.toLowerCase() === input.repository.toLowerCase()
  );
  if (!target) {
    throw new Error("The installing GitHub user did not grant this repository to the installation");
  }

  const appJwt = await createGithubAppJwt({ appId: input.appId, privateKey: input.privateKey });
  const installation = await githubJson<{
    id: number;
    account: { login: string; type?: string };
    repository_selection: "all" | "selected";
    permissions: Record<string, "read" | "write" | "admin">;
    events: string[];
    created_at: string;
  }>(`https://api.github.com/app/installations/${input.installationId}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${appJwt}` },
  });

  const token = await githubJson<{
    token: string;
    expires_at: string;
    permissions: Record<string, "read" | "write" | "admin">;
    repository_selection: "all" | "selected";
  }>(`https://api.github.com/app/installations/${input.installationId}/access_tokens`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${appJwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ repository_ids: [target.id] }),
  });
  if (!token.token || !token.expires_at) {
    throw new Error("GitHub installation token could not be issued");
  }

  const permissions: GithubPermissionGrant[] = Object.entries(token.permissions).map(
    ([name, access]) => ({ name, access })
  );
  return {
    providerRepositoryId: String(target.id),
    installationId: String(installation.id),
    accountLogin: installation.account.login,
    accountType: installation.account.type,
    repositorySelection: token.repository_selection === "all" ? "ALL" as const : "SELECTED" as const,
    permissions,
    subscribedEvents: installation.events,
    installedAt: Date.parse(installation.created_at),
    verifiedAt: Date.now(),
    lastTokenIssuedAt: Date.now(),
  };
}

export async function verifyGithubInstallationAccess(input: {
  installationId: string;
  repository: string;
  appId: string;
  privateKey: string;
}) {
  const appJwt = await createGithubAppJwt({ appId: input.appId, privateKey: input.privateKey });
  type Installation = {
    id: number;
    account: { login: string; type?: string };
    repository_selection: "all" | "selected";
    permissions: Record<string, "read" | "write" | "admin">;
    events: string[];
    created_at: string;
  };
  const installations = await githubJson<Installation[]>("https://api.github.com/app/installations?per_page=100", {
    method: "GET",
    headers: { Authorization: `Bearer ${appJwt}` },
  });
  const orderedInstallations = [...installations].sort((left, right) =>
    String(left.id) === input.installationId ? -1 : String(right.id) === input.installationId ? 1 : 0
  );

  for (const installation of orderedInstallations) {
    const token = await githubJson<{
      token: string;
      expires_at: string;
      permissions: Record<string, "read" | "write" | "admin">;
      repository_selection: "all" | "selected";
    }>(`https://api.github.com/app/installations/${installation.id}/access_tokens`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${appJwt}`,
        "Content-Type": "application/json",
      },
    });
    if (!token.token || !token.expires_at) continue;

    const repositories = await githubJson<{
      repositories?: Array<{ id: number; full_name: string }>;
    }>("https://api.github.com/installation/repositories?per_page=100", {
      method: "GET",
      headers: { Authorization: `Bearer ${token.token}` },
    });
    const target = repositories.repositories?.find(
      (repository) => repository.full_name.toLowerCase() === input.repository.toLowerCase()
    );
    if (!target) continue;

    const permissions: GithubPermissionGrant[] = Object.entries(token.permissions).map(
      ([name, access]) => ({ name, access })
    );
    return {
      providerRepositoryId: String(target.id),
      installationId: String(installation.id),
      accountLogin: installation.account.login,
      accountType: installation.account.type,
      repositorySelection: token.repository_selection === "all" ? "ALL" as const : "SELECTED" as const,
      permissions,
      subscribedEvents: installation.events,
      installedAt: Date.parse(installation.created_at),
      verifiedAt: Date.now(),
      lastTokenIssuedAt: Date.now(),
    };
  }
  throw new Error("The GitHub App installation does not grant this repository");
}

export async function mintGithubInstallationToken(input: {
  installationId: string;
  providerRepositoryId: string;
  appId: string;
  privateKey: string;
}) {
  const repositoryId = Number(input.providerRepositoryId);
  if (!Number.isSafeInteger(repositoryId) || repositoryId <= 0) {
    throw new Error("GitHub repository provider identity is invalid");
  }
  const appJwt = await createGithubAppJwt({ appId: input.appId, privateKey: input.privateKey });
  const result = await githubJson<{
    token?: string;
    expires_at?: string;
  }>(`https://api.github.com/app/installations/${input.installationId}/access_tokens`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${appJwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ repository_ids: [repositoryId] }),
  });
  if (!result.token || !result.expires_at) {
    throw new Error("GitHub installation token could not be issued");
  }
  return {
    token: result.token,
    expiresAt: Date.parse(result.expires_at),
  };
}
