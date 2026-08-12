---
title: "feat: Qualify production automation with three staging releases"
type: feat
status: active
date: 2026-08-11
---

# Qualify Production Automation with Three Staging Releases

## Problem

The governed release state machine is merged but has not processed a real
provider deployment. Production is still outside the Factory evidence chain,
and the public Vercel project currently deploys `main` automatically. Enabling
another production trigger before proving the staging path would create two
conflicting release authorities.

## Decision

Qualify the release path with three distinct GitHub merge commits. Each commit
must be correlated to a real WorkOrder and workflow run, human-approved for
staging, deployed by Vercel, and independently verified from immutable merge,
deployment, provenance, smoke, and health evidence.

After all three releases are `VERIFIED`, add production eligibility and
automation. Production must fail closed unless the exact candidate has verified
staging evidence and the repository has three distinct qualifying staging
releases. Keep Vercel's existing production Git behavior unchanged until that
gate is proven and the production release path can become authoritative.

## Environment Topology

- Factory staging control plane: Convex `gallant-cassowary-27`, currently empty.
- Public legacy UI backend: Convex `different-gopher-55`, documented as a dev
  deployment and currently configured on Vercel Production.
- Staging provider: Vercel Preview deployments for `mission-control-ui`.
- Production provider: Vercel `mission-control-ui`; current automatic `main`
  deployment must not be treated as Factory-governed evidence.

The first bootstrap deploys the already-merged v12 Factory backend to the empty
staging control plane, registers `jaydubya818/MissionControl`, and configures
Vercel Preview to use the staging Convex deployment. It does not alter the
legacy production backend.

## Release Sequence

### Release 1 — Provider-verifiable application identity

- Add same-origin `/api/release` provenance and `/api/health` endpoints.
- Bind provenance to Vercel's deployment ID, Git commit SHA, and release
  environment.
- Create and execute a WorkOrder, merge the PR, deploy the exact merge to
  Vercel Preview, approve, record the provider receipt, and verify.

### Release 2 — Provider-backed staging dispatch

- Add a Vercel staging adapter with a deterministic request/receipt contract,
  bounded failure handling, and no browser-authored authority.
- Require a human approval record before the adapter may dispatch.
- Merge and run the exact second commit through the same staging path.

### Release 3 — Production qualification gate

- Add a query that counts distinct, exact, verified staging releases for a
  repository.
- Add production-candidate eligibility that requires three qualifying releases,
  exact candidate staging verification, and no unresolved rollback/blocker.
- Merge and run the exact third commit through staging; confirm the count is
  three before any production automation is enabled.

### Production automation

- Add an explicit production release lifecycle and immutable evidence.
- Prefer a staged production build (`--prod --skip-domain`) followed by Factory
  verification and provider promotion, avoiding an unverified domain switch.
- Require a fresh human production approval for the exact merge commit.
- Record deployment, provenance, smoke, health, promotion, and rollback
  evidence. Fail closed on mismatch or timeout.
- Disable or supersede the existing Vercel `main` auto-promotion only when the
  Factory path is ready to become the sole production authority.

## Go / No-Go Gates

For each staging release, GO requires:

1. GitHub reports the PR merged and supplies the exact merge SHA.
2. WorkOrder, workflow run, repository, PR head, and merge lineage agree.
3. Human staging approval binds that SHA.
4. Vercel reports a ready deployment built from the same SHA.
5. `/api/release` matches the SHA, deployment ID, and `staging` environment.
6. smoke and health return bounded 2xx responses.
7. Mission Control records `VERIFIED` with immutable evidence.

Any mismatch is NO-GO. Keep the release in `DEPLOYED`, preserve evidence, and
either correct the deployment receipt or roll back explicitly.

Production automation is NO-GO until all three distinct releases satisfy every
gate and browser evidence proves the operator path survives refresh.

## Rollback

- Convex bootstrap: deploy the previous backend bundle if a function/schema
  regression appears; the preflight confirms no indexes are removed.
- Staging: record a Factory rollback to the last known-good commit and retain the
  Vercel deployment URL as evidence.
- Production: use Vercel instant rollback to the last verified deployment, then
  record the provider rollback ID, restored commit, rationale, and evidence URL.
- Never delete provider deployments used by evidence records.

## Validation

- Focused Convex and UI tests for every new transition and denial path.
- Repository lint, typecheck, unit tests, build, and runtime contract guard.
- `vercel inspect` for provider state and commit metadata.
- Mission Control's server-side verifier for provenance, smoke, and health.
- Browser proof of WorkOrder → PR → merge → approval → deploy → verification for
  all three staging releases, then production approval → staged deploy → promote
  → verified (or rollback exercise).

## Exit Criteria

- Three distinct real staging releases are `VERIFIED` with complete evidence.
- Production automation cannot run before eligibility and exact human approval.
- One exact production candidate completes deployment and verification, or the
  system performs an evidence-backed rollback without losing audit history.
- Vercel and Mission Control have one documented authoritative production path.

