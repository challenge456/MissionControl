---
date: 2026-08-01
topic: software-factory-research-lab-recovery
status: recovered-original-data
---

# Software Factory Research Lab Recovery

## Outcome

The original Software Factory Research Lab was recovered without reconstructing
or rewriting any task. Its workspace ID remains
`sn71gskbdemgf4z1trt9zdmm5h8bde69`, and all 115 original Task documents remain
present.

## Why This Approach

Two local Convex state locations existed. The canonical root stack used the
project-scoped database at `.convex/local/default` on port 3212, which contains
Software Factory Demo but not the Research Lab. The original Research Lab was
still intact in Convex's central local backend state on port 3210 under
`~/.convex/convex-backend-state/local-jaydubya818-missioncontrol_df0fe/`.

The UI also had `company.context` enabled globally. That company-scoped the
workspace selector to the demo tenant and hid the Research Lab tenant. The
verified recovery runtime therefore uses port 3210 and an explicit local UI
override `VITE_FLAG_COMPANY_CONTEXT=false`.

## Key Decisions

- Do not run reconstruction: the proposed recovery mutation was removed before
  any write because the original database was discovered during its dry run.
- Do not rename or reseed the demo workspace as the Research Lab.
- Keep both databases: the 3212 demo state remains untouched.
- Back up the original database before changing runtime routing.
- Keep company-context disabled only for this legacy multi-tenant Research Lab
  runtime; do not weaken the production company authorization model.

## Known Limitation

The central local backend is development data, not a production backup system.
The runtime depends on local state and must retain an external backup plus a
documented startup path.

## Next Steps

1. Keep the safety backup under `~/.codex/backups/MissionControl/`.
2. Publish the exact task catalog and browser evidence in Mission Control Docs.
3. Add a durable launcher that selects the 3210 backend without disabling
   company authorization for other environments.
