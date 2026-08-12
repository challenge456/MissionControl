# Governed Continuous Learning

## Purpose

Mission Control's Software Factory is a governed recursive self-improvement
(RSI) and continuous-learning system. It can research operator-approved
evidence, verify claims, recommend changes, implement approved work, validate
the result, measure the outcome, and propose the next bounded iteration.

External content is evidence, not authority. A source cannot approve a change,
change factory policy, dispatch implementation work, or write to a repository.
All material changes continue through the canonical hierarchy:

`Mission -> WorkOrder -> Task -> Attempt -> evidence -> pull request -> release`

## Current production boundary

Phase 1 provides source authority only. The Research Watchlist can create,
preview, validate, approve, activate, pause, resume, and retire a source record.
It does **not** poll a provider, fetch a page, run a schedule, create a research
Task, or ingest content.

This separation is deliberate. Continuous scheduling stays off until provider
adapters can prove DNS and redirect safety, content provenance, prompt-injection
quarantine, checkpoints, retry recovery, budget enforcement, and independent
verification.

## Source authority contract

Every `researchSource` belongs to exactly one tenant and workspace. It records:

- an exact kind and operator-entered locator;
- a canonical URL and stable provider identity after validation;
- an owner and immutable source version;
- the named adapter, adapter version, and authentication mode;
- cadence, timezone, freshness target, item cap, monthly spend ceiling, and
  retention period;
- allowed content classes and explicit exclusions;
- provider cursor and cache metadata reserved for a later adapter;
- validation, policy review, failure, retry, and deletion-request state;
- created/updated actor and timestamps; and
- a mutation idempotency key.

The registry stores no credentials, access tokens, fetched pages, captions, or
raw copyrighted content. Future adapters may reference secrets through the
platform secret store; they must never copy secret values into source records,
events, logs, or artifacts.

`researchObservations` defines the future provenance boundary. An observation
must link the source, workflow run, and retained run artifact; preserve provider
item identity and content hash; record trust, safety, extraction, verification,
rights, sensitivity, and retention decisions; and support deduplication and
purge indexes. Phase 1 does not write observation rows.

## Lifecycle

| State | Meaning | Allowed next action |
| --- | --- | --- |
| Draft | Locator and policy envelope exist; no authority granted | Validate or retire |
| Verified | Deterministic validation produced an activatable canonical identity | Approve policy, activate, revalidate, or retire |
| Active | The exact source is authorized within its recorded limits | Pause or degrade/revoke through a trusted control |
| Paused | Authority is intentionally stopped | Resume if all gates still pass, degrade, revoke, or retire |
| Degraded | A credential, provider, or policy exception quarantined authority | Pause for review, revoke, or retire |
| Revoked | Authority was withdrawn by a trusted control | Retire |
| Retired | Terminal audit state | None |

Lifecycle mutations and their event insertions share one Convex transaction.
Every event records tenant, workspace, source, source version, actor, reason,
policy version, state transition, timestamp, and an idempotency key.

## Operator flow

The Watchlist lives inside **Intelligence -> Loop Engineering**. It is not a
new primary navigation domain.

1. Select **Add source**.
2. Choose RSS/Atom, website, X creator, or YouTube channel.
3. Enter the exact public locator and inspect the canonical-target preview.
4. Set cadence, timezone, freshness, item, spend, retention, allowed-content,
   and exclusion limits.
5. Create the governed draft. No network request is made.
6. Validate the source. Public website and feed URLs can become `VERIFIED` in
   Phase 1. X handles and YouTube handles remain drafts until a provider adapter
   resolves a stable provider ID. An exact YouTube channel-ID URL may verify.
7. A role with `factory.automation.manage` explicitly approves the policy.
8. Activate the authority, or pause/retire it. Activation still does not start
   collection in Phase 1.
9. Select the source name to inspect its immutable decision history.

## Authorization and tenant isolation

Every public query and mutation calls the existing workspace permission
boundary before reading or changing source data:

- `factory.read` lists, previews, reads, and audits;
- `factory.improve` creates and validates drafts or records a deletion request;
- `factory.automation.manage` approves, activates, pauses, resumes, and retires.

Source reads then compare the stored workspace ID with the requested workspace
ID. Mismatches return one generic unavailable-or-unauthorized error. Browser
actor labels never determine authority or audit attribution.

Internal credential and policy-drift controls are not public mutations. They
move active or paused authority to `DEGRADED`, retain the exception, increment
the failure counter, and prevent resume while an exception is unresolved.

## Network and provider safety

Phase 1 preview is deterministic and performs no network request. It rejects:

- non-HTTPS URLs;
- embedded credentials or secret-like query parameters;
- non-standard ports;
- localhost, local/private suffixes, and IPv4/IPv6 loopback, private,
  link-local, documentation, reserved, multicast, and non-routable literals;
- malformed or unsupported X and YouTube locator shapes.

The preview records an exact host allowlist and marks DNS resolution and
redirect validation as mandatory at fetch time. A later adapter must resolve
every DNS answer, reject private/reserved destinations, pin the approved public
destination for the request, limit response size and duration, re-check every
redirect against the allowlist, honor provider policy and robots rules, and
fail closed on any ambiguity.

## Deliberate exclusions

- No continuous timer or provider polling.
- No source self-approval.
- No repository writes or automatic implementation.
- No provider credentials in source data.
- No unverified X/YouTube handle activation.
- No raw fetched-content store.
- No learning claim without cited, retained, independently reviewed evidence.

## Next safe phase

Phase 2 begins with the read-only
[`@mission-control/research-adapters`](../../packages/research-adapters/README.md)
Web/RSS core. Its contract and failure matrix are implemented without granting
persistence, scheduling, Task creation, model, messaging, or repository-write
authority.

The next gate is manual-run persistence: one bounded run must produce
provenance-linked observations and a retained artifact, atomically checkpoint
the cursor only after evidence is durable, quarantine instruction-like content,
survive retry, and remain unable to dispatch or modify repository work.
Scheduling remains off until that run is independently verified.

See the [Loop Engineering contract](LOOP_ENGINEERING.md) and the
[governed continuous-learning implementation plan](../plans/2026-08-08-feat-governed-continuous-learning-plan.md).
