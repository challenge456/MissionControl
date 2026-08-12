---
status: complete
priority: p1
issue_id: "031"
tags: [software-factory, research-lab, continuous-learning, rss, security]
dependencies: ["030"]
---

# Bounded Web/RSS Research Adapter Core

## Problem Statement

The Research Watchlist now records exact source authority, but Mission Control
has no deterministic adapter that can retrieve an approved public feed without
exposing the factory to SSRF, redirect escape, unbounded responses, provider
errors, prompt injection, or duplicate observations.

## Scope

Build the Phase 2 Web/RSS adapter core as a standalone read-only package. This
slice does not persist observations, schedule runs, create Tasks, invoke models,
send messages, or change repositories. Persistence and manual-run wiring follow
only after this adapter contract passes its complete failure fixture matrix.

## Acceptance Criteria

- [x] Define the adapter contract, cursor, discovery page, item reference,
  normalized observation, health receipt, and typed failure model.
- [x] Require an exact HTTPS host allowlist and revalidate public DNS before
  every robots, feed, and redirect request.
- [x] Enforce robots policy, manual redirects, request timeout, response byte
  limits, supported feed media types, and a clear Mission Control user agent.
- [x] Parse bounded RSS 2.0 and Atom feeds without executing active content.
- [x] Normalize only a minimum necessary excerpt, strip markup, hash content,
  and quarantine instruction-like or encoded payloads as untrusted data.
- [x] Support ETag/Last-Modified checkpoints, provider-ID/content-hash
  deduplication, changed-item supersession, and bounded item counts.
- [x] Contract fixtures cover 200, 304, 401/403, 404, 429, 5xx, malformed XML,
  oversized responses, redirect escape, robots denial, and partial pagination.
- [x] Package tests, typecheck, repository typecheck, and production build pass.

## Work Log

### 2026-08-11 - Started

**By:** Codex

- Published Phase 1 source authority as stacked draft PR #65.
- Started the adapter as a capability-isolated package with injected network
  dependencies so every safety and recovery branch is deterministic in tests.

### 2026-08-11 - Completed

**By:** Codex

- Implemented a default IP-pinned HTTPS transport with TLS hostname validation
  to close the DNS-rebinding gap after public-address resolution.
- Implemented bounded robots enforcement, RSS/Atom parsing, untrusted-content
  normalization/quarantine, conditional checkpoints, deduplication, and changed
  item lineage.
- Passed 17 deterministic contract tests, package and repository typechecks,
  and the full production build.
- Proved the real IP-pinned transport against the approved public OpenAI feed:
  robots plus feed returned `200`, 683,292 bytes stayed under the 1 MB cap, and
  three bounded items normalized without persistence or downstream action.
- Audited production dependencies. No advisory path uses the new adapter or
  `saxes`; 12 existing high-severity workspace advisories are documented as a
  separate compatibility-tested remediation task.

**Outcome:**

- The read-only adapter core is ready for the next manual-run persistence slice.
  It still cannot persist, schedule, dispatch, invoke models, or change code.

## Notes

- Do not add a scheduler, UI Run button, Convex write, model call, or provider
  credential in this todo.
- Do not fetch X posts or YouTube captions in this todo.
- Treat all retrieved text as untrusted data, never instructions.
