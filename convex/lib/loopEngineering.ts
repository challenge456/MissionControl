export const LOOP_PHASES = [
  "RESEARCH",
  "VERIFY",
  "RECOMMEND",
  "AWAITING_APPROVAL",
  "IMPLEMENT",
  "VALIDATE",
  "MEASURE",
  "READY_FOR_NEXT_CYCLE",
  "COMPLETE",
  "BLOCKED",
] as const;

export type LoopPhase = (typeof LOOP_PHASES)[number];

export type Freshness =
  | "CURRENT"
  | "RECENT"
  | "RELEVANT"
  | "FOUNDATIONAL"
  | "STALE"
  | "UNKNOWN";

export function normalizeSourceUrl(value: string): string {
  const url = new URL(value.trim());
  url.hash = "";
  url.hostname = url.hostname.toLowerCase();
  if ((url.protocol === "https:" && url.port === "443") ||
      (url.protocol === "http:" && url.port === "80")) {
    url.port = "";
  }
  url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  url.searchParams.sort();
  return url.toString();
}

export interface LoopGateState {
  sources: Array<{ decision: "PENDING" | "ACCEPTED" | "REJECTED" }>;
  recommendations: Array<{ status: string }>;
  validations: Array<{ status: "PASS" | "FAIL" }>;
  measurements: Array<{ passed: boolean }>;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function classifyFreshness(
  publishedAt: number | undefined,
  now = Date.now()
): Freshness {
  if (!publishedAt || publishedAt > now) return "UNKNOWN";
  const ageDays = (now - publishedAt) / DAY_MS;
  if (ageDays <= 183) return "CURRENT";
  if (ageDays <= 365) return "RECENT";
  if (ageDays <= 730) return "RELEVANT";
  return "FOUNDATIONAL";
}

export function validateLoopAdvance(
  phase: LoopPhase,
  state: LoopGateState
): { ok: true; nextPhase: LoopPhase } | { ok: false; reason: string } {
  switch (phase) {
    case "RESEARCH":
      return state.sources.length > 0
        ? { ok: true, nextPhase: "VERIFY" }
        : { ok: false, reason: "Record at least one source before verification." };
    case "VERIFY": {
      if (state.sources.some((source) => source.decision === "PENDING")) {
        return { ok: false, reason: "Accept or reject every source before recommendations." };
      }
      if (!state.sources.some((source) => source.decision === "ACCEPTED")) {
        return { ok: false, reason: "At least one source must be accepted." };
      }
      return { ok: true, nextPhase: "RECOMMEND" };
    }
    case "RECOMMEND":
      return state.recommendations.length > 0
        ? { ok: true, nextPhase: "AWAITING_APPROVAL" }
        : { ok: false, reason: "Add at least one evidence-linked recommendation." };
    case "AWAITING_APPROVAL":
      return { ok: false, reason: "An explicit approval decision is required." };
    case "IMPLEMENT": {
      const approved = state.recommendations.filter((item) =>
        ["APPROVED", "IMPLEMENTING", "IMPLEMENTED"].includes(item.status)
      );
      if (approved.length === 0) {
        return { ok: false, reason: "No approved recommendations are available to implement." };
      }
      if (approved.some((item) => item.status !== "IMPLEMENTED")) {
        return { ok: false, reason: "Complete every approved implementation before validation." };
      }
      return { ok: true, nextPhase: "VALIDATE" };
    }
    case "VALIDATE":
      if (state.validations.length === 0) {
        return { ok: false, reason: "Record validation evidence before measurement." };
      }
      if (state.validations.some((validation) => validation.status === "FAIL")) {
        return { ok: false, reason: "Resolve failed validation evidence before measurement." };
      }
      return { ok: true, nextPhase: "MEASURE" };
    case "MEASURE":
      return state.measurements.length > 0
        ? { ok: true, nextPhase: "READY_FOR_NEXT_CYCLE" }
        : { ok: false, reason: "Record at least one measured result." };
    case "READY_FOR_NEXT_CYCLE":
      return { ok: true, nextPhase: "COMPLETE" };
    case "COMPLETE":
      return { ok: false, reason: "Completed cycles are immutable." };
    case "BLOCKED":
      return { ok: false, reason: "Resolve the blocker before continuing." };
  }
}
