---
status: ready
priority: p1
issue_id: "029"
tags: [software-factory, remote-sandbox, exe-dev, security, operations]
dependencies: ["028"]
---

# Remote Sandbox Provider Proof

## Problem Statement

Mission Control executes Factory Attempts on the local host. Before a remote
sandbox can receive repository source or an agent credential, the provider
lifecycle, identity, integration, budget, and cleanup assumptions must be
proved with a fail-closed, non-mutating canary.

## Findings

- The approved implementation plan is
  `docs/plans/2026-08-10-feat-remote-sandbox-factory-cohorts-plan.md`.
- The current Factory worker and several supporting contracts are untracked
  work in progress. Phase 0 must not couple new provider behavior into them.
- exe.dev's published SSH host fingerprint is
  `SHA256:JJOP/lwiBGOMilfONPWZCXUrfK154cnJFXcqlsi6lPo`; the live host presented
  that fingerprint on 2026-08-10.
- The local machine does not currently authenticate to exe.dev. A verified-host
  `ls --json` probe failed with `Permission denied (publickey,keyboard-interactive)`.
- New exe.dev accounts may attach default integrations automatically. The
  doctor must inventory and reject `auto:all` attachments before allocation.
- A disposable VM is not a sufficient security boundary if the runtime has
  sudo, write-capable repository identity, broad integrations, public ports, or
  an unbounded model credential.

## Proposed Solutions

### Option 1: Integrate exe.dev directly into the Factory worker now

**Pros:** Reaches repository execution sooner.

**Cons:** Couples provider behavior to untracked runtime work before lifecycle,
cleanup, and identity assumptions are proven.

**Effort:** High.

**Risk:** High.

### Option 2: Standalone fail-closed provider doctor and lifecycle canary

**Pros:** Proves trust, authentication, provider inventory, safe defaults, exact
resource naming, and cleanup independently. Can run without Convex or GitHub.

**Cons:** Does not yet execute a real WorkOrder.

**Effort:** Medium.

**Risk:** Low.

### Option 3: Defer remote execution until the current Factory branch is clean

**Pros:** Avoids all overlap.

**Cons:** Leaves the highest-risk external assumptions untested and delays the
information needed for architecture decisions.

**Effort:** Low now, higher later.

**Risk:** Medium.

## Recommended Action

Implement Option 2. Keep live creation behind both an explicit CLI flag and
`MISSION_CONTROL_SANDBOX_LIVE=1`. Run only read-only provider checks until an
exe.dev account key is registered. The canary must create no integration,
receive no repository source or model key, and remove only its exact generated
VM name in a `finally` path.

## Technical Details

**Affected files:**

- `scripts/sandbox-doctor.mjs`
- `scripts/lib/exe-dev-sandbox.mjs`
- `scripts/lib/exe-dev-sandbox.test.mjs`
- `docs/architecture/remote-sandbox-execution.md`
- `docs/security/remote-sandbox-threat-model.md`

**Explicitly not affected:**

- Convex schema or generated API
- Factory Attempt worker
- executor adapters
- Mission Control UI
- GitHub or OpenRouter credentials

## Resources

- [exe.dev API](https://exe.dev/docs/api)
- [exe.dev new](https://exe.dev/docs/cli-new)
- [exe.dev rm](https://exe.dev/docs/cli-rm)
- [exe.dev integrations](https://exe.dev/docs/cli-integrations)
- [exe.dev host-key documentation](https://exe.dev/docs/all)
- `docs/plans/2026-08-10-feat-remote-sandbox-factory-cohorts-plan.md`

## Acceptance Criteria

- [x] Architecture and threat-model documents define the Phase 0 authority and
  cleanup contracts.
- [x] The doctor verifies the live SSH host key against the pinned published
  fingerprint before authentication.
- [x] Read-only checks cover account authentication, VM inventory, billing
  limits/usage, and integration inventory.
- [x] Any `auto:all` integration blocks live allocation by default and is
  reported without exposing credential material.
- [x] Live allocation requires both `--lifecycle-canary` and
  `MISSION_CONTROL_SANDBOX_LIVE=1`.
- [x] The canary uses an exact generated name/tag, attaches no integration,
  passes no environment secret, and performs no repository or model call.
- [x] VM removal runs from a bounded `finally` path and is verified against
  provider inventory.
- [x] Tests cover fingerprint mismatch, SSH arguments, integration blocking,
  exact resource commands, live opt-in, and redaction.
- [x] Focused tests and `git diff --check` pass.
- [ ] Three authenticated live lifecycle runs finish with no orphaned VM or
  unexpected integration.

## Work Log

### 2026-08-10 - Approved Start and Provider Identity Probe

**By:** Codex

**Actions:**

- Reviewed the approved remote-sandbox plan and current dirty worktree.
- Limited the first slice to standalone Phase 0 files to avoid overlapping the
  untracked Factory worker and schema work.
- Compared the live exe.dev RSA fingerprint with the provider's published
  fingerprint; they matched.
- Attempted the first read-only authenticated inventory call with an ephemeral
  known-hosts file.

**Learnings:**

- Provider authentication is the current external blocker. No VM or external
  resource was created.
- Pull-based supervision remains the safer V1 transport because the sandbox
  needs no Mission Control credential or inbound callback access.

### 2026-08-10 - Fail-Closed Doctor and Lifecycle Harness

**By:** Codex

**Actions:**

- Added the standalone exe.dev SSH client, read-only readiness checks, and
  dual-gated lifecycle canary.
- Added exact-name create/delete commands with no environment value or
  integration attachment.
- Added automatic-integration blocking, token redaction, strict host
  verification, exact inventory checks, and cleanup from the failure path.
- Added architecture, threat-model, and validation evidence documents.

**Verification:**

- 11 focused Vitest tests passed.
- The live provider fingerprint matched the pinned official value.
- The real read-only doctor and the dual-opted live command both failed closed
  on missing provider authentication before allocation.
- No external resource was created.

**State:**

- The todo remains open because three live lifecycle runs and live orphan
  verification require a registered exe.dev identity.

### 2026-08-10 - Dedicated Provider Identity Generated

**By:** Codex

**Actions:**

- Generated `/Users/jaywest/.ssh/id_ed25519_exe_mission_control` after explicit
  Product Owner authorization.
- Set private-key mode `0600` and public-key mode `0644`.
- Recorded only the Ed25519 public fingerprint:
  `SHA256:L5itzmZwaxF52475kTRWu1EXBl6QtxlAmLyEHtLpLUk`.
- Re-ran the doctor with `EXEDEV_IDENTITY_FILE` pointing to the dedicated key.

**Result:**

- Local identity selection works.
- Provider account authentication remains blocked until the public key is
  registered with exe.dev.
- No VM or other provider resource was created.

### 2026-08-10 - Provider Account Verified and Readiness Inventoried

**By:** Codex

**Actions:**

- Registered the dedicated public key through exe.dev's Google-verified account
  flow using the Product Owner-provided email address.
- Closed the interactive provider session and reran the batch-mode doctor with
  the dedicated identity.
- Read VM, billing plan, billing usage, and integration inventories.

**Result:**

- Authentication passed and the account contains zero VMs.
- Billing plan and usage are readable.
- Default `llm`, `notify`, and `reflection` integrations attach to `auto:all`.
- Live allocation remains blocked until those attachments are explicitly
  removed or narrowed.
- No VM or paid workload was created.

### 2026-08-10 - Automatic Integrations Detached and Capacity Blocked

**By:** Codex

**Actions:**

- Detached `llm`, `notify`, and `reflection` from `auto:all` after explicit
  Product Owner approval. The integrations were not deleted.
- Reran the read-only doctor and confirmed zero automatic attachments.
- Attempted lifecycle canary 1/3.
- Investigated the failure through exact provider inventory and billing-plan
  reads.
- Updated the doctor to block zero-capacity plans and to reconcile cleanup
  without treating an absent, never-created VM as an orphan.

**Verification:**

- 12 focused tests passed.
- The account has zero VMs and no `auto:all` integrations.
- The active Basic plan reports `max_vms: 0`.
- Canary creation was rejected before allocation; exact inventory confirmed no
  orphaned VM.
- Live allocation now fails readiness with `PROVIDER_CAPACITY_BLOCKED`.

**State:**

- The next step requires an explicit billing-plan decision from the Product
  Owner. Mission Control will not add a payment method or purchase capacity
  silently.

### 2026-08-10 - Paid Capacity Declined

**By:** Codex

**Decision:**

- The Product Owner declined the exe.dev Personal upgrade.
- Do not add payment information, purchase provider capacity, or retry live VM
  creation.

**Result:**

- Phase 0 remains blocked at `PROVIDER_CAPACITY_BLOCKED`.
- The provider account remains useful for read-only contract validation but
  cannot run lifecycle canaries.
- A different provider or execution strategy requires a separate Product Owner
  decision; it must not be selected silently.

## Notes

- Do not edit the approved implementation plan while executing this todo.
- Do not create a commit unless the Product Owner explicitly asks.
- Do not add another exe.dev key or a payment method without explicit Product
  Owner authorization.
