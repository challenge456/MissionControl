# Browser and E2E Evidence

Canonical source: `docs/testing/evidence/deterministic-skill-automations/README.md`

Verified locally on 2026-07-30 against the seeded Software Factory demo workspace.

## Primary proof

- `definition-approved.png` — a generated Playwright artifact passed validation; the disabled Definition was submitted and approved without implicit activation.
- `run-verified.png` — an active Definition produced one idempotent review-gate WorkOrder; the WorkOrder was approved, explicitly dispatched, executed, independently verified with two fresh receipts, and accepted as `DONE`.
- Runtime artifact: `test-results/automation-evidence/factory-health.png`.

The reference browser adapter passed:

```bash
AUTOMATION_BASE_URL=http://127.0.0.1:5199 \
pnpm exec playwright test -c tests/automations/playwright.config.ts
```

Result: **1 passed**.

## Final UI evidence

| Evidence | What it proves |
| --- | --- |
| `final/overview.png` | Persisted metrics and exception-first operating posture |
| `final/candidates.png` | Eligible, potential, and ineligible skills with conversion metadata |
| `final/definition.png` | Draft Definition and explicit lifecycle controls |
| `final/runs.png` | WorkOrder and run lineage with verified and rejected outcomes |
| `final/receipts.png` | Expected and observed results, evidence, integrity, and follow-up |
| `final/decisions.png` | Actor, policy, version, state, correlation, and causation history |
| `final/candidates-760x900.png` | Responsive candidate experience |

Evidence directory:
`docs/testing/evidence/deterministic-skill-automations/`

## Live API adapter E2E

The final proof used Definition `ms7apqvezv3vw8f1nhbw55feth8bj5ks` and
WorkOrder `hh7mkkx9aw5y5bz77mn20m6c6n8bjns6`.

1. Manual evaluation created exactly one approval-gated WorkOrder.
2. An independent operator explicitly approved it.
3. Dispatch created run `hx7hww9g2873axg5e3zg7vswv98bkv8v`.
4. The bounded read-only API adapter observed HTTP 200 in 5 ms.
5. The independent verifier created two passing receipts.
6. Both receipts carried integrity hash
   `sha256:b549e402fea1abae8dd0c0fd496a914ca559826a6d4a2d4a9508ee041eb4fc2b`.
7. The final decision was `VERIFIED`.
8. The WorkOrder ended `DONE`.

## Accessibility

All seven Automation tabs were checked using Axe WCAG A/AA rules.
Definitions, Runs, and Decisions had no violations. Remaining serious findings
on Overview, Candidates, Schedule, and Receipts are the shared
`text-ink-muted` contrast token at approximately 4.1–4.4:1 versus the required
4.5:1. No feature-specific structural or interaction issue was found.

## Local database preservation

The stale pre-Control-Plane local SQLite store was preserved as
`.convex/local/default/convex_local_backend.sqlite3.pre-skill-automation-backup`
before a clean local demo database was seeded.
