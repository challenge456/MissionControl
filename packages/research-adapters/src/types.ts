export type ResearchAdapterFailureCode =
  | "INVALID_SOURCE"
  | "PRIVATE_NETWORK_TARGET"
  | "DNS_UNAVAILABLE"
  | "ROBOTS_UNAVAILABLE"
  | "ROBOTS_DENIED"
  | "REDIRECT_OUTSIDE_ALLOWLIST"
  | "TOO_MANY_REDIRECTS"
  | "REQUEST_TIMEOUT"
  | "PERMISSION_DENIED"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "PROVIDER_UNAVAILABLE"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "OVERSIZED_RESPONSE"
  | "MALFORMED_PAYLOAD";

export class ResearchAdapterError extends Error {
  constructor(
    public readonly code: ResearchAdapterFailureCode,
    message: string,
    public readonly retryable: boolean,
    public readonly retryAfterMs?: number,
  ) {
    super(message);
    this.name = "ResearchAdapterError";
  }
}

export interface SourceLocator {
  canonicalUrl: string;
  exactHostAllowlist: string[];
}

export interface SourceValidation {
  valid: boolean;
  canonicalUrl?: string;
  exactHostAllowlist: string[];
  issues: string[];
}

export interface DiscoveryCursor {
  etag?: string;
  lastModified?: string;
  providerCursor?: string;
  knownItems?: Record<string, string>;
}

export interface DiscoveryInput {
  source: SourceLocator;
  cursor?: DiscoveryCursor;
  maxItems: number;
}

export interface ProviderItemRef {
  providerItemId: string;
  canonicalUrl: string;
  title: string;
  author?: string;
  publishedAt?: number;
  normalizedExcerpt: string;
  contentHash: string;
  contentType: "FEED_ENTRY";
  language?: string;
  priorContentHash?: string;
  quarantineReasons: string[];
}

export interface AdapterReceipt {
  adapterName: string;
  adapterVersion: string;
  sourceUrl: string;
  finalUrl: string;
  statusCode: number;
  requestCount: number;
  bytesRead: number;
  elapsedMs: number;
  etag?: string;
  lastModified?: string;
  itemCount: number;
  duplicateCount: number;
  changedItemCount: number;
  notModified: boolean;
}

export interface DiscoveryPage {
  items: ProviderItemRef[];
  nextCursor: DiscoveryCursor;
  receipt: AdapterReceipt;
}

export interface NormalizedObservation {
  providerItemId: string;
  canonicalUrl: string;
  title: string;
  author?: string;
  publishedAt?: number;
  retrievedAt: number;
  normalizedExcerpt: string;
  contentHash: string;
  adapterName: string;
  adapterVersion: string;
  language?: string;
  contentType: "FEED_ENTRY";
  safetyScanResult: "PASSED" | "QUARANTINED";
  detectedInstructionLikeContent: boolean;
  quarantineReasons: string[];
  priorContentHash?: string;
}

export interface AdapterHealth {
  status: "READY" | "DEGRADED";
  adapterName: string;
  adapterVersion: string;
  capabilities: string[];
  checkedAt: number;
}

export interface ResearchSourceAdapter {
  validateSource(input: SourceLocator): Promise<SourceValidation>;
  discover(input: DiscoveryInput): Promise<DiscoveryPage>;
  fetchItem(input: ProviderItemRef): Promise<NormalizedObservation>;
  health(): Promise<AdapterHealth>;
}
