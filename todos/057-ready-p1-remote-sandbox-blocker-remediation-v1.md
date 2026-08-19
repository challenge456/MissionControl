---
status: ready
priority: p1
issue_id: "057"
tags: [remote-sandbox, exe-dev, security, supply-chain, qualification]
dependencies: []
---

# Remote Sandbox Hardening V1 Blocker Remediation

## Problem Statement

PR #125 proved useful fail-closed Remote Sandbox controls but correctly stopped at `HOLD`. Its candidate image contains seven unresolved High vulnerabilities, and exe.dev exposes no known provider-enforced egress/firewall primitive. The candidate cannot enter live production-pilot qualification until the image gate is clean and the guest privilege, network, credential, and isolation boundaries are proven without overstating provider enforcement.

## Findings

- Exact remediation baseline: `11a51cac1e446488cddf34781cc9663b922c7684` from latest `origin/main`.
- PR #125 remains draft at candidate head `6db1389c2e5dfd309cebefd1db45727532fab71d` and will not be modified during remediation.
- Existing unsuppressed Grype evidence reports 0 Critical and 7 High findings across `busybox`, `libcrypto3`, and `libssl3`.
- Provider-enforced egress remains a declared limitation unless current exe.dev CLI/API/custom-image capabilities prove otherwise.
- The prior evidence packet is immutable input. Remediation evidence will be additive and versioned separately.

## Proposed Solutions

### Option 1: Patch and qualify the existing candidate architecture

Reconcile the PR #125 candidate into this fresh branch, minimize and repin the OCI image until its unsuppressed gate reaches 0 Critical/0 High, then re-prove the existing guest-side controls and run the bounded live gate only after every admission criterion passes.

**Pros:** Smallest change, preserves the proven architecture and authority model, directly addresses both blockers.

**Cons:** A current upstream package set may still contain an unfixable High finding; guest egress remains defense in depth.

**Effort:** High

**Risk:** Medium

### Option 2: Preserve the blocked candidate and stop

Complete the root-cause audit, document unfixable findings or missing provider capabilities, and return a terminal hold without live allocation or publication.

**Pros:** Honest and safe when admission cannot be proven.

**Cons:** No production-pilot advancement.

**Effort:** Medium

**Risk:** Low

## Recommended Action

Execute Option 1 only while every result is evidence-backed. Fall back to Option 2 immediately if the image cannot reach 0 Critical/0 High or the workload can alter its guest firewall. Do not waive findings, expand authority, enable Guarded Auto, promote globally, or introduce another sandbox architecture.

## Technical Details

**Primary scope:**
- `infra/remote-sandbox/`
- `.github/workflows/remote-sandbox-image.yml`
- `apps/orchestration-server/src/*Sandbox*`
- `apps/orchestration-server/src/standalone*Supervisor*`
- `convex/lib/executionRouting.ts`
- `scripts/remote-sandbox-image-local-qualification.mts`
- `docs/testing/evidence/remote-sandbox-blocker-remediation-v1/`

**Authority constraints:**
- `workOrders.accept` remains canonical acceptance.
- Human merge remains separate.
- The guest receives only an Attempt-scoped inference credential.
- GitHub, exe.dev administration, OpenRouter management, Mission Control service, verification, acceptance, and publication authority remain host-only.

## Acceptance Criteria

- [ ] Reconcile PR #125 candidate code and preserve its evidence without changing PR #125.
- [ ] Record source layer, dependency path, reachability, removability, fix availability, action, and residual risk for all seven High findings.
- [ ] Minimize the final runtime image without removing required supervisor, Git, Node, Codex, certificate, network-policy, or Mission Control functionality.
- [ ] Pin the exact base image, Node, Codex package/binary, package graph, final image, and SBOM digests with no floating tags.
- [ ] Produce an unsuppressed image scan with 0 Critical and 0 High findings before live admission.
- [ ] Re-check current exe.dev network/API capabilities and explicitly preserve the provider-enforced egress limitation if no control exists.
- [ ] Prove guest deny-by-default egress permits only required inference destinations and blocks unauthorized public, RFC1918, link-local, metadata, and unexpected DNS targets where enforceable.
- [ ] Prove the Codex workload is non-root, lacks `CAP_NET_ADMIN`, cannot modify nftables, cannot install packages, and cannot access host/provider administration.
- [ ] Prove only the Attempt inference credential is present; all management, GitHub, Mission Control, verification, acceptance, and publication credentials are absent.
- [ ] Prove protected system paths, dedicated workspace writes, no package-cache leakage, and no prior-Attempt persistence across two fresh instances.
- [ ] Run the live bug-fix, security/policy, and schema-migration gate serially at maximum one VM only if every pre-live criterion passes; require 3/3 first-pass with no retries.
- [ ] Run the bounded live negative matrix only after admission and require every forbidden action to fail safely.
- [ ] Compare allocation, readiness, startup, execution, teardown, and total-cycle performance with unknowns preserved as `null`.
- [ ] Run the complete requested repository, runtime, routing, security, build, smoke, lint, and qualification matrix.
- [ ] Preserve final provider VM inventory zero and obtain fresh GitHub CI and Vercel evidence for durable changes.
- [ ] Determine whether this branch supersedes, reconciles, or leaves PR #125 blocked, without losing its evidence.
- [ ] Return exactly one permitted terminal decision and avoid any unsupported isolation claim.

## Work Log

### 2026-08-19 - Exact-baseline kickoff

**Actions:**
- Fetched latest `origin/main` and created isolated branch `codex/remote-sandbox-blocker-remediation-v1` from exact commit `11a51cac1e446488cddf34781cc9663b922c7684` using the repository worktree manager.
- Confirmed PR #125 remains draft, open, and unchanged at `6db1389c2e5dfd309cebefd1db45727532fab71d`.
- Read the existing seven-finding vulnerability evidence as immutable remediation input.

**Learnings:**
- The remediation can remain within the existing SandboxProvider/exe.dev architecture.
- Live admission remains strictly downstream of the unsuppressed image and privilege gates.

## Notes

- Maximum live concurrent VMs: 1.
- No destructive provider attacks.
- Provider-enforced egress and guest defense in depth must remain distinct claims.
- Guarded Auto remains disabled.
