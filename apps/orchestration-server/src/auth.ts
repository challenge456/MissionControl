/**
 * Bearer token auth middleware for orchestration server.
 * When ORCHESTRATION_API_TOKEN or MC_API_TOKEN is set, protected routes require
 * Authorization: Bearer <token>. When neither is set, requests are allowed (dev mode).
 */

import type { Context, Next } from "hono";

const ORCHESTRATION_TOKEN = process.env.ORCHESTRATION_API_TOKEN?.trim();
const MC_TOKEN = process.env.MC_API_TOKEN?.trim();
const EXPECTED_TOKEN = ORCHESTRATION_TOKEN || MC_TOKEN || null;

export function requireAuth() {
  return async (c: Context, next: Next) => {
    if (!EXPECTED_TOKEN) {
      await next();
      return;
    }
    const auth = c.req.header("Authorization");
    const token =
      auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null;
    if (token !== EXPECTED_TOKEN) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    await next();
  };
}
