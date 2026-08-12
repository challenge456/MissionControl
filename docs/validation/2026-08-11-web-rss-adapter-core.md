# Web/RSS Adapter Core — Phase 2A Validation

Date: 2026-08-11

## Scope

This evidence covers the capability-isolated Web/RSS adapter core. It does not
cover Convex persistence, manual dispatch, scheduling, provider credentials,
claim extraction, recommendations, or repository-changing work. All remain off.

## Security contract

- One exact HTTPS DNS host is required; literal IP source URLs are rejected.
- Every request resolves the host again and rejects any private, local,
  reserved, multicast, link-local, documentation, or mapped-private address.
- The default HTTPS transport connects to the validated public IP and verifies
  TLS against the approved hostname, closing the DNS-rebinding gap.
- Redirects are manual, bounded, and cannot leave the exact host allowlist.
- Robots policy fails closed on denial, permission error, rate limit, or 5xx.
- Feed responses are bounded by timeout, byte size, media type, redirect count,
  request count, parser item count, and operator item cap.
- XML document types and custom entities are rejected.
- Active markup is stripped. Instruction-like and encoded payloads are retained
  only as quarantined data; they are never executed.

## Data integrity contract

- RSS 2.0 and Atom entries normalize to a typed provider item and observation.
- ETag and Last-Modified checkpoints support clean `304` runs.
- Provider IDs and normalized content hashes prevent duplicate emission.
- A changed item with the same provider ID carries its prior hash so downstream
  persistence can preserve supersession rather than rewrite history.
- Partial pages update only emitted or proven-duplicate items, so an item cap
  cannot silently skip unseen entries.
- Missing entries are not labeled deleted because rolling-feed absence is not
  proof of deletion.

## Automated evidence

```bash
pnpm --filter @mission-control/research-adapters test
pnpm --filter @mission-control/research-adapters typecheck
pnpm run typecheck
pnpm run build
```

The deterministic fixture suite covers successful RSS and Atom discovery,
partial pagination, provider-ID and content-hash deduplication, changed-item
supersession, private DNS, `304`, `401`, `403`, `404`, `429`, `500`, `503`,
robots denial/unavailability, request timeout, malformed XML, unsupported media,
oversized responses, and redirect escape.

## Live read-only canary

The package's default IP-pinned transport successfully read
`https://openai.com/news/rss.xml` without persistence or downstream action:

- final status: `200` on the exact approved `openai.com` host;
- request count: `2` (`robots.txt` plus feed);
- response bytes: `683,292`, below the configured `1,000,000`-byte cap;
- bounded output: `3` normalized items;
- duplicates/changed items: `0` / `0`; and
- quarantine findings: none for the three bounded items.

## Dependency audit

`pnpm audit --prod --audit-level high` reports 12 existing high-severity
workspace advisories through `@hono/node-server`, `form-data`, `hono`, `lodash`,
`nanoid`, `postcss`, `rollup`, `vite`, and `ws`. The JSON audit contains no
advisory path through `@mission-control/research-adapters` or `saxes`. These
pre-existing upgrades require a separate compatibility-tested dependency task;
the adapter PR does not hide or broaden that unrelated blast radius.
