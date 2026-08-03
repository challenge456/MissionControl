/**
 * Bearer token auth middleware for orchestration server.
 * When ORCHESTRATION_API_TOKEN or MC_API_TOKEN is set, protected routes require
 * Authorization: Bearer <token>. When neither is set, requests are allowed (dev mode).
 */

import type { Context, Next } from "hono";

const ORCHESTRATION_TOKEN = process.env.ORCHESTRATION_API_TOKEN?.trim();
const MC_TOKEN = process.env.MC_API_TOKEN?.trim();
const EXPECTED_TOKEN = ORCHESTRATION_TOKEN || MC_TOKEN || null;
const PRODUCTION = process.env.NODE_ENV === "production";

export function orchestrationAuthFailure(
  expectedToken: string | null,
  production: boolean,
  authorizationHeader?: string
): { status: 401 | 503; error: string } | null {
  if (!expectedToken) {
    return production
      ? { status: 503, error: "Orchestration authentication is not configured" }
      : null;
  }
  const token = authorizationHeader?.startsWith("Bearer ")
    ? authorizationHeader.slice(7).trim()
    : null;
  return token === expectedToken ? null : { status: 401, error: "Unauthorized" };
}

export function requireAuth() {
  return async (c: Context, next: Next) => {
    const auth = c.req.header("Authorization");
    const failure = orchestrationAuthFailure(EXPECTED_TOKEN, PRODUCTION, auth);
    if (failure) return c.json({ error: failure.error }, failure.status);
    await next();
  };
}
