---
status: complete
priority: p1
issue_id: "030"
tags: [software-factory, github-app, webhooks, ci, evidence, security]
dependencies: ["020", "024"]
---

# Authenticate GitHub Webhook CI Evidence Ingestion

## Problem Statement

GitHub App webhook deliveries are signature-verified and persisted, but the
evidence action performs a second GitHub API lookup with `GITHUB_TOKEN`. In the
live private repository proof that lookup returned 403 for `pull_request`
events. `check_run` events also supplied GitHub API-form pull-request URLs that
the ingester rejected because it accepted only browser-form URLs.

GitHub itself reported all checks passing on pull request #61, but Mission
Control could not ingest that CI evidence.

## Recommended Action

Normalize GitHub API and browser pull-request identities at the webhook boundary.
For any follow-up API lookup, mint a short-lived token from the exact bound
GitHub App installation and repository rather than using a personal or global
token. Keep installation tokens out of storage, logs, events, and error payloads.

## Acceptance Criteria

- [x] `pull_request` and `check_run` webhook payloads resolve to the same canonical repository/PR identity.
- [x] Private-repository follow-up reads use an ephemeral token from the bound GitHub App installation.
- [x] No personal/global `GITHUB_TOKEN` is required for Factory webhook ingestion.
- [x] The installation token is never persisted or logged.
- [x] Duplicate deliveries are idempotent and preserve the original delivery record.
- [x] Failed lookup, stale installation, repository mismatch, and permission-denied states are explicit and recoverable.
- [x] Pull request #61 (or an equivalent browser-created proof) produces a linked CI evidence record with the exact head SHA.
- [x] Tests cover API URL normalization, private-repository authentication, repository mismatch, replay, and check aggregation.

## Evidence

- Pull request: <https://github.com/jaydubya818/MissionControl/pull/61>
- `pull_request` deliveries failed with `GitHub PR lookup failed (403)`.
- Completed `check_run` deliveries failed with `Invalid GitHub PR URL` for the API-form PR URL.

## Work Log

### 2026-08-10 - Complete

**By:** Codex

**Actions:**

- Canonicalized `pull_request`, `pull_request_review`, and `check_run` events to
  one browser-form pull-request URL.
- Replaced the global token lookup with a short-lived GitHub App installation
  token restricted to the exact bound provider repository ID; the token remains
  in action memory only and is cleared after the read.
- Added explicit workspace/repository/installation/App-identity validation and
  surfaced recent signature, status, result, and timestamp data in the
  repository settings UI.
- Added fail-closed parsing of the factory-authored PR lineage block and
  verified its WorkOrder, producing Attempt, Task, repository, and branch before
  correlation.
- Added `pull_request.edited` synchronization so a browser edit can refresh
  evidence without a repair command.

**Verification:**

- Browser-created PR [#63](https://github.com/jaydubya818/MissionControl/pull/63)
  is open at head `478e531b6c62ec552597e540a3205fb645560a2e`, with all 9 checks
  passing and exact WorkOrder/Attempt/Task lineage.
- A browser title edit produced delivery
  `cfe289e0-94ce-11f1-86bc-9b075d1e21d1`, shown in Mission Control as
  `pull_request · edited`, signature valid, processed.
- PR #63 automatically left evidence quarantine (7 unresolved to 6) and the
  outer gate now shows CI PASS linked to WorkOrder
  `kx7gkkys20hrrth7xjr32pkhjh8c6bqj`; no manual reconciliation or control-plane
  repair command was used.
- Focused Convex suite: 72 tests passed. Focused UI suite: 17 tests passed. UI
  and Convex typechecks and `git diff --check` passed.
