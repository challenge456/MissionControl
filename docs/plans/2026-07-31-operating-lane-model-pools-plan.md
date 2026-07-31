---
title: Operating Lane Model Pools
type: feat
status: completed
date: 2026-07-31
---

# Operating Lane Model Pools

## Acceptance Criteria

- [x] Operators can approve multiple catalog models for each operating lane.
- [x] Lane configuration is stored in immutable workspace policy versions.
- [x] The resolver selects dynamically within the applicable lane pool.
- [x] Small low-risk reviews avoid the powerful model when an eligible cheaper
      approved model exists.
- [x] High-risk, critical, and large work requires a powerful eligible route.
- [x] Simulator output explains the selected lane and considered alternatives.
- [x] Existing fixed rules, task overrides, and fallback behavior remain intact.
- [x] The page is verified headlessly in the Software Factory Demo workspace.

## Delivery Notes

Use deterministic quality floors rather than a speculative learned optimizer.
Quality-history ranking should be added only after validation receipts provide a
meaningful sample size.

## Recommended Enhancements

1. Add validation-pass rate and retry rate to ranking after each lane has at
   least 25 comparable receipts; never learn from raw model activity.
2. Add per-lane daily and monthly spend envelopes with a visible projected-cost
   warning before activation.
3. Add provider-diversity requirements for long-running work so one provider
   outage cannot strand an overnight queue.
4. Add a 5–10% canary mode for newly approved models and automatically suspend
   them after repeated validation failures.
5. Add workspace presets—cost-conscious, balanced, and quality-first—as editable
   starting points, not hidden behavior.
6. Add a lane health summary showing empty pools, unavailable approved models,
   missing tier coverage, and unsafe fallback gaps before policy activation.

## Verification — 2026-07-31

- Software Factory Demo policy v4 stores separate approved pools for all five
  operating lanes and scopes the local easy-task rule to the Local lane.
- Headless simulation selected `operator-fast` for a `REVIEW + LOW + SMALL` task
  and `operator-powerful` for the same review at HIGH risk.
- Resolver tests cover cheap review selection, consequential review escalation,
  and lane-scoped rule isolation.
