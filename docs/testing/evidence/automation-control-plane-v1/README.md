# Automation control plane V1 evidence

Captured July 28, 2026 against the EOS V2 shell at
`http://localhost:5199` and an isolated local Convex deployment.

## Focused verification

| Check | Result |
| --- | --- |
| Automation governance, repetitive-task detection, WorkOrder governance, WorkOrder dispatch | 4 files, 36 tests passed |
| Automation model, V2 route normalization, live navigation | 3 files, 8 tests passed |
| Convex TypeScript | Passed |
| Mission Control UI TypeScript | Passed |
| Mission Control UI production build | Passed; existing large vendor chunk warning only |
| Diff whitespace validation | Passed |
| Affected-package lint | No package-level lint script exists for the UI or Convex surface; both affected TypeScript scopes passed type checking |

The backend tests cover candidate grouping and deduplication, receipt eligibility,
read-only review-gate construction, cadence idempotency, approval requirements,
automation self-approval rejection, pause/suspension policy, missing-receipt
handling, metrics, and existing WorkOrder governance/dispatch regression cases.
The supported-UI journey covers candidate acceptance, disabled definition
creation, separate audited activation, actual scheduler evaluation, duplicate
prevention, pause persistence, and workspace isolation.

## Browser journey

The requested hosted workspace was unavailable because its Convex team was
paused. The journey therefore used a UI-created, disposable local workspace with
the same name, `Software Factory Research Lab`
(`w17bnnjbwzws1rdyvg97s9cwxd8bfda8`). No direct database writes were used.

1. Created the disposable workspace and seeded the supported demo through the UI.
2. Opened Operations → Automations and verified the exception-first Overview.
3. Reviewed a `feature-dev` candidate backed by two completed WorkOrders and two
   fresh passing receipts.
4. Accepted it with the keyboard and confirmed a `DISABLED` definition.
5. Activated it in a separate keyboard-driven confirmation with actor `operator`,
   reason, `automation-v1` policy, definition version, and timestamp recorded.
6. Evaluated the due schedule through the UI and created exactly one read-only
   WorkOrder in `AWAITING_APPROVAL`.
7. Retried evaluation; the stable cadence key skipped the duplicate.
8. Inspected Automation, Workflow version, cadence, scope, verification contract,
   pending approval, and disabled Dispatch on the WorkOrder.
9. Paused the definition; future evaluation became disabled while the existing
   WorkOrder remained unchanged.
10. Refreshed, navigated backward and forward between Candidates and Schedule,
    and confirmed both selected Automation and tab persisted in the URL.
11. Opened the Automation ID under a second UI-created workspace and received the
    explicit `Automation scope error`.
12. Verified the list/table alternative at 760 × 900.

Local fixture state remains only in the isolated local deployment so the captured
evidence stays reproducible.

## Authorization constraint

V1 requires deployment behind a trusted operator boundary. Automation decision
actor labels are client asserted and recorded as
`CLIENT_ASSERTED_TRUSTED_OPERATOR`; they are not authenticated Mission Control
identities. Authenticated activation, pause, evaluation, and workspace access
remain separately scoped follow-up work in
[issue #42](https://github.com/jaydubya818/MissionControl/issues/42).

## Accessibility

- One H1 and semantic, URL-backed tabs were present.
- Dialog inputs had accessible names; status and state used text, not color alone.
- Candidate acceptance and activation completed with keyboard controls.
- Schedule exposed an authoritative list rather than requiring a calendar.
- Paused and suspended are distinct textual states.
- The 760 × 900 layout remained usable.
- Axe WCAG A/AA scan: **0 critical violations**.
- One serious `color-contrast` rule remained. It affects the shared shell’s muted
  color token and muted secondary copy (34 nodes at the full-width Overview);
  changing the global token is outside this bounded control-plane slice.

## Artifacts

- `overview.png`
- `candidates-list.png`
- `candidate-details.png`
- `disabled-definition.png`
- `activation-confirmed.png`
- `activation-audit.png`
- `schedule.png`
- `review-gate-run.png`
- `duplicate-scheduler-attempt.png`
- `review-gate-workorder.png`
- `paused-state.png`
- `workspace-isolation.png`
- `narrow-viewport.png`
- `browser-trace.zip`
