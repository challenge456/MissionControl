# roles/support_triage_agent/onboarding/onboarding_plan.md

## Phase 1 — Role Loading
- RoleSpec + redlines + escalation tree
- Artifact templates (triage_report.json, escalation_packet.md, update_drafts)
- Definitions:
  - Severity rubric
  - "Incident vs bug" criteria
  - "Non-repro" rules

## Phase 2 — Domain Knowledge Pack
Load:
- Known issues catalog
- Component/team map and ownership directory
- Runbooks (triage, auth/login, perf, outages, data issues)
- Example "gold standard" escalation packets

## Phase 3 — Memory Seeding
- Preferences: how the org likes updates formatted
- Common pitfalls: past incidents + what was missed
- Thresholds: confidence cutoffs, when to escalate

## Phase 4 — Shadow Mode (L1)
- Agent drafts triage and comms only
- Supervisor approves actions
- Every cycle scored against eval harness

## Graduation Criteria
- Meets OfferConfig L2 requirements
- Zero policy violations
- Stable artifact quality for multiple consecutive cycles
