import { getOrchestrationBaseUrl } from "./orchestrationUrl";

export interface GatewayStatus {
  configured: boolean;
  urlConfigured: boolean;
  tokenConfigured: boolean;
}

export interface GatewayStatusSnapshot {
  status: GatewayStatus | null;
  error: string | null;
  checkedAt: number;
}

const SUCCESS_TTL_MS = 15_000;
const FAILURE_TTL_MS = 30_000;
const REQUEST_TIMEOUT_MS = 2_500;
const STORAGE_KEY = "mc.gatewayStatusSnapshot";

let cachedSnapshot: GatewayStatusSnapshot | null = null;
let inflightSnapshot: Promise<GatewayStatusSnapshot> | null = null;

function normalizeGatewayStatus(payload: Partial<GatewayStatus> | null | undefined): GatewayStatus {
  const urlConfigured = Boolean(payload?.urlConfigured);
  const tokenConfigured = Boolean(payload?.tokenConfigured);
  return {
    urlConfigured,
    tokenConfigured,
    configured: Boolean(payload?.configured ?? (urlConfigured && tokenConfigured)),
  };
}

function gatewayStatusUrl() {
  const base = getOrchestrationBaseUrl();
  return base ? `${base}/gateway/status` : "/gateway/status";
}

function ttlForSnapshot(snapshot: GatewayStatusSnapshot) {
  return snapshot.error ? FAILURE_TTL_MS : SUCCESS_TTL_MS;
}

function readStoredSnapshot(): GatewayStatusSnapshot | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GatewayStatusSnapshot;
    if (typeof parsed?.checkedAt !== "number") return null;
    if (parsed.status && typeof parsed.status.configured !== "boolean") return null;
    return parsed;
  } catch {
    return null;
  }
}

function storeSnapshot(snapshot: GatewayStatusSnapshot) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // ignore storage failures; in-memory cache still works
  }
}

async function fetchGatewayStatusSnapshot(): Promise<GatewayStatusSnapshot> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(gatewayStatusUrl(), { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Gateway status request failed (${response.status})`);
    }

    const payload = (await response.json()) as Partial<GatewayStatus>;
    return {
      status: normalizeGatewayStatus(payload),
      error: null,
      checkedAt: Date.now(),
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.name === "AbortError"
          ? "Gateway status request timed out"
          : error.message
        : "Could not reach orchestration server.";

    return {
      status: null,
      error: message,
      checkedAt: Date.now(),
    };
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

export async function loadGatewayStatus(options?: { force?: boolean }): Promise<GatewayStatusSnapshot> {
  const force = options?.force ?? false;

  if (!force && !cachedSnapshot) {
    cachedSnapshot = readStoredSnapshot();
  }

  if (!force && cachedSnapshot && Date.now() - cachedSnapshot.checkedAt < ttlForSnapshot(cachedSnapshot)) {
    return cachedSnapshot;
  }

  if (!force && inflightSnapshot) {
    return inflightSnapshot;
  }

  inflightSnapshot = fetchGatewayStatusSnapshot().then((snapshot) => {
    cachedSnapshot = snapshot;
    storeSnapshot(snapshot);
    inflightSnapshot = null;
    return snapshot;
  });

  return inflightSnapshot;
}
