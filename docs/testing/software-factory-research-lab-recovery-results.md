---
date: 2026-08-01
requirement: Software Factory Research Lab recovery
result: PASS
workspace_id: sn71gskbdemgf4z1trt9zdmm5h8bde69
---

# Software Factory Research Lab Recovery Results

## Outcome

**PASS.** The original Software Factory Research Lab is available again at:

`http://localhost:5199/v2/tasks?workspace=sn71gskbdemgf4z1trt9zdmm5h8bde69`

All 115 original Task records are intact. Recovery did not reconstruct, rename,
reseed, or modify any task.

## Root Cause

Two independent local Convex databases existed:

- Port 3212: project-scoped demo data under `.convex/local/default`
- Port 3210: the original central local backend containing the Research Lab

The demo runtime was pointed at port 3212. In addition, the global
`company.context` feature flag scoped the workspace selector to the demo
company, which hid the legacy Research Lab workspace.

## Recovery Action

- Created an online SQLite safety backup before routing changes.
- Started the original Convex backend on port 3210.
- Started the local UI on port 5199 against port 3210.
- Applied the local legacy workspace visibility override
  `VITE_FLAG_COMPANY_CONTEXT=false`.
- Removed the unexecuted reconstruction code after finding the original data.
- Left the port 3212 demo database untouched.

The company-context override is limited to this local recovery runtime. It must
not weaken production tenant authorization.

## Data Verification

- Workspace: Software Factory Research Lab
- Workspace ID: `sn71gskbdemgf4z1trt9zdmm5h8bde69`
- Repository: `jaydubya818/research-agent-software-factories`
- Original tasks: 115
- Raw states: 15 Done, 32 Canceled, 34 Review, 2 In Progress, 20 Assigned,
  10 Inbox, and 2 Ready
- UI presentation: 20 legacy Assigned records appear in Ready, producing Ready
  22 without rewriting stored state

The exact 115-record inventory is in
`docs/testing/software-factory-research-lab-task-catalog.md`.

## Browser Verification

- Browser: Chromium via agent-browser
- End time: 2026-08-01 13:47:51 PDT
- Result: PASS
- Workspace selector displayed Software Factory Research Lab.
- Tasks navigation displayed 115.
- Header displayed 115 total, 58 in progress, and 13% completion.
- Reload retained the workspace query parameter and the same task inventory.
- Console errors: none in the final task and Docs browser sessions
- Failed network calls: the optional `/gateway/status` development proxy reported
  connection refused because the separate channel gateway was not running; this
  did not affect Convex workspace or task access
- Screenshots:
  - `docs/testing/evidence/software-factory-research-lab-recovery/original-workspace-final.png`
  - `docs/testing/evidence/software-factory-research-lab-recovery/recovery-docs-final.png`
- Created entity IDs: none
- Cleanup: none required; no task write was performed
- Git baseline: `69096e7`

## Safety Backup

- Path:
  `~/.codex/backups/MissionControl/software-factory-research-lab-2026-08-01.sqlite3`
- SHA-256:
  `b1b0d1f993314e1b83b19b17dc35b680c4fa6501ffc097bbc6ce0397566f4a3c`

The database backup is intentionally excluded from version control because local
application data may contain sensitive information.

## Next Bounded Improvement

Add an explicit local runtime profile for Research Lab versus Demo. The profile
must choose the intended backend and visibility mode without changing
production tenant authorization. Until that is implemented, use the verified
runtime documented above and preserve both databases.
