---
date: 2026-08-15
topic: progressive-factory-experience-v1
status: approved-for-implementation
source: https://github.com/disler/super-simple-software-factory
---

# Progressive Software Factory Experience V1

## What We're Building

Mission Control will present its existing governed software factory through
three progressive experience levels: Basic, Intermediate, and Advanced. The
levels change explanation density and available composition controls; they do
not change Mission, Plan, WorkOrder, Attempt, evidence, verification, policy,
or acceptance semantics.

The V1 vertical slice is one operator journey:

`Describe work -> review a rule-based recipe recommendation -> create a Mission -> review the compiled Plan workflow -> watch canonical Attempts -> inspect a phase`

## Why This Approach

Three approaches were considered:

1. Port the reference factory and visualizer. Rejected because its Python
   graph, SQLite store, local runtime assumptions, and agent-owned acceptance
   would duplicate weaker versions of Mission Control capabilities.
2. Add recipes as a new execution domain. Rejected because it would create a
   second lifecycle beside Mission -> Plan -> WorkOrder -> Attempt.
3. Add recipes and experience levels as projections over the current control
   plane. Selected because it improves accessibility while preserving one
   governed architecture.

## Key Decisions

- The existing Factory Board route becomes the progressive launch-and-observe
  workspace; no new primary navigation destination is added.
- The experience preference is browser-local operator presentation state. A
  mode change performs no mutation and cannot affect an active Attempt.
- Recipe recommendation is deterministic and explainable. Policy-sensitive
  keywords can only escalate the proposed workflow, never weaken it.
- Recipe choice, recommendation rationale, and override state are stored in the
  existing Mission metadata envelope. They grant no authority.
- A new Mission plan resolves the selected recipe to an existing active
  workflow and creates ordinary WorkOrder blueprints. The operator still edits,
  submits, and approves the Plan through the canonical release flow.
- Human, Agent, and Code lanes are presentation semantics derived from current
  trace observations. The trace and Attempt records remain authoritative.
- Missing duration, cost, token, prompt, gate, or artifact data is rendered as
  unavailable. No price, usage, or evidence is inferred.
- Basic hides raw configuration. Intermediate explains workflow composition
  and routing intent. Advanced links and exposes the existing Factory Version,
  model-routing, trace, evidence, and diagnostic surfaces.

## UX Direction

Use a restrained industrial operator-console aesthetic already established by
the EOS shell: compact type, semantic status colors, strong alignment, and
quiet surfaces. The memorable interaction is not decoration; it is the clear
separation of human attention, model judgment, and deterministic compute in a
single execution lane.

The default view answers, in order:

1. What are we building?
2. Which governed recipe is sufficient?
3. What will the operator need to approve?
4. What is running or blocked?
5. What happened inside the selected phase?

## Resolved Flow Gaps

- Empty request: recommendation waits for meaningful input and explains why.
- Operator override: the original recommendation and rationale remain stored.
- Missing telemetry: cards show `Not recorded`, never `$0` or zero tokens.
- No traces: show the next safe action rather than an empty dashboard.
- Unauthorized or stale deep links: existing server-side workspace and Factory
  permissions remain the enforcement point.
- Small screens: run cards and inspector stack; lane visualization scrolls only
  inside its bounded region.
- Storage failure: the experience selector falls back to in-memory Basic mode.
- Classification ambiguity: lane labels are explicitly marked as a derived
  presentation, while raw observation type remains available in Advanced.

## Deferred Questions

- Whether experience preference should become a synced Convex operator setting
  after Mission Control has a canonical preferences record.
- Whether deterministic gates need a dedicated registry or can be fully
  represented by versioned workflow steps plus evidence adapters.
- Whether recipe effectiveness should influence recommendations after enough
  accepted WorkOrders have comparable telemetry.

## Next Step

Implement the documented P0 slice, verify it against current demo data, and
leave typed handoff, gate-registry, and adaptive-routing work as P1/P2.
