# Governed Automation Control Plane UI evidence

Captured July 28, 2026 against the EOS V2 shell at `http://127.0.0.1:5180`
and the branch's isolated local Convex deployment on port 3214.

## Acceptance result

- Selected `Software Factory Research Lab` and opened Operations → Automations.
- Verified all seven semantic, URL-backed tabs and the visible LEVEL_1 safety boundary.
- Inspected the accepted candidate, its supporting WorkOrders, and receipt state.
- Inspected the Definition's Workflow, schedule, scope, policy, evidence contract,
  cost limit, lifecycle state, and trusted-operator constraint.
- Resumed the paused Definition with a required reason and confirmed the audited
  `RESUMED` decision.
- Evaluated the same cadence window through the UI and confirmed the existing
  review gate remained exactly one read-only WorkOrder in `AWAITING_APPROVAL`.
- Confirmed the duplicate evaluation was recorded as an idempotent skip.
- Opened the WorkOrder and verified Automation lineage, LEVEL_1/read-only policy,
  approval requirement, explicit-dispatch requirement, independent verification,
  missing evidence, and disabled Dispatch.
- Paused the Definition with a required reason; the existing WorkOrder remained
  unchanged and future evaluation stopped.
- Verified Definition, tab, workspace, and filters are URL-backed; refresh,
  browser Back, and browser Forward preserved state.
- Opened the Definition under a different workspace and received the visible,
  fail-closed `Automation scope error`.
- Verified the Overview remains usable at 760 × 900.
- The clean evidence session reported no page errors, console errors, or failed
  application requests.

## Accessibility

Axe 4.12.1 ran against WCAG 2 A/AA and 2.1 A/AA:

- No critical violations.
- No violations other than the existing shared `color-contrast` rule.
- Wide viewport: one serious rule affecting 35 shared shell/muted-text nodes,
  plus one node requiring manual contrast review.
- 760 × 900: one serious rule affecting 15 nodes.
- Follow-up: [#43 — raise shared muted-text contrast to WCAG AA](https://github.com/jaydubya818/MissionControl/issues/43).

The tested Automation surface also has one page-level H1, semantic tabs with
arrow/Home/End keyboard navigation, named controls and status text, labelled
reason fields, Radix dialog focus containment/Escape handling, table headers,
and an authoritative schedule list.

## Artifacts

- `overview.png`
- `candidates.png`
- `definition-detail.png`
- `runs.png`
- `schedule.png`
- `receipts.png`
- `decisions.png`
- `workorder-lineage.png`
- `paused-definition.png`
- `workspace-mismatch.png`
- `narrow-760x900.png`
- `command-center.png`
- `browser-trace.zip`
