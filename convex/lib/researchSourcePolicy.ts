export const RESEARCH_SOURCE_KINDS = [
  "X_USER",
  "YOUTUBE_CHANNEL",
  "WEBSITE",
  "RSS_ATOM",
] as const;

export type ResearchSourceKind = (typeof RESEARCH_SOURCE_KINDS)[number];

export const RESEARCH_SOURCE_STATES = [
  "DRAFT",
  "VERIFIED",
  "ACTIVE",
  "PAUSED",
  "DEGRADED",
  "REVOKED",
  "RETIRED",
] as const;

export type ResearchSourceState = (typeof RESEARCH_SOURCE_STATES)[number];

export interface ResearchSourceValidationPreview {
  valid: boolean;
  activatable: boolean;
  kind: ResearchSourceKind;
  canonicalUrl?: string;
  canonicalProviderId?: string;
  host?: string;
  displayLabel?: string;
  adapterName: string;
  adapterVersion: string;
  authenticationMode: "NONE" | "API_KEY" | "OAUTH";
  errors: string[];
  warnings: string[];
  networkPolicy: {
    httpsOnly: true;
    exactHostAllowlist: string[];
    dnsResolutionRequiredAtFetch: boolean;
    redirectsMustRemainOnAllowlist: true;
  };
}

export interface ResearchSourceActivationInput {
  state: ResearchSourceState;
  canonicalUrl?: string;
  canonicalProviderId?: string;
  validationStatus?: string;
  schedule?: { cadence?: string; timezone?: string };
  freshnessTargetMinutes?: number;
  maxItemsPerRun?: number;
  monthlyCostCeilingUsd?: number;
  retentionDays?: number;
  allowedContentClasses?: string[];
  exclusions?: string[];
  policyReviewState?: string;
  policyVersion?: string;
  lastError?: string;
  consecutiveFailureCount?: number;
}

const X_HANDLE = /^[A-Za-z0-9_]{1,15}$/;
const YOUTUBE_CHANNEL_ID = /^UC[A-Za-z0-9_-]{20,30}$/;
const YOUTUBE_HANDLE = /^@[A-Za-z0-9._-]{3,30}$/;
const DISALLOWED_HOST_SUFFIXES = [".localhost", ".local", ".internal", ".home.arpa"];
const SENSITIVE_QUERY_KEYS = new Set([
  "apikey",
  "accesstoken",
  "authtoken",
  "credential",
  "key",
  "password",
  "secret",
  "signature",
  "token",
]);

function normalizeHost(hostname: string): string {
  return hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
}

function parseIpv4(host: string): number[] | null {
  const parts = host.split(".");
  if (parts.length !== 4 || parts.some((part) => !/^\d{1,3}$/.test(part))) return null;
  const octets = parts.map(Number);
  return octets.every((octet) => octet >= 0 && octet <= 255) ? octets : null;
}

function isNonPublicIpv4(octets: number[]): boolean {
  const [a, b, c] = octets;
  return (
    a === 0
    || a === 10
    || a === 127
    || (a === 100 && b >= 64 && b <= 127)
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 0 && c === 0)
    || (a === 192 && b === 168)
    || (a === 192 && b === 0 && c === 2)
    || (a === 198 && (b === 18 || b === 19))
    || (a === 198 && b === 51 && c === 100)
    || (a === 203 && b === 0 && c === 113)
    || a >= 224
  );
}

export function isPublicResearchHostname(hostname: string): boolean {
  const host = normalizeHost(hostname);
  if (!host || host === "localhost" || DISALLOWED_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))) {
    return false;
  }
  const ipv4 = parseIpv4(host);
  if (ipv4) return !isNonPublicIpv4(ipv4);
  if (host.includes(":")) {
    const compact = host.toLowerCase();
    if (
      compact === "::"
      || compact === "::1"
      || compact.startsWith("fc")
      || compact.startsWith("fd")
      || /^fe[89ab]/.test(compact)
      || compact.startsWith("ff")
      || compact.startsWith("::ffff:")
      || compact.startsWith("2001:db8:")
    ) return false;
  }
  return host.includes(".");
}

function parsePublicHttpsUrl(locator: string) {
  const errors: string[] = [];
  let url: URL | undefined;
  try {
    url = new URL(locator.trim());
  } catch {
    errors.push("Enter a complete HTTPS URL.");
    return { errors };
  }
  if (url.protocol !== "https:") errors.push("Only HTTPS sources are permitted.");
  if (url.username || url.password) errors.push("Credentials must not appear in a source URL.");
  if ([...url.searchParams.keys()].some((key) => SENSITIVE_QUERY_KEYS.has(key.toLowerCase().replace(/[^a-z0-9]/g, "")))) {
    errors.push("Credentials and secret-like query parameters must not appear in a source URL.");
  }
  if (url.port && url.port !== "443") errors.push("Only the standard HTTPS port is permitted.");
  if (!isPublicResearchHostname(url.hostname)) errors.push("Local, private, reserved, and non-routable hosts are not permitted.");
  url.hash = "";
  url.hostname = normalizeHost(url.hostname);
  if (url.port === "443") url.port = "";
  url.pathname = url.pathname.replace(/\/{2,}/g, "/") || "/";
  url.searchParams.sort();
  return { url, errors };
}

function basePreview(kind: ResearchSourceKind): ResearchSourceValidationPreview {
  return {
    valid: false,
    activatable: false,
    kind,
    adapterName: kind === "RSS_ATOM" ? "web-rss" : kind === "WEBSITE" ? "web-html" : kind === "X_USER" ? "x-api-v2" : "youtube-data-api-v3",
    adapterVersion: "policy-preview-v1",
    authenticationMode: kind === "X_USER" ? "API_KEY" : kind === "YOUTUBE_CHANNEL" ? "API_KEY" : "NONE",
    errors: [],
    warnings: [],
    networkPolicy: {
      httpsOnly: true,
      exactHostAllowlist: [],
      dnsResolutionRequiredAtFetch: true,
      redirectsMustRemainOnAllowlist: true,
    },
  };
}

function validateWebsiteSource(kind: "WEBSITE" | "RSS_ATOM", locator: string) {
  const preview = basePreview(kind);
  const parsed = parsePublicHttpsUrl(locator);
  preview.errors.push(...parsed.errors);
  if (!parsed.url) return preview;
  preview.canonicalUrl = parsed.url.toString();
  preview.canonicalProviderId = `${kind.toLowerCase()}:${preview.canonicalUrl}`;
  preview.host = normalizeHost(parsed.url.hostname);
  preview.displayLabel = preview.host;
  preview.networkPolicy.exactHostAllowlist = [preview.host];
  preview.warnings.push(
    kind === "RSS_ATOM"
      ? "Feed format, robots policy, and redirect targets are verified by the Phase 2 adapter before fetching."
      : "Robots policy, content type, DNS resolution, response size, and redirect targets are verified before fetching.",
  );
  preview.valid = preview.errors.length === 0;
  preview.activatable = preview.valid;
  return preview;
}

function validateXSource(locator: string) {
  const preview = basePreview("X_USER");
  let handle = locator.trim().replace(/^@/, "");
  if (/^https?:\/\//i.test(locator.trim())) {
    const parsed = parsePublicHttpsUrl(locator);
    preview.errors.push(...parsed.errors);
    if (!parsed.url) return preview;
    const host = normalizeHost(parsed.url.hostname);
    if (!["x.com", "www.x.com", "twitter.com", "www.twitter.com"].includes(host)) {
      preview.errors.push("X sources must use x.com or twitter.com.");
    }
    handle = parsed.url.pathname.split("/").filter(Boolean)[0] ?? "";
  }
  if (!X_HANDLE.test(handle)) preview.errors.push("Enter one valid public X handle.");
  if (preview.errors.length === 0) {
    preview.canonicalUrl = `https://x.com/${handle}`;
    preview.host = "x.com";
    preview.displayLabel = `@${handle}`;
    preview.networkPolicy.exactHostAllowlist = ["api.x.com", "x.com"];
    preview.valid = true;
    preview.warnings.push("Activation waits for the X adapter to resolve this handle to a stable user ID and confirm the configured cost gate.");
  }
  return preview;
}

function validateYoutubeSource(locator: string) {
  const preview = basePreview("YOUTUBE_CHANNEL");
  const parsed = parsePublicHttpsUrl(locator);
  preview.errors.push(...parsed.errors);
  if (!parsed.url) return preview;
  const host = normalizeHost(parsed.url.hostname);
  if (!["youtube.com", "www.youtube.com"].includes(host)) {
    preview.errors.push("YouTube sources must use youtube.com.");
    return preview;
  }
  const parts = parsed.url.pathname.split("/").filter(Boolean);
  const channelId = parts[0] === "channel" && YOUTUBE_CHANNEL_ID.test(parts[1] ?? "") ? parts[1] : undefined;
  const handle = parts.length === 1 && YOUTUBE_HANDLE.test(parts[0] ?? "") ? parts[0] : undefined;
  if (!channelId && !handle) {
    preview.errors.push("Use an exact YouTube channel URL or creator handle URL.");
    return preview;
  }
  preview.canonicalUrl = channelId
    ? `https://www.youtube.com/channel/${channelId}`
    : `https://www.youtube.com/${handle}`;
  preview.canonicalProviderId = channelId;
  preview.host = "www.youtube.com";
  preview.displayLabel = channelId ?? handle;
  preview.networkPolicy.exactHostAllowlist = ["www.googleapis.com", "www.youtube.com"];
  preview.valid = true;
  preview.activatable = Boolean(channelId);
  preview.warnings.push(
    channelId
      ? "Phase 2 may retrieve public channel and video metadata only; captions remain unavailable without owner authorization."
      : "Activation waits for the YouTube adapter to resolve this handle to a stable channel ID.",
  );
  return preview;
}

export function previewResearchSource(input: {
  kind: ResearchSourceKind;
  locator: string;
}): ResearchSourceValidationPreview {
  if (input.locator.trim().length > 2_048) {
    const preview = basePreview(input.kind);
    preview.errors.push("Source locators cannot exceed 2,048 characters.");
    return preview;
  }
  if (!input.locator.trim()) {
    const preview = basePreview(input.kind);
    preview.errors.push("A source locator is required.");
    return preview;
  }
  if (input.kind === "WEBSITE" || input.kind === "RSS_ATOM") {
    return validateWebsiteSource(input.kind, input.locator);
  }
  if (input.kind === "X_USER") return validateXSource(input.locator);
  return validateYoutubeSource(input.locator);
}

export function researchSourceActivationIssues(source: ResearchSourceActivationInput): string[] {
  const issues: string[] = [];
  if (source.state !== "VERIFIED" && source.state !== "PAUSED") issues.push("source-not-verified");
  if (source.validationStatus !== "PASSED") issues.push("source-validation-not-passed");
  if (!source.canonicalUrl?.trim() || !source.canonicalProviderId?.trim()) issues.push("canonical-identity-missing");
  if (!source.schedule?.cadence || !source.schedule.timezone?.trim()) issues.push("schedule-missing");
  if (!Number.isInteger(source.freshnessTargetMinutes) || (source.freshnessTargetMinutes ?? 0) < 15) issues.push("freshness-target-invalid");
  if (!Number.isInteger(source.maxItemsPerRun) || (source.maxItemsPerRun ?? 0) < 1 || (source.maxItemsPerRun ?? 0) > 100) issues.push("item-cap-invalid");
  if (!Number.isFinite(source.monthlyCostCeilingUsd) || (source.monthlyCostCeilingUsd ?? -1) < 0) issues.push("spend-cap-invalid");
  if (!Number.isInteger(source.retentionDays) || (source.retentionDays ?? 0) < 1 || (source.retentionDays ?? 0) > 3_650) issues.push("retention-invalid");
  if (!source.allowedContentClasses?.length) issues.push("content-class-missing");
  if (!source.exclusions?.some((item) => item.trim())) issues.push("exclusions-missing");
  if (source.policyReviewState !== "APPROVED" || !source.policyVersion?.trim()) issues.push("policy-acknowledgement-missing");
  if (source.lastError?.trim() || (source.consecutiveFailureCount ?? 0) > 0) issues.push("source-exception-unresolved");
  return issues;
}

const ALLOWED_TRANSITIONS: Record<ResearchSourceState, ResearchSourceState[]> = {
  DRAFT: ["VERIFIED", "RETIRED"],
  VERIFIED: ["ACTIVE", "DRAFT", "RETIRED"],
  ACTIVE: ["PAUSED", "DEGRADED", "REVOKED"],
  PAUSED: ["ACTIVE", "DEGRADED", "REVOKED", "RETIRED"],
  DEGRADED: ["PAUSED", "REVOKED", "RETIRED"],
  REVOKED: ["RETIRED"],
  RETIRED: [],
};

export function researchSourceTransitionIssue(from: ResearchSourceState, to: ResearchSourceState): string | null {
  return ALLOWED_TRANSITIONS[from].includes(to)
    ? null
    : `Research source transition ${from} -> ${to} is not permitted.`;
}

export function researchSourceWorkspaceIssue(sourceProjectId: string, requestedProjectId: string): string | null {
  return sourceProjectId === requestedProjectId ? null : "Research source is unavailable or unauthorized.";
}
