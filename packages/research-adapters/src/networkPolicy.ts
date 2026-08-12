import { isIP } from "node:net";
import { lookup as nodeLookup } from "node:dns/promises";
import { request as httpsRequest } from "node:https";
import { Readable } from "node:stream";
import { ResearchAdapterError, type SourceLocator, type SourceValidation } from "./types.js";

export type AddressRecord = { address: string; family: number };
export type LookupAddress = (
  hostname: string,
  options: { all: true; verbatim: true },
) => Promise<AddressRecord[]>;
export type PinnedTransport = (
  url: URL,
  init: RequestInit,
  addresses: AddressRecord[],
  timeoutMs: number,
) => Promise<Response>;

export interface NetworkPolicyOptions {
  /** Test seam. Production callers should use the default IP-pinned HTTPS transport. */
  transport?: PinnedTransport;
  lookupAddress?: LookupAddress;
  timeoutMs?: number;
  maxRedirects?: number;
  userAgent?: string;
}

export interface GuardedResponse {
  response: Response;
  finalUrl: string;
  requestCount: number;
}

function invalidSource(message: string): never {
  throw new ResearchAdapterError("INVALID_SOURCE", message, false);
}

function parseIpv4(address: string): number[] | null {
  const pieces = address.split(".");
  if (pieces.length !== 4) return null;
  const octets = pieces.map((piece) => Number(piece));
  return octets.every((octet) => Number.isInteger(octet) && octet >= 0 && octet <= 255)
    ? octets
    : null;
}

function isPrivateIpv4(address: string): boolean {
  const value = parseIpv4(address);
  if (!value) return true;
  const [a, b, c] = value;
  return (
    a === 0
    || a === 10
    || a === 127
    || (a === 100 && b >= 64 && b <= 127)
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 0 && c === 0)
    || (a === 192 && b === 0 && c === 2)
    || (a === 192 && b === 88 && c === 99)
    || (a === 192 && b === 168)
    || (a === 198 && (b === 18 || b === 19))
    || (a === 198 && b === 51 && c === 100)
    || (a === 203 && b === 0 && c === 113)
    || a >= 224
  );
}

function ipv6Bytes(address: string): number[] | null {
  let normalized = address.toLowerCase().split("%")[0];
  const ipv4Tail = normalized.match(/(?:^|:)(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  if (ipv4Tail) {
    const octets = parseIpv4(ipv4Tail);
    if (!octets) return null;
    const high = ((octets[0] << 8) | octets[1]).toString(16);
    const low = ((octets[2] << 8) | octets[3]).toString(16);
    normalized = `${normalized.slice(0, normalized.length - ipv4Tail.length)}${high}:${low}`;
  }
  const halves = normalized.split("::");
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves[1] ? halves[1].split(":") : [];
  const missing = 8 - left.length - right.length;
  if ((halves.length === 1 && missing !== 0) || missing < 0) return null;
  const groups = halves.length === 2
    ? [...left, ...Array(missing).fill("0"), ...right]
    : left;
  if (groups.length !== 8) return null;
  const words = groups.map((group) => Number.parseInt(group, 16));
  if (words.some((word, index) => !/^[0-9a-f]{1,4}$/.test(groups[index]) || word < 0 || word > 0xffff)) {
    return null;
  }
  return words.flatMap((word) => [word >> 8, word & 0xff]);
}

function isPrivateIpv6(address: string): boolean {
  const bytes = ipv6Bytes(address);
  if (!bytes) return true;
  const isUnspecified = bytes.every((byte) => byte === 0);
  const isLoopback = bytes.slice(0, 15).every((byte) => byte === 0) && bytes[15] === 1;
  const isUniqueLocal = (bytes[0] & 0xfe) === 0xfc;
  const isLinkLocal = bytes[0] === 0xfe && (bytes[1] & 0xc0) === 0x80;
  const isMulticast = bytes[0] === 0xff;
  const isDocumentation = bytes[0] === 0x20 && bytes[1] === 0x01 && bytes[2] === 0x0d && bytes[3] === 0xb8;
  const isDiscardOnly = bytes[0] === 0x01 && bytes.slice(1, 8).every((byte) => byte === 0);
  const isIpv4Mapped = bytes.slice(0, 10).every((byte) => byte === 0) && bytes[10] === 0xff && bytes[11] === 0xff;
  if (isIpv4Mapped) return isPrivateIpv4(bytes.slice(12).join("."));
  return isUnspecified || isLoopback || isUniqueLocal || isLinkLocal || isMulticast || isDocumentation || isDiscardOnly;
}

export function isPublicAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return !isPrivateIpv4(address);
  if (family === 6) return !isPrivateIpv6(address);
  return false;
}

function normalizeAllowlist(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean))];
}

export function validateExactHttpsSource(input: SourceLocator): SourceValidation {
  const issues: string[] = [];
  let parsed: URL | undefined;
  try {
    parsed = new URL(input.canonicalUrl);
  } catch {
    issues.push("Source URL is malformed.");
  }
  const allowlist = normalizeAllowlist(input.exactHostAllowlist);
  if (allowlist.length !== 1) issues.push("Exactly one approved source host is required.");
  if (parsed) {
    if (parsed.protocol !== "https:") issues.push("Only HTTPS sources are supported.");
    if (parsed.username || parsed.password) issues.push("Source URLs cannot contain credentials.");
    if (parsed.port && parsed.port !== "443") issues.push("Only the standard HTTPS port is allowed.");
    if (allowlist.length === 1 && parsed.hostname.toLowerCase() !== allowlist[0]) {
      issues.push("Source host does not match the exact approved host.");
    }
    if (isIP(parsed.hostname)) {
      issues.push("Literal IP sources are not supported; approve an exact public DNS host.");
    }
  }
  return {
    valid: issues.length === 0,
    canonicalUrl: issues.length === 0 ? parsed?.toString() : undefined,
    exactHostAllowlist: allowlist,
    issues,
  };
}

async function requirePublicDns(hostname: string, lookupAddress: LookupAddress): Promise<AddressRecord[]> {
  let addresses: AddressRecord[];
  try {
    addresses = await lookupAddress(hostname, { all: true, verbatim: true });
  } catch {
    throw new ResearchAdapterError("DNS_UNAVAILABLE", "The approved source host could not be resolved.", true);
  }
  if (addresses.length === 0) {
    throw new ResearchAdapterError("DNS_UNAVAILABLE", "The approved source host returned no addresses.", true);
  }
  if (addresses.some(({ address }) => !isPublicAddress(address))) {
    throw new ResearchAdapterError(
      "PRIVATE_NETWORK_TARGET",
      "The approved source resolved to a private, local, reserved, or documentation address.",
      false,
    );
  }
  return addresses;
}

function assertRequestUrl(url: URL, allowlist: string[]) {
  if (url.protocol !== "https:" || (url.port && url.port !== "443") || url.username || url.password) {
    invalidSource("Every adapter request must use credential-free HTTPS on the standard port.");
  }
  if (!allowlist.includes(url.hostname.toLowerCase())) {
    throw new ResearchAdapterError(
      "REDIRECT_OUTSIDE_ALLOWLIST",
      "The provider redirected outside the exact approved host allowlist.",
      false,
    );
  }
}

function timeoutSignal(timeoutMs: number): AbortSignal {
  return AbortSignal.timeout(timeoutMs);
}

async function pinnedHttpsTransport(
  url: URL,
  init: RequestInit,
  addresses: AddressRecord[],
  timeoutMs: number,
): Promise<Response> {
  const address = addresses[0];
  if (!address) {
    throw new ResearchAdapterError("DNS_UNAVAILABLE", "The approved source host returned no addresses.", true);
  }
  const method = (init.method ?? "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD") {
    throw new ResearchAdapterError("INVALID_SOURCE", "Research adapters support read-only GET and HEAD requests only.", false);
  }
  const headers: Record<string, string> = {};
  new Headers(init.headers).forEach((value, name) => {
    headers[name] = value;
  });
  return await new Promise<Response>((resolve, reject) => {
    const signal = timeoutSignal(timeoutMs);
    const request = httpsRequest({
      protocol: "https:",
      hostname: address.address,
      family: address.family,
      port: 443,
      path: `${url.pathname}${url.search}`,
      method,
      headers: { ...headers, host: url.host },
      servername: url.hostname,
      rejectUnauthorized: true,
      signal,
      agent: false,
    }, (incoming) => {
      const responseHeaders = new Headers();
      for (const [name, value] of Object.entries(incoming.headers)) {
        if (Array.isArray(value)) {
          for (const item of value) responseHeaders.append(name, item);
        } else if (value !== undefined) {
          responseHeaders.set(name, value);
        }
      }
      const status = incoming.statusCode ?? 502;
      const hasNoBody = method === "HEAD" || status === 204 || status === 205 || status === 304;
      resolve(new Response(hasNoBody ? null : Readable.toWeb(incoming) as ReadableStream<Uint8Array>, {
        status,
        statusText: incoming.statusMessage,
        headers: responseHeaders,
      }));
    });
    request.on("error", reject);
    request.end();
  });
}

export async function guardedFetch(
  initialUrl: string,
  source: SourceLocator,
  init: RequestInit,
  options: NetworkPolicyOptions = {},
): Promise<GuardedResponse> {
  const validation = validateExactHttpsSource(source);
  if (!validation.valid) invalidSource(validation.issues.join(" "));
  const allowlist = validation.exactHostAllowlist;
  const transport = options.transport ?? pinnedHttpsTransport;
  const lookupAddress = options.lookupAddress ?? nodeLookup;
  const timeoutMs = Math.min(Math.max(options.timeoutMs ?? 10_000, 250), 30_000);
  const maxRedirects = Math.min(Math.max(options.maxRedirects ?? 2, 0), 5);
  const userAgent = options.userAgent ?? "MissionControlResearchBot/1.0 (+https://github.com/jaydubya818/MissionControl)";
  let currentUrl = new URL(initialUrl);
  let requestCount = 0;

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
    assertRequestUrl(currentUrl, allowlist);
    const addresses = await requirePublicDns(currentUrl.hostname, lookupAddress);
    requestCount += 1;
    let response: Response;
    try {
      response = await transport(currentUrl, {
        ...init,
        redirect: "manual",
        headers: {
          Accept: "application/atom+xml, application/rss+xml, application/xml, text/xml;q=0.9, text/plain;q=0.2",
          "User-Agent": userAgent,
          ...init.headers,
        },
      }, addresses, timeoutMs);
    } catch (error) {
      if (error instanceof ResearchAdapterError) throw error;
      if (error instanceof DOMException && (error.name === "TimeoutError" || error.name === "AbortError")) {
        throw new ResearchAdapterError("REQUEST_TIMEOUT", "The provider request exceeded its time limit.", true);
      }
      throw new ResearchAdapterError("PROVIDER_UNAVAILABLE", "The provider request failed before a response was received.", true);
    }

    const isRedirect = [301, 302, 303, 307, 308].includes(response.status);
    if (!isRedirect) {
      return { response, finalUrl: currentUrl.toString(), requestCount };
    }
    const location = response.headers.get("location");
    if (!location) {
      throw new ResearchAdapterError("MALFORMED_PAYLOAD", "Provider redirect omitted its destination.", false);
    }
    if (redirectCount === maxRedirects) {
      throw new ResearchAdapterError("TOO_MANY_REDIRECTS", "Provider exceeded the redirect limit.", false);
    }
    currentUrl = new URL(location, currentUrl);
  }
  throw new ResearchAdapterError("TOO_MANY_REDIRECTS", "Provider exceeded the redirect limit.", false);
}
