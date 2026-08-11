# Research Adapters

Read-only provider adapters for the Software Factory Research Lab.

The package boundary is deliberately narrow: validate an already-approved
source, discover bounded provider items, normalize minimum-necessary evidence,
and emit typed receipts. Adapters cannot persist records, create work, invoke a
model, send a message, or modify a repository.

## Web/RSS V1 contract

`WebRssAdapter` supports RSS 2.0 and Atom feeds on one exact, operator-approved
HTTPS host. It:

- resolves the host before every request and rejects any private, local,
  reserved, or documentation address;
- pins the validated public IP while preserving TLS hostname verification, so
  DNS rebinding cannot redirect the connection after validation;
- requests and enforces `robots.txt` before the feed;
- follows only bounded manual redirects that remain on the exact approved host;
- limits request time, redirect count, response size, media type, and items;
- uses ETag and Last-Modified checkpoints;
- deduplicates by provider ID and normalized content hash;
- records changed items as superseding the prior hash;
- strips active markup and quarantines instruction-like or encoded payloads;
  and
- stores no credentials or raw provider response.

The injectable transport and DNS resolver are deterministic test seams. Live
callers should use the default IP-pinned HTTPS transport.

## Deliberate exclusions

This package does not infer deletion from an item disappearing from a rolling
feed, because absence is not proof of deletion. It does not fetch arbitrary HTML,
X posts, YouTube captions, authenticated sources, or off-host item links. Those
capabilities require separate policy and evidence gates.

## Validation

```bash
pnpm --filter @mission-control/research-adapters test
pnpm --filter @mission-control/research-adapters typecheck
```
