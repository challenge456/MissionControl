---
date: 2026-07-31
topic: operating-lane-model-pools
---

# Operating Lane Model Pools

## What We're Building

Make each Software Factory operating lane configurable as an approved model
pool. The resolver dynamically selects within that pool using task risk,
complexity, required capabilities, provider health, and estimated cost instead
of treating the model shown on the lane card as a fixed route.

## Why This Approach

A fixed model per lane wastes money on routine work. A fully learned optimizer
would be premature without enough quality history. Deterministic, explainable
selection from an operator-approved pool provides useful intelligence now while
remaining auditable and safe.

## Key Decisions

- Explicit per-task overrides and ordered policy rules remain authoritative.
- Lane-pool selection runs before generic workflow-tier and workspace defaults.
- `LOW + SMALL` starts at FAST, standard work at BALANCED, and high-risk, critical,
  or large work at POWERFUL.
- Selection chooses the cheapest healthy eligible model at or above that quality
  floor; missing capability or risk approval causes rejection and fallback.
- The UI exposes the approved pool directly from each operating-lane card.

## Open Questions

- Validation-pass history can become a ranking input after enough receipts exist;
  it is deliberately not simulated in this slice.

## Next Steps

Implement policy persistence, deterministic resolver selection, lane controls,
simulation support, tests, and headless browser verification.
