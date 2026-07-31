# Automating repetitive tasks

Turn recurring operator work into governed factory automation.

## Workflows

Define multi-step workflows in `workflows` table:

- Step agents (Hermes operator, Pi bounded runtime)
- Retry limits and timeouts
- Expected outputs per step

Seed demo includes `mc-demo-delivery` workflow for WorkOrders.

## Scheduled jobs

`scheduledJobs` drive cron-like execution:

- Daily CEO brief (`mission_prompt`)
- Nightly QC run
- Smoke test suite

View upcoming runs in Command Center.

## Hybrid patterns

**Labs → Hybrid Workflows** and **Automations** harness pages document Eric workshop patterns — trigger → agent fleet → receipt.

## From task to WorkOrder

When chat-shaped work repeats:

1. Capture desired outcome and criteria
2. Promote to WorkOrder (not another INBOX task)
3. Attach workflow and repo scope
4. Dispatch with idempotency key
5. Store receipt for meta-loop mining

## Governed repetitive-task automation

Mission Control can promote an evidenced repeat pattern into a bounded review
loop. It never converts repeated work directly into autonomous execution.

1. **Detect** — the repetitive-task scan groups completed WorkOrders by
   workflow (or repository when no workflow is present). A candidate needs at
   least two occurrences and at least one verification receipt.
2. **Propose** — the scan creates a deduplicated `DELEGATION` suggestion with
   the pattern and recommended cadence.
3. **Accept and activate** — accepting the suggestion creates a disabled
   automation definition. An operator must make a separate activation decision
   from **Harness → Automations**.
4. **Create a review gate** — an active definition is evaluated hourly. At
   most once per weekly cadence, it creates one idempotent, non-mutating
   WorkOrder in `AWAITING_APPROVAL`.
5. **Review and dispatch** — the operator reviews scope and the verification
   plan, records the required approval, then dispatches through the normal
   WorkOrder flow. The automation cannot dispatch itself.
6. **Verify and learn** — the dispatched run must produce receipts. Those
   receipts are the evidence that future repeat-pattern scans use.

### Safety boundaries

- Disabling an automation definition stops future review gates; it does not
  alter existing WorkOrders.
- Scheduled WorkOrders are always `isMutating: false` and require an
  `operator` approval.
- Cadence retries reuse the same idempotency key, so scheduler retries cannot
  create duplicates.
- Missing receipt evidence prevents the detector from proposing automation.

### Operator checklist

Before approving a generated WorkOrder, confirm:

- The workflow scope is still current and bounded.
- The work remains appropriate for a non-mutating review gate.
- The verification criteria are concrete enough to produce a useful receipt.
- The resulting dispatch has a named workflow and normal project controls.

## Metrics

Factory Health tracks `humanTouchesPerAgentTask` — automation succeeds when this drops without verification FAIL rate rising.
