# Deterministic skill Automations — browser evidence

Verified locally on 2026-07-30 against the seeded `sf-demo` workspace.

- `definition-approved.png`: generated Playwright artifact passed validation,
  the disabled Definition was submitted for review, and a trusted operator
  approved it without activating it implicitly.
- `run-verified.png`: a separately activated Definition produced one
  idempotent review-gate WorkOrder; the WorkOrder was operator-approved,
  explicitly dispatched, completed by the Playwright adapter, independently
  verified with two fresh receipts, and accepted as `DONE`.
- Runtime evidence: `test-results/automation-evidence/factory-health.png`.
- Browser adapter command:
  `AUTOMATION_BASE_URL=http://127.0.0.1:5199 pnpm exec playwright test -c tests/automations/playwright.config.ts`
  — 1 passed.
- `final/overview.png`: derived operating posture and exception-first metrics
  from persisted demo Definitions, runs, and receipts.
- `final/candidates.png`: eligible, potential, and ineligible Registry skills
  with adapter, category, conversion, permission, secret, and verification
  detail.
- `final/definition.png`: disabled draft Definition with explicit edit,
  validation, review, version, and lifecycle controls.
- `final/runs.png`: WorkOrder/run lineage including the seeded verified and
  rejected outcomes.
- `final/receipts.png`: independent evidence, expected/observed result,
  integrity hash, and recommended follow-up.
- `final/decisions.png`: actor, policy, version, state transition, correlation,
  and causation history.
- `final/candidates-760x900.png`: responsive candidate experience.

Final API-adapter proof used Definition `ms7apqvezv3vw8f1nhbw55feth8bj5ks`
and WorkOrder `hh7mkkx9aw5y5bz77mn20m6c6n8bjns6`:

1. Manual evaluation created exactly one approval-gated WorkOrder.
2. An independent operator explicitly approved it.
3. Dispatch created run `hx7hww9g2873axg5e3zg7vswv98bkv8v`.
4. The bounded read-only API adapter observed HTTP 200 in 5 ms.
5. The independent verifier created two passing receipts with integrity hash
   `sha256:b549e402fea1abae8dd0c0fd496a914ca559826a6d4a2d4a9508ee041eb4fc2b`.
6. The final decision was `VERIFIED`; the WorkOrder ended `DONE`.

Accessibility was checked across all seven Automation tabs with Axe WCAG
A/AA rules. Definitions, Runs, and Decisions had no violations. The remaining
serious findings on Overview, Candidates, Schedule, and Receipts are all the
shared shell `text-ink-muted` contrast token (roughly 4.1–4.4:1 versus the
required 4.5:1), not a feature-specific structural or interaction issue.

Local demo database note: the pre-existing local SQLite store contained stale
pre-Control-Plane E2E Automation rows that could not satisfy the current merged
schema. It was preserved as
`.convex/local/default/convex_local_backend.sqlite3.pre-skill-automation-backup`
before a clean local demo database was created and reseeded.
