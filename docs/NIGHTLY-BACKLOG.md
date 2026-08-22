# Nightly backlog

Shared backlog for the autonomous scheduled jobs that operate on this repo
(`daily-repo-improvement`, `notes-to-factory`). Read this **before** proposing
work. Items under "Open" are already proposed; items under "Checked, not
applicable" were already ruled out. Re-proposing either is a failure.

## Open

- [ ] 2026-08-22 — **Factory Learning V1: signals → clustering → improvement candidates → human review → governed experiment → promotion recommendation** — Jay's stated next value jump; the learning loop is what turns "many strong components" into a governed factory. Must not self-authorize, mutate governance, bypass verification, or become a token sink. Source: apple-note p7000.
- [ ] 2026-08-22 — **Mission Control System Qualification Run (E2E)** — one realistic Mission traversing Mission → Plan → recipe recommendation → FactoryVersion → Context Package → worker lease → execution → trace → source Attempt → candidate PR → independent verification Attempt → frozen Verification Plan → evidence/receipts → human acceptance → Learning signal → improvement candidate → experiment proposal. Must also exercise negative paths: stale worker lease, candidate/PR-head mismatch, verification failure, retry lineage, context miss, deterministic gate failure, sandbox orphan, model-routing override. Goal is proving architectural invariants survive subsystem boundaries, not that "the app works." Jay suggests a dedicated stream carrying no new product features. Source: apple-note p7000.
- [ ] 2026-08-22 — **Factory Memory & Context Intelligence (5 phases)** — Hybrid Factory RAG, Typed Factory Relationships, Agentic Retrieval, Factory Knowledge Graph, Autonomous Context Engineering. A core subsystem, not a sidecar chatbot or generic enterprise search. Prefer additive schema changes and existing domain concepts; do not introduce an external vector/graph/observability platform as a hard dependency. Source: apple-note p6971.
- [ ] 2026-08-22 — **Full repository audit + E2E qualification pass** — reconnaissance-first review of intent vs. implementation across architecture, contracts, migrations, workers, executors, adapters, verification, sandbox, observability, authz, and feature flags, before any editing. Large; run as its own governed stream. Source: apple-note p7018.

## Checked, not applicable

- 2026-08-22 — **Basic / Intermediate / Advanced experience toggle** — requested twice in Jay's notes (p6972: "a toggle for basic, intermediate and advanced so folks don't get overwhelmed"; p7000: "Basic gets a few high-confidence recommendations; Intermediate gets evidence/impact; Advanced gets raw traces/evals/config drift/experiment history"). **Already implemented**: `apps/mission-control-ui/src/factoryExperience/` provides `ExperienceLevelSelector`, `useFactoryExperienceLevel`, and `ProgressiveFactoryView`, with `FactoryExperienceLevel` gating in `CreateFactoryMissionDialog`, plus coverage in `tests/e2e/review-intelligence.e2e.spec.ts` and `tests/e2e/system-factory-qualification.e2e.spec.ts`. No work required.

## Closed

<!-- - [x] YYYY-MM-DD → YYYY-MM-DD — <initiative> — <how it was resolved> -->

---

## Governance note for autonomous jobs

This repository's own architectural invariants, as recorded in Jay's design
notes (apple-note p6971), include:

> Humans merge PRs. No full-auto.
> `workOrders.accept` remains the only WorkOrder acceptance authority.
> Executors do not self-certify acceptance.
> Agent completion does not equal verified success.

Automated jobs operating on this repo should therefore open pull requests
rather than merging to `main` directly, even when all checks are green.
