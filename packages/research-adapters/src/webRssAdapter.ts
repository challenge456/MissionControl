import { createHash } from "node:crypto";
import { SaxesParser, type SaxesTagNS } from "saxes";
import { guardedFetch, validateExactHttpsSource, type NetworkPolicyOptions } from "./networkPolicy.js";
import {
  ResearchAdapterError,
  type AdapterHealth,
  type AdapterReceipt,
  type DiscoveryCursor,
  type DiscoveryInput,
  type DiscoveryPage,
  type NormalizedObservation,
  type ProviderItemRef,
  type ResearchSourceAdapter,
  type SourceLocator,
  type SourceValidation,
} from "./types.js";

export const WEB_RSS_ADAPTER_NAME = "mission-control-web-rss";
export const WEB_RSS_ADAPTER_VERSION = "1.0.0";

interface RawFeedItem {
  id?: string;
  title?: string;
  link?: string;
  author?: string;
  published?: string;
  content?: string;
  language?: string;
}

export interface WebRssAdapterOptions extends NetworkPolicyOptions {
  maxResponseBytes?: number;
  maxRobotsBytes?: number;
  now?: () => number;
}

const FEED_MEDIA_TYPES = new Set([
  "application/atom+xml",
  "application/rss+xml",
  "application/xml",
  "text/xml",
]);

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function decodeCodePoint(value: string, radix: number): string {
  const codePoint = Number.parseInt(value, radix);
  return Number.isInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff
    ? String.fromCodePoint(codePoint)
    : "�";
}

function cleanText(value: string, maxLength: number): string {
  const withoutActiveContent = value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  const decoded = withoutActiveContent
    .replace(/&#(\d+);/g, (_, code) => decodeCodePoint(code, 10))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => decodeCodePoint(code, 16))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'");
  return decoded.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function quarantineReasons(raw: string, canonicalUrl: URL, allowlist: string[]): string[] {
  const reasons: string[] = [];
  if (/<(?:script|iframe|object|embed|form|input)\b/i.test(raw)
    || /&lt;(?:script|iframe|object|embed|form|input)\b/i.test(raw)) {
    reasons.push("ACTIVE_MARKUP_REMOVED");
  }
  if (/\b(ignore|disregard|override)\b.{0,80}\b(previous|prior|system|developer|instructions?)\b/is.test(raw)) {
    reasons.push("INSTRUCTION_LIKE_CONTENT");
  }
  if (/\b(system prompt|developer message|tool call|execute (?:this|the) command|reveal (?:your|the) secret)\b/i.test(raw)) {
    reasons.push("INSTRUCTION_LIKE_CONTENT");
  }
  if (/(?:[A-Za-z0-9+/]{160,}={0,2})/.test(raw) || /data:[^;,]+;base64,/i.test(raw)) {
    reasons.push("ENCODED_PAYLOAD");
  }
  if (canonicalUrl.protocol !== "https:"
    || canonicalUrl.username
    || canonicalUrl.password
    || (canonicalUrl.port && canonicalUrl.port !== "443")
    || !allowlist.includes(canonicalUrl.hostname.toLowerCase())) {
    reasons.push("ITEM_HOST_OUTSIDE_ALLOWLIST");
  }
  return [...new Set(reasons)];
}

function parsePublishedAt(value?: string): number | undefined {
  if (!value) return undefined;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseFeed(xml: string): RawFeedItem[] {
  const parser = new SaxesParser({ xmlns: true });
  const items: RawFeedItem[] = [];
  let current: RawFeedItem | null = null;
  let itemDepth = 0;
  let currentField: keyof RawFeedItem | null = null;

  const fieldFor = (localName: string): keyof RawFeedItem | null => {
    const local = localName.toLowerCase();
    if (local === "guid" || local === "id") return "id";
    if (local === "title") return "title";
    if (local === "link") return "link";
    if (local === "author" || local === "creator" || local === "name") return "author";
    if (local === "pubdate" || local === "published" || local === "updated") return "published";
    if (local === "description" || local === "summary" || local === "content" || local === "encoded") return "content";
    if (local === "language") return "language";
    return null;
  };

  parser.on("doctype", () => {
    throw new ResearchAdapterError("MALFORMED_PAYLOAD", "Feed document types and custom entities are not allowed.", false);
  });
  parser.on("opentag", (tag: SaxesTagNS) => {
    const local = tag.local.toLowerCase();
    if (local === "item" || local === "entry") {
      if (current) {
        throw new ResearchAdapterError("MALFORMED_PAYLOAD", "Nested feed entries are not supported.", false);
      }
      current = {};
      itemDepth = 1;
      currentField = null;
      return;
    }
    if (!current) return;
    itemDepth += 1;
    currentField = fieldFor(local);
    if (local === "link") {
      const href = Object.values(tag.attributes).find((attribute) => attribute.local.toLowerCase() === "href")?.value;
      if (href) current.link = href;
    }
  });
  const appendText = (text: string) => {
    if (!current || !currentField) return;
    current[currentField] = `${current[currentField] ?? ""}${text}`;
  };
  parser.on("text", appendText);
  parser.on("cdata", appendText);
  parser.on("closetag", (tag: SaxesTagNS) => {
    if (!current) return;
    const local = tag.local.toLowerCase();
    if ((local === "item" || local === "entry") && itemDepth === 1) {
      items.push(current);
      current = null;
      itemDepth = 0;
      currentField = null;
      return;
    }
    itemDepth -= 1;
    currentField = null;
  });
  parser.on("error", () => {
    throw new ResearchAdapterError("MALFORMED_PAYLOAD", "The provider returned malformed RSS or Atom XML.", false);
  });

  try {
    parser.write(xml).close();
  } catch (error) {
    if (error instanceof ResearchAdapterError) throw error;
    throw new ResearchAdapterError("MALFORMED_PAYLOAD", "The provider returned malformed RSS or Atom XML.", false);
  }
  if (items.length === 0) {
    throw new ResearchAdapterError("MALFORMED_PAYLOAD", "The feed contains no RSS items or Atom entries.", false);
  }
  return items.slice(0, 500);
}

async function readBoundedText(response: Response, maxBytes: number): Promise<{ text: string; bytesRead: number }> {
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new ResearchAdapterError("OVERSIZED_RESPONSE", `Provider response exceeds the ${maxBytes}-byte limit.`, false);
  }
  if (!response.body) return { text: "", bytesRead: 0 };
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytesRead = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytesRead += value.byteLength;
      if (bytesRead > maxBytes) {
        await reader.cancel("Research adapter response limit exceeded.");
        throw new ResearchAdapterError("OVERSIZED_RESPONSE", `Provider response exceeds the ${maxBytes}-byte limit.`, false);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(bytesRead);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { text: new TextDecoder("utf-8", { fatal: false }).decode(body), bytesRead };
}

function retryAfterMs(response: Response): number | undefined {
  const value = response.headers.get("retry-after");
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.min(seconds * 1_000, 86_400_000);
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.min(Math.max(date - Date.now(), 0), 86_400_000) : undefined;
}

function requireSuccessfulProviderResponse(response: Response) {
  if (response.status === 401 || response.status === 403) {
    throw new ResearchAdapterError("PERMISSION_DENIED", "Provider denied access to the approved source.", false);
  }
  if (response.status === 404) {
    throw new ResearchAdapterError("NOT_FOUND", "The approved source no longer exists.", false);
  }
  if (response.status === 429) {
    throw new ResearchAdapterError("RATE_LIMITED", "Provider rate limit was reached.", true, retryAfterMs(response));
  }
  if (response.status >= 500) {
    throw new ResearchAdapterError("PROVIDER_UNAVAILABLE", "Provider is temporarily unavailable.", true);
  }
  if (response.status < 200 || response.status >= 300) {
    throw new ResearchAdapterError("PROVIDER_UNAVAILABLE", `Provider returned unsupported status ${response.status}.`, false);
  }
}

interface RobotsRule {
  allow: boolean;
  path: string;
}

function pathPattern(pattern: string): RegExp {
  const endAnchored = pattern.endsWith("$");
  const body = (endAnchored ? pattern.slice(0, -1) : pattern)
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");
  return new RegExp(`^${body}${endAnchored ? "$" : ""}`);
}

export function robotsAllows(robotsText: string, path: string, productToken = "missioncontrolresearchbot"): boolean {
  const groups: Array<{ agents: string[]; rules: RobotsRule[] }> = [];
  let group: { agents: string[]; rules: RobotsRule[] } | null = null;
  for (const rawLine of robotsText.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (key === "user-agent") {
      if (!group || group.rules.length > 0) {
        group = { agents: [], rules: [] };
        groups.push(group);
      }
      group.agents.push(value.toLowerCase());
    } else if (group && (key === "allow" || key === "disallow")) {
      if (value || key === "allow") group.rules.push({ allow: key === "allow", path: value });
    }
  }
  const exactGroups = groups.filter((candidate) => candidate.agents.some((agent) => productToken.startsWith(agent) && agent !== "*"));
  const matching = exactGroups.length > 0
    ? exactGroups
    : groups.filter((candidate) => candidate.agents.includes("*"));
  const matchedRules = matching
    .flatMap((candidate) => candidate.rules)
    .filter((rule) => rule.path === "" || pathPattern(rule.path).test(path))
    .sort((left, right) => right.path.length - left.path.length || Number(right.allow) - Number(left.allow));
  return matchedRules[0]?.allow ?? true;
}

function normalizeItem(raw: RawFeedItem, source: SourceLocator): ProviderItemRef {
  const title = cleanText(raw.title ?? "Untitled feed item", 300) || "Untitled feed item";
  const excerpt = cleanText(raw.content ?? "", 2_000);
  const baseUrl = new URL(source.canonicalUrl);
  let canonicalUrl: URL;
  try {
    canonicalUrl = new URL(raw.link || source.canonicalUrl, baseUrl);
  } catch {
    canonicalUrl = baseUrl;
  }
  const contentHash = sha256(JSON.stringify({ title, excerpt, url: canonicalUrl.toString(), published: raw.published ?? null }));
  const explicitProviderId = cleanText(raw.id ?? "", 500);
  const providerItemId = explicitProviderId
    || (raw.link ? canonicalUrl.toString() : `content:${contentHash}`);
  return {
    providerItemId,
    canonicalUrl: canonicalUrl.toString(),
    title,
    author: cleanText(raw.author ?? "", 300) || undefined,
    publishedAt: parsePublishedAt(raw.published),
    normalizedExcerpt: excerpt,
    contentHash,
    contentType: "FEED_ENTRY",
    language: cleanText(raw.language ?? "", 32) || undefined,
    quarantineReasons: quarantineReasons(`${raw.title ?? ""}\n${raw.content ?? ""}`, canonicalUrl, source.exactHostAllowlist),
  };
}

function boundedKnownItems(cursor?: DiscoveryCursor): Map<string, string> {
  return new Map(Object.entries(cursor?.knownItems ?? {}).slice(-500));
}

export class WebRssAdapter implements ResearchSourceAdapter {
  private readonly options: WebRssAdapterOptions;

  constructor(options: WebRssAdapterOptions = {}) {
    this.options = options;
  }

  async validateSource(input: SourceLocator): Promise<SourceValidation> {
    return validateExactHttpsSource(input);
  }

  async discover(input: DiscoveryInput): Promise<DiscoveryPage> {
    if (!Number.isInteger(input.maxItems) || input.maxItems < 1 || input.maxItems > 100) {
      throw new ResearchAdapterError("INVALID_SOURCE", "Discovery item cap must be between 1 and 100.", false);
    }
    const validation = validateExactHttpsSource(input.source);
    if (!validation.valid) {
      throw new ResearchAdapterError("INVALID_SOURCE", validation.issues.join(" "), false);
    }
    const approvedSource: SourceLocator = {
      canonicalUrl: validation.canonicalUrl!,
      exactHostAllowlist: validation.exactHostAllowlist,
    };
    const startedAt = (this.options.now ?? Date.now)();
    const sourceUrl = new URL(approvedSource.canonicalUrl);
    const robots = await guardedFetch(
      new URL("/robots.txt", sourceUrl).toString(),
      approvedSource,
      { method: "GET", headers: { Accept: "text/plain" } },
      this.options,
    );
    let requestCount = robots.requestCount;
    if (robots.response.status === 401 || robots.response.status === 403) {
      throw new ResearchAdapterError("ROBOTS_DENIED", "Provider does not permit robots policy access.", false);
    }
    if (robots.response.status === 429 || robots.response.status >= 500) {
      throw new ResearchAdapterError("ROBOTS_UNAVAILABLE", "Robots policy is temporarily unavailable; discovery failed closed.", true, retryAfterMs(robots.response));
    }
    if (robots.response.status !== 404) {
      requireSuccessfulProviderResponse(robots.response);
      const robotsBody = await readBoundedText(robots.response, Math.min(this.options.maxRobotsBytes ?? 256_000, 512_000));
      if (!robotsAllows(robotsBody.text, `${sourceUrl.pathname}${sourceUrl.search}`)) {
        throw new ResearchAdapterError("ROBOTS_DENIED", "Robots policy disallows the approved feed path.", false);
      }
    }

    const conditionalHeaders: Record<string, string> = {};
    if (input.cursor?.etag) conditionalHeaders["If-None-Match"] = input.cursor.etag;
    if (input.cursor?.lastModified) conditionalHeaders["If-Modified-Since"] = input.cursor.lastModified;
    const feed = await guardedFetch(
      sourceUrl.toString(),
      approvedSource,
      { method: "GET", headers: conditionalHeaders },
      this.options,
    );
    requestCount += feed.requestCount;
    const now = (this.options.now ?? Date.now)();
    const etag = feed.response.headers.get("etag") ?? input.cursor?.etag;
    const lastModified = feed.response.headers.get("last-modified") ?? input.cursor?.lastModified;
    if (feed.response.status === 304) {
      return {
        items: [],
        nextCursor: { ...input.cursor, etag, lastModified },
        receipt: this.receipt({
          sourceUrl: sourceUrl.toString(),
          finalUrl: feed.finalUrl,
          statusCode: 304,
          requestCount,
          bytesRead: 0,
          startedAt,
          endedAt: now,
          etag,
          lastModified,
          itemCount: 0,
          duplicateCount: 0,
          changedItemCount: 0,
          notModified: true,
        }),
      };
    }
    requireSuccessfulProviderResponse(feed.response);
    const mediaType = feed.response.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
    if (!mediaType || !FEED_MEDIA_TYPES.has(mediaType)) {
      throw new ResearchAdapterError("UNSUPPORTED_MEDIA_TYPE", "Provider response is not a supported RSS or Atom media type.", false);
    }
    const body = await readBoundedText(feed.response, Math.min(this.options.maxResponseBytes ?? 1_000_000, 5_000_000));
    const parsed = parseFeed(body.text).map((item) => normalizeItem(item, approvedSource));
    const knownItems = boundedKnownItems(input.cursor);
    const knownContentHashes = new Set(knownItems.values());
    const emitted: ProviderItemRef[] = [];
    let duplicateCount = 0;
    let changedItemCount = 0;
    let providerCursor = input.cursor?.providerCursor;
    for (const item of parsed) {
      if (emitted.length >= input.maxItems) break;
      const priorHash = knownItems.get(item.providerItemId);
      providerCursor = item.providerItemId;
      if (priorHash === item.contentHash) {
        duplicateCount += 1;
        continue;
      }
      if (!priorHash && knownContentHashes.has(item.contentHash)) {
        duplicateCount += 1;
        knownItems.set(item.providerItemId, item.contentHash);
        continue;
      }
      if (priorHash) {
        item.priorContentHash = priorHash;
        changedItemCount += 1;
      }
      emitted.push(item);
      knownItems.set(item.providerItemId, item.contentHash);
      knownContentHashes.add(item.contentHash);
    }
    const boundedEntries = [...knownItems.entries()].slice(-500);
    return {
      items: emitted,
      nextCursor: {
        etag,
        lastModified,
        providerCursor,
        knownItems: Object.fromEntries(boundedEntries),
      },
      receipt: this.receipt({
        sourceUrl: sourceUrl.toString(),
        finalUrl: feed.finalUrl,
        statusCode: feed.response.status,
        requestCount,
        bytesRead: body.bytesRead,
        startedAt,
        endedAt: now,
        etag,
        lastModified,
        itemCount: emitted.length,
        duplicateCount,
        changedItemCount,
        notModified: false,
      }),
    };
  }

  async fetchItem(input: ProviderItemRef): Promise<NormalizedObservation> {
    return {
      ...input,
      retrievedAt: (this.options.now ?? Date.now)(),
      adapterName: WEB_RSS_ADAPTER_NAME,
      adapterVersion: WEB_RSS_ADAPTER_VERSION,
      safetyScanResult: input.quarantineReasons.length > 0 ? "QUARANTINED" : "PASSED",
      detectedInstructionLikeContent: input.quarantineReasons.includes("INSTRUCTION_LIKE_CONTENT"),
    };
  }

  async health(): Promise<AdapterHealth> {
    return {
      status: "READY",
      adapterName: WEB_RSS_ADAPTER_NAME,
      adapterVersion: WEB_RSS_ADAPTER_VERSION,
      capabilities: [
        "RSS_2_0",
        "ATOM_1_0",
        "ROBOTS_POLICY",
        "ETAG_LAST_MODIFIED",
        "PUBLIC_DNS_ENFORCEMENT",
        "UNTRUSTED_CONTENT_QUARANTINE",
      ],
      checkedAt: (this.options.now ?? Date.now)(),
    };
  }

  private receipt(input: Omit<AdapterReceipt, "adapterName" | "adapterVersion" | "elapsedMs"> & { startedAt: number; endedAt: number }): AdapterReceipt {
    const { startedAt, endedAt, ...rest } = input;
    return {
      adapterName: WEB_RSS_ADAPTER_NAME,
      adapterVersion: WEB_RSS_ADAPTER_VERSION,
      elapsedMs: Math.max(endedAt - startedAt, 0),
      ...rest,
    };
  }
}
