---
date: 2026-07-28
topic: automation-control-plane-ui-enhancement
pull_request: 39
---

# Automation Control Plane UI Enhancement

## What We’re Building

Extend the existing Operations → Automations surface into the canonical,
operator-complete control plane. The page will expose Overview, Candidates,
Definitions, Runs, Schedule, Receipts, and Decisions without introducing a
second run model or a competing Harness management surface.

The existing Convex `automationDefinitions`, `automationDecisions`,
WorkOrders, verification receipts, Workflows, and candidate suggestions remain
the sources of truth. The UI will present their relationships, exceptions, and
governance state directly.

## Why This Approach

The current route, navigation entry, query, and six focused components already
establish the correct product boundary. Replacing them would create duplicate
state and unnecessary migration risk. The bounded approach is to enrich the
existing consolidated query, add the missing Decisions and Definition detail
surfaces, and wire actions through the existing governed mutations.

## Key Decisions

- **One canonical route:** `/v2/automations` remains the management surface;
  Harness Automations only links to it.
- **WorkOrders remain Runs:** Automation evaluation produces approval-gated
  WorkOrders; no separate execution entity is introduced.
- **URL-backed operator state:** `workspace`, `tab`, `definition`, and filters
  remain in the URL so refresh, deep links, Back, and Forward are reliable.
- **Exception-first overview:** metrics and operator-attention items lead to the
  relevant filtered tab or Definition.
- **Reasoned governance actions:** candidate rejection, activation, pause,
  resume, evaluation, and retirement require explicit confirmation or reason.
- **Trusted-operator honesty:** client actor labels remain visibly identified as
  trusted-deployment assertions, never authenticated identities.
- **V1 safety boundary:** only read-only `LEVEL_1` Definitions can activate;
  evaluation creates `AWAITING_APPROVAL` WorkOrders and never dispatches.
- **Compact Command Center integration:** show posture and the next evaluation,
  then deep-link to the canonical control plane.
- **Design direction:** calm industrial operator UI using the existing EOS
  tokens, dense evidence tables, explicit status language, and restrained
  amber/green/red exception accents.

## Implementation Slices

1. Enrich `automations.getControlPlane` with Workflow posture, run lineage,
   receipt freshness/missing states, decision context, and complete metrics.
2. Add audited candidate rejection and Definition retirement mutations.
3. Expand the seven URL-backed tabs, Definition detail, filters, previews, and
   direct actions.
4. Strengthen WorkOrder lineage and add the Command Center summary.
5. Add model/component/backend tests and complete the browser journey with
   screenshots, trace, console/network review, narrow viewport, and Axe.

## Explicit Non-Scope

- Automatic approval or dispatch
- Mutating or `LEVEL_2+` automation
- A replacement scheduler or run store
- Calendar redesign
- Broad authentication/RBAC implementation
- A second Harness automation control plane

## Open Constraints

- Mission Control has no consistent authenticated operator identity; V1 is only
  acceptable behind the documented trusted-operator deployment boundary.
- Shared muted-text contrast will be changed only if the relevant token can be
  safely scoped without destabilizing unrelated surfaces.
