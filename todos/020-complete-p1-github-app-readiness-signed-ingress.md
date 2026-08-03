---
status: complete
priority: p1
issue_id: "020"
tags: [software-factory, github-app, webhook, readiness, convex, ui]
dependencies: ["018", "019"]
---

# Add GitHub App Readiness and Signed Ingress

## Problem Statement

Mission Control verifies the GitHub webhook HMAC and deduplicates PR evidence,
but it does not retain GitHub App installation identity, granted permissions,
or a delivery/replay ledger. A repository can therefore look configured without
proving that its production integration has the authority and events required
for the Mission-to-PR path.

## Recommended Action

Add an additive GitHub App connection contract over the existing workspace
repository record. Store installation metadata and permission evidence, never
installation tokens. Record every webhook delivery by GitHub delivery GUID,
reject unsigned or unregistered installation traffic, and expose a truthful
repository readiness summary with exact remediation.

## Acceptance Criteria

- [x] GitHub App installation identity is bound to one workspace repository.
- [x] Installation tokens and webhook secrets are never stored in the new records or returned to the browser.
- [x] Required and excessive repository permissions are evaluated explicitly.
- [x] Required webhook subscriptions are evaluated explicitly.
- [x] `X-Hub-Signature-256` is validated before payload parsing or processing.
- [x] Delivery GUID, event/action, repository, installation, receive time, result, and replay state are retained.
- [x] Duplicate deliveries do not repeat PR/CI or meta-loop effects.
- [x] Repository readiness shows verified, missing, stale, or blocked checks with remediation.
- [x] Focused tests, typechecks, and browser verification pass.

## Work Log

### 2026-08-02 - Implementation started

**By:** Codex

**Actions:**

- Confirmed the approved program sequence moves next to GitHub App readiness
  and signed ingress, before Factory configuration or executor work.
- Verified current GitHub requirements against official GitHub documentation.
- Kept Factory activation and dispatch out of this independently reviewable slice.

### 2026-08-02 - GitHub App readiness completed

**By:** Codex

**Actions:**

- Added repository-bound installation, setup-session, and webhook-delivery
  records without persisting OAuth, installation, private-key, or webhook
  credential values.
- Added an operator-initiated OAuth installation flow that verifies the
  initiating Mission Control identity, the installing GitHub user, App
  ownership, exact repository access, least-privilege grants, required events,
  and ephemeral installation-token issuance.
- Added signed ingress delivery deduplication before PR/CI processing and
  invalidation behavior for installation suspension, deletion, repository
  removal, and other material changes.
- Added repository readiness UI for verified, missing, stale, and blocked
  states plus a sanitized missing-environment error.
- Published the production configuration and recovery contract in
  `docs/security/github-app-connection.md`.

**Verification:**

- Focused GitHub and repository UI tests pass: 14 tests.
- Full UI suite passes: 45 files and 195 tests.
- Full Convex suite passes: 54 files and 379 tests.
- Workflow-engine suite passes: 6 files and 76 tests.
- Workspace lint/typecheck and all skill lint checks pass.
- Production UI build passes.
- Browser verification at `http://localhost:5180/v2/projects` confirms the
  missing-installation and missing-environment remediation states with no
  console or page errors after the expected operator action.

**Environment note:**

- A live installation cannot be completed until the six documented GitHub App
  server variables are provisioned. The UI remains explicitly blocked rather
  than simulating readiness when those credentials are absent.
