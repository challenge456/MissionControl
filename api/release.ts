type ReleaseEnvironment = "staging" | "production";

interface ReleaseIdentity {
  commitSha: string;
  deploymentId: string;
  environment: ReleaseEnvironment;
}

type ReleaseIdentityResult =
  | { ok: true; identity: ReleaseIdentity }
  | { ok: false; missing: string[] };

const COMMIT_SHA_PATTERN = /^[0-9a-f]{40}$/;

/**
 * Resolve only provider-authored deployment identity. A release endpoint must
 * never let a caller or mutable application setting claim which commit is live.
 */
export function resolveVercelReleaseIdentity(
  environment: Record<string, string | undefined>,
): ReleaseIdentityResult {
  const commitSha = environment.VERCEL_GIT_COMMIT_SHA?.trim().toLowerCase() ?? "";
  const deploymentId = environment.VERCEL_DEPLOYMENT_ID?.trim() ?? "";
  const vercelEnvironment = environment.VERCEL_ENV?.trim().toLowerCase();
  const releaseEnvironment = vercelEnvironment === "preview"
    ? "staging"
    : vercelEnvironment === "production"
      ? "production"
      : undefined;

  const missing: string[] = [];
  if (!COMMIT_SHA_PATTERN.test(commitSha)) missing.push("VERCEL_GIT_COMMIT_SHA");
  if (!deploymentId) missing.push("VERCEL_DEPLOYMENT_ID");
  if (!releaseEnvironment) missing.push("VERCEL_ENV");
  if (missing.length > 0 || !releaseEnvironment) return { ok: false, missing };

  return {
    ok: true,
    identity: {
      commitSha,
      deploymentId,
      environment: releaseEnvironment,
    },
  };
}

export function GET(): Response {
  const result = resolveVercelReleaseIdentity(process.env);
  if (!result.ok) {
    return Response.json(
      { status: "unavailable", missing: result.missing },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }

  return Response.json(result.identity, {
    status: 200,
    headers: { "cache-control": "no-store" },
  });
}
