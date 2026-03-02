/**
 * Base URL for the Mission Control orchestration server.
 * In dev with no VITE_ORCHESTRATION_URL, uses same-origin so Vite proxy can forward to localhost:4100.
 */

const env = typeof import.meta !== "undefined" ? (import.meta as any).env : undefined;
const explicit = env?.VITE_ORCHESTRATION_URL?.trim();
const isDev = env?.DEV === true;

/** Base URL for HTTP requests (no trailing slash). Empty string = same origin (use with proxy). */
export function getOrchestrationBaseUrl(): string {
  if (explicit) return explicit;
  if (isDev) return ""; // same-origin; Vite proxy forwards /gateway/* to localhost:4100
  return "http://localhost:4100";
}

/** Full WebSocket URL for the gateway proxy. Resolves same-origin in dev for Vite WS proxy. */
export function getGatewayWsUrl(): string {
  const base = getOrchestrationBaseUrl();
  if (base === "" && typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}/gateway/ws`;
  }
  const wsBase = base.replace(/^http/, "ws");
  return `${wsBase}/gateway/ws`;
}
