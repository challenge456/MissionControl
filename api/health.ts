import { resolveVercelReleaseIdentity } from "./release.js";

export function GET(): Response {
  const result = resolveVercelReleaseIdentity(process.env);
  if (!result.ok) {
    return Response.json(
      { status: "unavailable", missing: result.missing },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }

  return Response.json(
    { status: "ok", ...result.identity },
    { status: 200, headers: { "cache-control": "no-store" } },
  );
}

